import { getIronSession, type SessionOptions } from "iron-session"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { boardCollaborators } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"

export interface SessionData {
  namespaceId?: number
  userNamespaceId?: number
  namespaceSlug?: string
  displayName?: string
  color?: string
  accessMethod?: "pin" | "link"
  permission?: "owner" | "editor" | "contributor" | "viewer"
  isLoggedIn?: boolean
  sharedSections?: string[]
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
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  if (session.namespaceId && !session.permission) {
    session.permission = "owner"
  }
  if (session.namespaceId && session.permission !== "owner") {
    try {
      const collaboratorId = session.userNamespaceId ?? session.namespaceId
      const [collab] = await db
        .select({
          id: boardCollaborators.id,
          permission: boardCollaborators.permission,
          sharedSections: boardCollaborators.sharedSections,
        })
        .from(boardCollaborators)
        .where(
          and(
            eq(boardCollaborators.boardId, session.namespaceId),
            eq(boardCollaborators.collaboratorNamespaceId, collaboratorId),
            isNull(boardCollaborators.revokedAt)
          )
        )
        .limit(1)

      if (!collab) {
        session.namespaceId = undefined
        session.userNamespaceId = undefined
        session.namespaceSlug = undefined
        session.displayName = undefined
        session.color = undefined
        session.permission = undefined
        session.sharedSections = undefined
        session.accessMethod = undefined
        session.isLoggedIn = false
      } else {
        session.permission = collab.permission as "viewer" | "contributor" | "editor"
        session.sharedSections = collab.sharedSections ?? undefined
      }
    } catch (err) {
      console.error("Error verifying collaborator session:", err)
    }
  }
  return session
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

const PERMISSION_LEVELS = {
  viewer: 1,
  contributor: 2,
  editor: 3,
  owner: 4,
} as const

export function hasPermission(
  userRole: "owner" | "editor" | "contributor" | "viewer" | undefined,
  requiredRole: "owner" | "editor" | "contributor" | "viewer"
): boolean {
  if (!userRole) return false
  return PERMISSION_LEVELS[userRole] >= PERMISSION_LEVELS[requiredRole]
}

export async function requirePermission(
  requiredRole: "owner" | "editor" | "contributor" | "viewer"
) {
  const session = await getSession()
  if (!session.namespaceId || !session.permission) {
    throw new Error("Unauthorized")
  }
  if (!hasPermission(session.permission, requiredRole)) {
    throw new Error("Forbidden: Insufficient permissions")
  }
  return session
}

export function isSectionAllowed(session: SessionData, section: string): boolean {
  if (!session.namespaceId) return false
  if (session.permission === "owner") return true
  if (!session.sharedSections) return true
  return session.sharedSections.includes(section)
}

export async function requireSectionAccess(section: string) {
  const session = await getSession()
  if (!session.namespaceId) {
    throw new Error("Unauthorized")
  }
  if (!isSectionAllowed(session, section)) {
    throw new Error("Forbidden: Section access restricted")
  }
  return session
}


