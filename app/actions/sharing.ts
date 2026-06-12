"use server"

import { db } from "@/lib/db"
import {
  namespaces,
  shareLinks,
  boardCollaborators,
  shareActivityLog,
} from "@/lib/db/schema"
import { getSession } from "@/lib/auth/session"
import { slugify } from "@/lib/auth/crypto"
import { eq, and, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

export async function createInviteLinkAction(formData: FormData) {
  const session = await getSession()
  const userNsId = session.userNamespaceId ?? session.namespaceId
  if (!userNsId) throw new Error("Unauthorized")

  const boardId = Number(formData.get("boardId"))
  if (isNaN(boardId)) throw new Error("Invalid board ID")

  // Only the owner of the board can create share links
  if (userNsId !== boardId) {
    throw new Error("Only the board owner can create invite links.")
  }

  const linkName = formData.get("linkName")?.toString().trim() || null
  const permission = formData.get("permission")?.toString() as
    | "viewer"
    | "contributor"
    | "editor"
  if (!["viewer", "contributor", "editor"].includes(permission)) {
    throw new Error("Invalid permission level")
  }

  const expiresIn = formData.get("expiresIn")?.toString()
  let expiresAt: Date | null = null
  if (expiresIn === "7days") {
    expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
  } else if (expiresIn === "30days") {
    expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
  } else if (expiresIn === "custom") {
    const customDate = formData.get("expiresAt")?.toString()
    if (customDate) expiresAt = new Date(customDate)
  }

  const maxUsesVal = formData.get("maxUses")?.toString()
  const maxUses = maxUsesVal ? parseInt(maxUsesVal, 10) : null

  const sharedSections = formData.getAll("sharedSections") as string[]
  const requireAccount = formData.get("requireAccount") === "true"
  const finalSections = sharedSections.length > 0 ? sharedSections : ["dashboard", "resumes", "wishlist", "analytics"]

  const token = crypto.randomBytes(16).toString("hex") // 32-char token

  const [link] = await db
    .insert(shareLinks)
    .values({
      boardId,
      createdBy: userNsId,
      token,
      linkName,
      permission,
      expiresAt,
      maxUses: maxUses && !isNaN(maxUses) ? maxUses : null,
      sharedSections: finalSections,
      requireAccount,
    })
    .returning()

  // Log activity
  await db.insert(shareActivityLog).values({
    boardId,
    actorNamespaceId: userNsId,
    action: "link_created",
    targetLinkId: link.id,
    details: { linkName, permission, sharedSections: finalSections, requireAccount },
  })

  revalidatePath("/settings")
  return { success: true, link }
}

export async function revokeInviteLinkAction(linkId: string) {
  const session = await getSession()
  const userNsId = session.userNamespaceId ?? session.namespaceId
  if (!userNsId) throw new Error("Unauthorized")

  const [link] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.id, linkId))
    .limit(1)

  if (!link) throw new Error("Link not found")

  if (link.boardId !== userNsId) {
    throw new Error("Only the board owner can revoke invite links.")
  }

  await db
    .update(shareLinks)
    .set({ revokedAt: new Date() })
    .where(eq(shareLinks.id, linkId))

  // Log activity
  await db.insert(shareActivityLog).values({
    boardId: link.boardId,
    actorNamespaceId: userNsId,
    action: "link_revoked",
    targetLinkId: linkId,
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function updateCollaboratorAction(
  collaboratorId: string,
  permission: "viewer" | "contributor" | "editor",
) {
  const session = await getSession()
  const userNsId = session.userNamespaceId ?? session.namespaceId
  if (!userNsId) throw new Error("Unauthorized")

  if (!["viewer", "contributor", "editor"].includes(permission)) {
    throw new Error("Invalid permission level")
  }

  const [collab] = await db
    .select()
    .from(boardCollaborators)
    .where(eq(boardCollaborators.id, collaboratorId))
    .limit(1)

  if (!collab) throw new Error("Collaborator not found")

  if (collab.boardId !== userNsId) {
    throw new Error("Only the board owner can modify collaborator permissions.")
  }

  const oldPermission = collab.permission

  await db
    .update(boardCollaborators)
    .set({ permission })
    .where(eq(boardCollaborators.id, collaboratorId))

  // Log activity
  await db.insert(shareActivityLog).values({
    boardId: collab.boardId,
    actorNamespaceId: userNsId,
    action: "permission_changed",
    targetCollaboratorId: collaboratorId,
    details: { oldPermission, newPermission: permission },
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function revokeCollaboratorAction(collaboratorId: string) {
  const session = await getSession()
  const userNsId = session.userNamespaceId ?? session.namespaceId
  if (!userNsId) throw new Error("Unauthorized")

  const [collab] = await db
    .select()
    .from(boardCollaborators)
    .where(eq(boardCollaborators.id, collaboratorId))
    .limit(1)

  if (!collab) throw new Error("Collaborator not found")

  if (collab.boardId !== userNsId) {
    throw new Error("Only the board owner can revoke collaborator access.")
  }

  await db
    .update(boardCollaborators)
    .set({ revokedAt: new Date() })
    .where(eq(boardCollaborators.id, collaboratorId))

  // Log activity
  await db.insert(shareActivityLog).values({
    boardId: collab.boardId,
    actorNamespaceId: userNsId,
    action: "collaborator_removed",
    targetCollaboratorId: collaboratorId,
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function joinBoardWithGuestName(token: string, displayName: string) {
  // Validate token
  const [link] = await db
    .select()
    .from(shareLinks)
    .where(and(eq(shareLinks.token, token), isNull(shareLinks.revokedAt)))
    .limit(1)

  if (!link) {
    return { error: "Invite link is invalid or has been revoked." }
  }

  // Check if account is required
  if (link.requireAccount) {
    return { error: "This invite link requires an account. Please log in first." }
  }

  // Check expiration
  if (link.expiresAt && new Date() > link.expiresAt) {
    return { error: "Invite link has expired." }
  }

  // Check max uses
  if (link.maxUses !== null && link.usedCount >= link.maxUses) {
    return { error: "Invite link has reached its maximum usage limit." }
  }

  // Validate display name
  const name = displayName.trim()
  if (name.length < 2) {
    return { error: "Name must be at least 2 characters." }
  }

  const baseSlug = slugify(name) || "guest"
  let slug = baseSlug
  let isUnique = false
  let attempts = 0
  while (!isUnique && attempts < 10) {
    const existing = await db
      .select()
      .from(namespaces)
      .where(eq(namespaces.slug, slug))
      .limit(1)
    if (existing.length === 0) {
      isUnique = true
    } else {
      slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`
      attempts++
    }
  }

  // Create guest namespace
  const [guestNs] = await db
    .insert(namespaces)
    .values({
      slug,
      displayName: name,
      pinHash: null,
    })
    .returning()

  // Add collaborator row
  const [collaborator] = await db
    .insert(boardCollaborators)
    .values({
      boardId: link.boardId,
      collaboratorNamespaceId: guestNs.id,
      accessMethod: "link",
      permission: link.permission,
      joinedViaLinkId: link.id,
      sharedSections: link.sharedSections,
    })
    .returning()

  // Increment used count
  await db
    .update(shareLinks)
    .set({
      usedCount: link.usedCount + 1,
      lastUsedAt: new Date(),
    })
    .where(eq(shareLinks.id, link.id))

  // Log activity
  await db.insert(shareActivityLog).values({
    boardId: link.boardId,
    actorNamespaceId: guestNs.id,
    action: "link_used",
    targetLinkId: link.id,
    targetCollaboratorId: collaborator.id,
  })

  // Set session
  const session = await getSession()
  const targetBoard = await db
    .select()
    .from(namespaces)
    .where(eq(namespaces.id, link.boardId))
    .limit(1)
  
  if (targetBoard.length === 0) {
    return { error: "Target board not found." }
  }

  session.namespaceId = targetBoard[0].id
  session.namespaceSlug = targetBoard[0].slug
  session.displayName = targetBoard[0].displayName
  session.color = targetBoard[0].color
  session.userNamespaceId = guestNs.id
  session.accessMethod = "link"
  session.permission = link.permission as "viewer" | "contributor" | "editor"
  session.sharedSections = link.sharedSections ?? undefined
  session.isLoggedIn = true
  await session.save()

  return { success: true }
}

export async function joinBoardLoggedInAction(token: string) {
  const session = await getSession()
  const userNsId = session.userNamespaceId ?? session.namespaceId
  if (!userNsId) return { error: "Not logged in" }

  // Validate token
  const [link] = await db
    .select()
    .from(shareLinks)
    .where(and(eq(shareLinks.token, token), isNull(shareLinks.revokedAt)))
    .limit(1)

  if (!link) {
    return { error: "Invite link is invalid or has been revoked." }
  }

  // Check expiration
  if (link.expiresAt && new Date() > link.expiresAt) {
    return { error: "Invite link has expired." }
  }

  // Check max uses
  if (link.maxUses !== null && link.usedCount >= link.maxUses) {
    return { error: "Invite link has reached its maximum usage limit." }
  }

  // Check if account is required and user has one
  const [userNs] = await db
    .select({ pinHash: namespaces.pinHash })
    .from(namespaces)
    .where(eq(namespaces.id, userNsId))
    .limit(1)

  if (link.requireAccount && (!userNs || userNs.pinHash === null)) {
    return { error: "This invite link requires a registered account. Please sign in with a board PIN." }
  }

  // If already collaborator or owner, just switch board and redirect
  if (link.boardId === userNsId) {
    // Owner trying to use their own link, just switch to own board
    session.namespaceId = link.boardId
    const targetBoard = await db
      .select()
      .from(namespaces)
      .where(eq(namespaces.id, link.boardId))
      .limit(1)
    if (targetBoard.length > 0) {
      session.namespaceSlug = targetBoard[0].slug
      session.displayName = targetBoard[0].displayName
      session.color = targetBoard[0].color
    }
    session.accessMethod = "pin"
    session.permission = "owner"
    session.userNamespaceId = undefined
    session.sharedSections = undefined
    await session.save()
    return { success: true }
  }

  // Check existing active collaborator record
  const [existingCollab] = await db
    .select()
    .from(boardCollaborators)
    .where(
      and(
        eq(boardCollaborators.boardId, link.boardId),
        eq(boardCollaborators.collaboratorNamespaceId, userNsId),
        isNull(boardCollaborators.revokedAt)
      )
    )
    .limit(1)

  if (existingCollab) {
    // Update last activity and copy sharedSections / permission in case they changed
    await db
      .update(boardCollaborators)
      .set({ 
        lastActivityAt: new Date(),
        sharedSections: link.sharedSections,
        permission: link.permission,
      })
      .where(eq(boardCollaborators.id, existingCollab.id))

    // Set session to this board
    const targetBoard = await db
      .select()
      .from(namespaces)
      .where(eq(namespaces.id, link.boardId))
      .limit(1)
    
    if (targetBoard.length > 0) {
      session.namespaceId = targetBoard[0].id
      session.namespaceSlug = targetBoard[0].slug
      session.displayName = targetBoard[0].displayName
      session.color = targetBoard[0].color
      session.accessMethod = "link"
      session.permission = link.permission as any
      session.sharedSections = link.sharedSections ?? undefined
      session.userNamespaceId = userNsId // Keep tracking original namespace ID
      await session.save()
      return { success: true }
    }
  }

  // Add new collaborator row
  const [collaborator] = await db
    .insert(boardCollaborators)
    .values({
      boardId: link.boardId,
      collaboratorNamespaceId: userNsId,
      accessMethod: "link",
      permission: link.permission,
      joinedViaLinkId: link.id,
      sharedSections: link.sharedSections,
    })
    .returning()

  // Increment used count
  await db
    .update(shareLinks)
    .set({
      usedCount: link.usedCount + 1,
      lastUsedAt: new Date(),
    })
    .where(eq(shareLinks.id, link.id))

  // Log activity
  await db.insert(shareActivityLog).values({
    boardId: link.boardId,
    actorNamespaceId: userNsId,
    action: "link_used",
    targetLinkId: link.id,
    targetCollaboratorId: collaborator.id,
  })

  // Set session
  const targetBoard = await db
    .select()
    .from(namespaces)
    .where(eq(namespaces.id, link.boardId))
    .limit(1)
  
  if (targetBoard.length === 0) {
    return { error: "Target board not found." }
  }

  session.namespaceId = targetBoard[0].id
  session.namespaceSlug = targetBoard[0].slug
  session.displayName = targetBoard[0].displayName
  session.color = targetBoard[0].color
  session.accessMethod = "link"
  session.permission = link.permission as "viewer" | "contributor" | "editor"
  session.sharedSections = link.sharedSections ?? undefined
  session.userNamespaceId = userNsId // Keep tracking original namespace ID
  await session.save()

  return { success: true }
}

export async function getAccessibleBoards() {
  const session = await getSession()
  const ownBoardId = session.userNamespaceId ?? session.namespaceId
  if (!ownBoardId) return []

  // 1. Get owner's board details
  const [ownBoard] = await db
    .select({
      id: namespaces.id,
      displayName: namespaces.displayName,
      color: namespaces.color,
      slug: namespaces.slug,
    })
    .from(namespaces)
    .where(eq(namespaces.id, ownBoardId))
    .limit(1)

  if (!ownBoard) return []

  // 2. Get collaborator boards
  const collabBoards = await db
    .select({
      id: namespaces.id,
      displayName: namespaces.displayName,
      color: namespaces.color,
      slug: namespaces.slug,
      permission: boardCollaborators.permission,
    })
    .from(boardCollaborators)
    .innerJoin(namespaces, eq(namespaces.id, boardCollaborators.boardId))
    .where(
      and(
        eq(boardCollaborators.collaboratorNamespaceId, ownBoardId),
        isNull(boardCollaborators.revokedAt)
      )
    )

  // 3. Map both to a common format
  const boardsList = [
    {
      id: ownBoard.id,
      displayName: ownBoard.displayName,
      color: ownBoard.color,
      slug: ownBoard.slug,
      permission: "owner" as const,
      isCurrent: session.namespaceId === ownBoard.id,
    },
    ...collabBoards.map((b) => ({
      id: b.id,
      displayName: b.displayName,
      color: b.color,
      slug: b.slug,
      permission: b.permission as "viewer" | "contributor" | "editor",
      isCurrent: session.namespaceId === b.id,
    })),
  ]

  return boardsList
}

export async function switchBoardAction(boardId: number) {
  const session = await getSession()
  const ownBoardId = session.userNamespaceId ?? session.namespaceId
  if (!ownBoardId) throw new Error("Unauthorized")

  // 1. Check if switching to own board
  if (boardId === ownBoardId) {
    const [ns] = await db
      .select()
      .from(namespaces)
      .where(eq(namespaces.id, boardId))
      .limit(1)
    if (!ns) throw new Error("Board not found")

    session.namespaceId = ns.id
    session.namespaceSlug = ns.slug
    session.displayName = ns.displayName
    session.color = ns.color
    session.userNamespaceId = undefined // clear guest tracking
    session.accessMethod = "pin"
    session.permission = "owner"
    session.sharedSections = undefined
    await session.save()

    revalidatePath("/dashboard")
    revalidatePath("/resumes")
    revalidatePath("/wishlist")
    revalidatePath("/analytics")
    revalidatePath("/settings")
    return { success: true }
  }

  // 2. Check if they are collaborator on target board
  const [collab] = await db
    .select()
    .from(boardCollaborators)
    .where(
      and(
        eq(boardCollaborators.boardId, boardId),
        eq(boardCollaborators.collaboratorNamespaceId, ownBoardId),
        isNull(boardCollaborators.revokedAt)
      )
    )
    .limit(1)

  if (!collab) {
    throw new Error("Access denied: You are not a collaborator on this board.")
  }

  const [targetBoard] = await db
    .select()
    .from(namespaces)
    .where(eq(namespaces.id, boardId))
    .limit(1)

  if (!targetBoard) throw new Error("Board not found")

  session.namespaceId = targetBoard.id
  session.namespaceSlug = targetBoard.slug
  session.displayName = targetBoard.displayName
  session.color = targetBoard.color
  session.userNamespaceId = ownBoardId // track original board ID
  session.accessMethod = "link"
  session.permission = collab.permission as any
  session.sharedSections = collab.sharedSections ?? undefined
  await session.save()

  revalidatePath("/dashboard")
  revalidatePath("/resumes")
  revalidatePath("/wishlist")
  revalidatePath("/analytics")
  revalidatePath("/settings")
  return { success: true }
}
