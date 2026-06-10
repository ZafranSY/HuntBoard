"use server"

import { db } from "@/lib/db"
import { resumes } from "@/lib/db/schema"
import { requireNamespaceId } from "@/lib/auth/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cache } from "react"

function toStr(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim()
  return s ? s : null
}

export const getResumes = cache(async () => {
  const namespaceId = await requireNamespaceId()
  return db
    .select()
    .from(resumes)
    .where(eq(resumes.namespaceId, namespaceId))
    .orderBy(desc(resumes.updatedAt))
})

export async function createResume(formData: FormData) {
  const namespaceId = await requireNamespaceId()
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
  const namespaceId = await requireNamespaceId()
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
  const namespaceId = await requireNamespaceId()
  await db
    .delete(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.namespaceId, namespaceId)))
  revalidatePath("/resumes")
  revalidatePath("/dashboard")
}
