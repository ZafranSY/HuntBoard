import { getIronSession, type SessionOptions } from "iron-session"
import { cookies } from "next/headers"

export interface SessionData {
  namespaceId?: number
  slug?: string
  displayName?: string
}

const SESSION_SECRET =
  process.env.SESSION_SECRET ??
  "huntboard-dev-secret-at-least-32-chars-long!!"

export const sessionOptions: SessionOptions = {
  password: SESSION_SECRET,
  cookieName: "huntboard_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
}

export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

/**
 * Returns the logged-in namespace id or throws. Use in server actions
 * that mutate or read namespace-scoped data the current user owns.
 */
export async function requireNamespaceId(): Promise<number> {
  const session = await getSession()
  if (!session.namespaceId) throw new Error("Unauthorized")
  return session.namespaceId
}
