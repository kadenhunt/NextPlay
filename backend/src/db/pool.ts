import { Pool } from "pg";

import { env } from "../config/env";

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (!env.databaseUrl) {
    return null;
  }

  if (!pool) {
    pool = new Pool({ connectionString: env.databaseUrl });
  }

  return pool;
}
