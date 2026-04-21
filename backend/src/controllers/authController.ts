import type { Request, Response } from "express";

import {
  AuthConfigurationError,
  AuthRequestError,
  buildAuthCookie,
  clearAuthCookie,
  getAuthCookieName,
  loginUser,
  registerUser,
  verifySessionToken,
} from "../services/authService";

const sendJsonError = (response: Response, status: number, message: string): void => {
  response.status(status).json({ message });
};

export const getSession = (request: Request, response: Response): void => {
  try {
    const token = request.cookies?.[getAuthCookieName()] as string | undefined;
    if (!token) {
      response.status(401).json({ message: "Not authenticated" });
      return;
    }

    const user = verifySessionToken(token);
    response.status(200).json({ user });
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      sendJsonError(response, error.statusCode, error.message);
      return;
    }
    if (error instanceof AuthRequestError) {
      sendJsonError(response, error.statusCode, error.message);
      return;
    }
    sendJsonError(response, 500, "Unexpected session error");
  }
};

export const login = async (request: Request, response: Response): Promise<void> => {
  try {
    const body = request.body as { email?: string; password?: string };
    const result = await loginUser({
      email: typeof body.email === "string" ? body.email : "",
      password: typeof body.password === "string" ? body.password : "",
    });

    response.setHeader("Set-Cookie", buildAuthCookie(result.token));
    response.status(200).json({
      user: {
        id: result.id,
        email: result.email,
        displayName: result.displayName,
        emailVerified: result.emailVerified,
      },
    });
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      sendJsonError(response, error.statusCode, error.message);
      return;
    }
    if (error instanceof AuthRequestError) {
      sendJsonError(response, error.statusCode, error.message);
      return;
    }
    sendJsonError(response, 500, "Unexpected login error");
  }
};

export const register = async (request: Request, response: Response): Promise<void> => {
  try {
    const body = request.body as { email?: string; password?: string; displayName?: string };
    const result = await registerUser({
      email: typeof body.email === "string" ? body.email : "",
      password: typeof body.password === "string" ? body.password : "",
      displayName: typeof body.displayName === "string" ? body.displayName : "",
    });

    response.setHeader("Set-Cookie", buildAuthCookie(result.token));
    response.status(201).json({
      user: {
        id: result.id,
        email: result.email,
        displayName: result.displayName,
        emailVerified: result.emailVerified,
      },
    });
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      sendJsonError(response, error.statusCode, error.message);
      return;
    }
    if (error instanceof AuthRequestError) {
      sendJsonError(response, error.statusCode, error.message);
      return;
    }
    sendJsonError(response, 500, "Unexpected register error");
  }
};

export const logout = (_request: Request, response: Response): void => {
  response.setHeader("Set-Cookie", clearAuthCookie());
  response.status(204).end();
};
