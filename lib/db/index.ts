import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables")
}

const originalSql = neon(process.env.DATABASE_URL, {
  fetchOptions: {
    cache: "no-store",
  },
})

// Retry wrapper to gracefully handle Neon database cold starts and transient network errors
const sqlWithRetry = async (strings: TemplateStringsArray, ...params: any[]) => {
  let retries = 3
  let delay = 1500
  while (retries > 0) {
    try {
      return await originalSql(strings, ...params)
    } catch (err: any) {
      retries--
      const isNetworkError =
        err instanceof Error &&
        (err.message.toLowerCase().includes("fetch failed") ||
          err.message.toLowerCase().includes("timeout") ||
          err.message.toLowerCase().includes("etimedout") ||
          err.message.toLowerCase().includes("neondberror"))

      if (isNetworkError && retries > 0) {
        console.warn(
          `Database query failed (fetch/timeout). Retrying in ${delay}ms... (Retries left: ${retries})`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2
        continue
      }
      throw err
    }
  }
  throw new Error("Database query failed after retries")
}

// Map the full NeonQueryFunction interface for Drizzle compatibility
Object.assign(sqlWithRetry, originalSql)

sqlWithRetry.query = async (pattern: string, params: any[], options: any) => {
  let retries = 3
  let delay = 1500
  while (retries > 0) {
    try {
      return await originalSql.query(pattern, params, options)
    } catch (err: any) {
      retries--
      const isNetworkError =
        err instanceof Error &&
        (err.message.toLowerCase().includes("fetch failed") ||
          err.message.toLowerCase().includes("timeout") ||
          err.message.toLowerCase().includes("etimedout") ||
          err.message.toLowerCase().includes("neondberror"))

      if (isNetworkError && retries > 0) {
        console.warn(
          `Database query failed (fetch/timeout). Retrying in ${delay}ms... (Retries left: ${retries})`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2
        continue
      }
      throw err
    }
  }
  throw new Error("Database query failed after retries")
}

sqlWithRetry.unsafe = originalSql.unsafe

export const db = drizzle({ client: sqlWithRetry as any, schema })
