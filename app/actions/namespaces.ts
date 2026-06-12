"use server"

import { db } from "@/lib/db"
import { namespaces, boardCollaborators, shareActivityLog } from "@/lib/db/schema"
import { requirePermission } from "@/lib/auth/session"
import { verifyPin, hashPin } from "@/lib/auth/crypto"
import { eq, and, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function updateWeeklyGoal(goal: number) {
  const session = await requirePermission("owner")
  const namespaceId = session.namespaceId!
  if (goal < 1) throw new Error("Goal must be at least 1.")

  await db
    .update(namespaces)
    .set({ weeklyGoal: goal })
    .where(eq(namespaces.id, namespaceId))

  revalidatePath("/dashboard")
  revalidatePath("/resumes")
  revalidatePath("/wishlist")
  revalidatePath("/settings")
}

export async function updateNamespaceSettings(
  displayName: string,
  weeklyGoal: number
) {
  const session = await requirePermission("owner")
  const namespaceId = session.namespaceId!

  const trimmedName = displayName.trim()
  if (trimmedName.length < 2) {
    throw new Error("Board name must be at least 2 characters.")
  }
  if (weeklyGoal < 1) {
    throw new Error("Weekly goal must be at least 1.")
  }

  await db
    .update(namespaces)
    .set({
      displayName: trimmedName,
      weeklyGoal,
    })
    .where(eq(namespaces.id, namespaceId))

  session.displayName = trimmedName
  await session.save()

  revalidatePath("/dashboard")
  revalidatePath("/resumes")
  revalidatePath("/wishlist")
  revalidatePath("/settings")

  return { success: true }
}

export async function changePinAction(oldPin: string, newPin: string) {
  const session = await requirePermission("owner")
  const namespaceId = session.namespaceId!

  if (!/^\d{4,8}$/.test(newPin)) {
    throw new Error("New PIN must be 4-8 digits.")
  }

  const [ns] = await db
    .select()
    .from(namespaces)
    .where(eq(namespaces.id, namespaceId))
    .limit(1)

  if (!ns) throw new Error("Board not found.")

  if (ns.pinHash) {
    if (!verifyPin(oldPin, ns.pinHash)) {
      throw new Error("Incorrect current PIN.")
    }
  }

  await db
    .update(namespaces)
    .set({ pinHash: hashPin(newPin) })
    .where(eq(namespaces.id, namespaceId))

  revalidatePath("/settings")
  return { success: true }
}

export async function disablePinAction() {
  const session = await requirePermission("owner")
  const namespaceId = session.namespaceId!

  await db
    .update(namespaces)
    .set({ pinHash: null })
    .where(eq(namespaces.id, namespaceId))

  revalidatePath("/settings")
  return { success: true }
}

export async function enablePinAction(pin: string) {
  const session = await requirePermission("owner")
  const namespaceId = session.namespaceId!

  if (!/^\d{4,8}$/.test(pin)) {
    throw new Error("PIN must be 4-8 digits.")
  }

  await db
    .update(namespaces)
    .set({ pinHash: hashPin(pin) })
    .where(eq(namespaces.id, namespaceId))

  revalidatePath("/settings")
  return { success: true }
}

export async function removeAllCollaboratorsAction() {
  const session = await requirePermission("owner")
  const namespaceId = session.namespaceId!

  await db
    .update(boardCollaborators)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(boardCollaborators.boardId, namespaceId),
        isNull(boardCollaborators.revokedAt)
      )
    )

  // Log activity
  await db.insert(shareActivityLog).values({
    boardId: namespaceId,
    actorNamespaceId: namespaceId,
    action: "collaborator_removed",
    details: { message: "All collaborators removed" }
  })

  revalidatePath("/settings")
  return { success: true }
}
