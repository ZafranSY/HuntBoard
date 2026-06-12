"use server"

import { db } from "@/lib/db"
import { resumes } from "@/lib/db/schema"
import { requirePermission, requireSectionAccess } from "@/lib/auth/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cache } from "react"

function toStr(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim()
  return s ? s : null
}

export const getResumes = cache(async () => {
  const session = await requirePermission("viewer")
  await requireSectionAccess("resumes")
  const namespaceId = session.namespaceId!
  try {
    return await db
      .select()
      .from(resumes)
      .where(eq(resumes.namespaceId, namespaceId))
      .orderBy(desc(resumes.updatedAt))
  } catch (err) {
    console.error("DATABASE_ERROR in getResumes:", err)
    if (err && typeof err === "object" && "cause" in err) {
      console.error("DATABASE_ERROR_CAUSE:", err.cause)
    }
    throw err
  }
})

export async function createResume(formData: FormData) {
  const session = await requirePermission("editor")
  await requireSectionAccess("resumes")
  const namespaceId = session.namespaceId!
  const name = toStr(formData.get("name"))
  if (!name) throw new Error("Resume name is required.")

  await db.insert(resumes).values({
    namespaceId,
    name,
    version: toStr(formData.get("version")),
    targetRole: toStr(formData.get("targetRole")),
    notes: toStr(formData.get("notes")),
    link: toStr(formData.get("link")),
    isActive: formData.get("isActive") === "on",
  })

  revalidatePath("/resumes")
  revalidatePath("/dashboard")
}

export async function updateResume(id: number, formData: FormData) {
  const session = await requirePermission("editor")
  await requireSectionAccess("resumes")
  const namespaceId = session.namespaceId!
  await db
    .update(resumes)
    .set({
      name: toStr(formData.get("name")) ?? undefined,
      version: toStr(formData.get("version")),
      targetRole: toStr(formData.get("targetRole")),
      notes: toStr(formData.get("notes")),
      link: toStr(formData.get("link")),
      isActive: formData.get("isActive") === "on",
      updatedAt: new Date(),
    })
    .where(and(eq(resumes.id, id), eq(resumes.namespaceId, namespaceId)))

  revalidatePath("/resumes")
  revalidatePath("/dashboard")
}

export async function deleteResume(id: number) {
  const session = await requirePermission("editor")
  await requireSectionAccess("resumes")
  const namespaceId = session.namespaceId!
  await db
    .delete(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.namespaceId, namespaceId)))
  revalidatePath("/resumes")
  revalidatePath("/dashboard")
}

