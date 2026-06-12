import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { namespaces, boardCollaborators, shareLinks, shareActivityLog } from "@/lib/db/schema"
import { eq, and, isNull, desc } from "drizzle-orm"
import { SettingsClient } from "@/components/settings-client"

export default async function SettingsPage() {
  const session = await getSession()
  if (!session.namespaceId) {
    redirect("/")
  }

  // Check permission: only owner and editor can access settings
  if (!session.permission || (session.permission !== "owner" && session.permission !== "editor")) {
    redirect("/dashboard")
  }

  const sessionPermission = session.permission
  const isOwner = sessionPermission === "owner"
  const boardId = session.namespaceId

  const [ns] = await db
    .select()
    .from(namespaces)
    .where(eq(namespaces.id, boardId))
    .limit(1)

  if (!ns) redirect("/dashboard")

  const collaborators = await db
    .select({
      id: boardCollaborators.id,
      displayName: namespaces.displayName,
      color: namespaces.color,
      permission: boardCollaborators.permission,
      joinedAt: boardCollaborators.joinedAt,
      lastActivityAt: boardCollaborators.lastActivityAt,
      collaboratorNamespaceId: boardCollaborators.collaboratorNamespaceId,
      sharedSections: boardCollaborators.sharedSections,
    })
    .from(boardCollaborators)
    .innerJoin(namespaces, eq(boardCollaborators.collaboratorNamespaceId, namespaces.id))
    .where(
      and(
        eq(boardCollaborators.boardId, boardId),
        isNull(boardCollaborators.revokedAt)
      )
    )

  let inviteLinksList: any[] = []
  let activityLogs: any[] = []

  if (isOwner) {
    inviteLinksList = await db
      .select()
      .from(shareLinks)
      .where(
        and(
          eq(shareLinks.boardId, boardId),
          isNull(shareLinks.revokedAt)
        )
      )

    activityLogs = await db
      .select({
        id: shareActivityLog.id,
        action: shareActivityLog.action,
        createdAt: shareActivityLog.createdAt,
        actorName: namespaces.displayName,
        details: shareActivityLog.details,
      })
      .from(shareActivityLog)
      .leftJoin(namespaces, eq(shareActivityLog.actorNamespaceId, namespaces.id))
      .where(eq(shareActivityLog.boardId, boardId))
      .orderBy(desc(shareActivityLog.createdAt))
  }

  return (
    <SettingsClient
      namespace={ns}
      sessionPermission={sessionPermission}
      collaborators={collaborators}
      inviteLinks={inviteLinksList}
      activityLog={activityLogs}
    />
  )
}
