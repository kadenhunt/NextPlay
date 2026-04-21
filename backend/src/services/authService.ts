import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { getPool } from "../db/pool";
import type { AuthLoginResult, SessionUser } from "../types/auth";

const COOKIE_NAME = "np_session";
const TOKEN_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

export type { SessionUser };

export class AuthConfigurationError extends Error {
  readonly statusCode = 503;

  constructor(message: string) {
    super(message);
    this.name = "AuthConfigurationError";
  }
}

export class AuthRequestError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AuthRequestError";
    this.statusCode = statusCode;
  }
}

function assertAuthConfigured(): void {
  if (!env.databaseUrl || !env.jwtSecret) {
    throw new AuthConfigurationError(
      "Server auth is not configured (set DATABASE_URL and JWT_SECRET in backend/.env).",
    );
  }
}

function signToken(user: { userId: number; email: string; displayName: string; emailVerified: boolean }): string {
  assertAuthConfigured();
  return jwt.sign(
    {
      sub: String(user.userId),
      email: user.email,
      displayName: user.displayName,
      ev: user.emailVerified,
    },
    env.jwtSecret!,
    { expiresIn: TOKEN_TTL_SEC },
  );
}

export function verifySessionToken(token: string): SessionUser {
  assertAuthConfigured();
  try {
    const payload = jwt.verify(token, env.jwtSecret!) as jwt.JwtPayload;
    const sub = typeof payload.sub === "string" ? payload.sub : String(payload.sub ?? "");
    if (!sub) {
      throw new AuthRequestError("Invalid session", 401);
    }

    return {
      id: sub,
      email: typeof payload.email === "string" ? payload.email : "",
      displayName: typeof payload.displayName === "string" ? payload.displayName : "",
      emailVerified: Boolean(payload.ev),
    };
  } catch {
    throw new AuthRequestError("Invalid or expired session", 401);
  }
}

export function getAuthCookieName(): string {
  return COOKIE_NAME;
}

export function buildAuthCookie(token: string): string {
  const secure = env.nodeEnv === "production";
  const parts = [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${TOKEN_TTL_SEC}`,
  ];
  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function clearAuthCookie(): string {
  const secure = env.nodeEnv === "production";
  const parts = [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthLoginResult> {
  assertAuthConfigured();
  const pool = getPool();
  if (!pool) {
    throw new AuthConfigurationError("Database pool is not available.");
  }

  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  if (email.length < 3 || !email.includes("@")) {
    throw new AuthRequestError("Enter a valid email", 400);
  }
  if (input.password.length < 8) {
    throw new AuthRequestError("Password must be at least 8 characters", 400);
  }
  if (displayName.length < 2) {
    throw new AuthRequestError("Display name is required", 400);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    const result = await pool.query<{ user_id: number }>(
      `INSERT INTO public."Users" (email, password_hash, display_name, email_verified)
       VALUES ($1, $2, $3, false)
       RETURNING user_id`,
      [email, passwordHash, displayName],
    );

    const userId = result.rows[0]?.user_id;
    if (userId == null) {
      throw new AuthRequestError("Unable to create account", 500);
    }

    const token = signToken({
      userId,
      email,
      displayName,
      emailVerified: false,
    });

    return {
      id: String(userId),
      email,
      displayName,
      emailVerified: false,
      token,
    };
  } catch (err: unknown) {
    const code = typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
    if (code === "23505") {
      throw new AuthRequestError("An account with this email already exists", 409);
    }
    throw err;
  }
}

export async function loginUser(input: { email: string; password: string }): Promise<AuthLoginResult> {
  assertAuthConfigured();
  const pool = getPool();
  if (!pool) {
    throw new AuthConfigurationError("Database pool is not available.");
  }

  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) {
    throw new AuthRequestError("Invalid email or password", 400);
  }

  const result = await pool.query<{
    user_id: number;
    password_hash: string;
    display_name: string | null;
    email_verified: boolean | null;
  }>(
    `SELECT user_id, password_hash, display_name, email_verified
     FROM public."Users"
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email],
  );

  const row = result.rows[0];
  if (!row?.password_hash) {
    throw new AuthRequestError("Invalid email or password", 401);
  }

  const ok = await bcrypt.compare(input.password, row.password_hash);
  if (!ok) {
    throw new AuthRequestError("Invalid email or password", 401);
  }

  const displayName = row.display_name?.trim() || email.split("@")[0] || "Player";
  const token = signToken({
    userId: row.user_id,
    email,
    displayName,
    emailVerified: Boolean(row.email_verified),
  });

  return {
    id: String(row.user_id),
    email,
    displayName,
    emailVerified: Boolean(row.email_verified),
    token,
  };
}
