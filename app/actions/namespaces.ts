"use server"

import { db } from "@/lib/db"
import { namespaces } from "@/lib/db/schema"
import { requireNamespaceId } from "@/lib/auth/session"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function updateWeeklyGoal(goal: number) {
  const namespaceId = await requireNamespaceId()
  if (goal < 1) throw new Error("Goal must be at least 1.")

  await db
    .update(namespaces)
    .set({ weeklyGoal: goal })
    .where(eq(namespaces.id, namespaceId))

  revalidatePath("/dashboard")
  revalidatePath("/resumes")
}
