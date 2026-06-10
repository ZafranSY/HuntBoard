"use server"

import { db } from "@/lib/db"
import { applications } from "@/lib/db/schema"
import { requireNamespaceId } from "@/lib/auth/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

function toInt(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim()
  if (!s) return null
  const n = Number.parseInt(s, 10)
  return Number.isNaN(n) ? null : n
}

function toStr(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim()
  return s ? s : null
}

export async function getApplications() {
  const namespaceId = await requireNamespaceId()
  return db
    .select()
    .from(applications)
    .where(eq(applications.namespaceId, namespaceId))
    .orderBy(desc(applications.updatedAt))
}

export async function createApplication(formData: FormData) {
  const namespaceId = await requireNamespaceId()
  const company = toStr(formData.get("company"))
  const role = toStr(formData.get("role"))
  if (!company || !role) throw new Error("Company and role are required.")

  await db.insert(applications).values({
    namespaceId,
    company,
    role,
    location: toStr(formData.get("location")),
    workMode: toStr(formData.get("workMode")),
    status: toStr(formData.get("status")) ?? "wishlist",
    priority: toStr(formData.get("priority")) ?? "medium",
    salaryMin: toInt(formData.get("salaryMin")),
    salaryMax: toInt(formData.get("salaryMax")),
    link: toStr(formData.get("link")),
    source: toStr(formData.get("source")),
    resumeId: toInt(formData.get("resumeId")),
    notes: toStr(formData.get("notes")),
    appliedDate: toStr(formData.get("appliedDate")),
    nextAction: toStr(formData.get("nextAction")),
    nextActionDate: toStr(formData.get("nextActionDate")),
  })

  revalidatePath("/dashboard")
}

export async function updateApplication(id: number, formData: FormData) {
  const namespaceId = await requireNamespaceId()
  await db
    .update(applications)
    .set({
      company: toStr(formData.get("company")) ?? undefined,
      role: toStr(formData.get("role")) ?? undefined,
      location: toStr(formData.get("location")),
      workMode: toStr(formData.get("workMode")),
      status: toStr(formData.get("status")) ?? "wishlist",
      priority: toStr(formData.get("priority")) ?? "medium",
      salaryMin: toInt(formData.get("salaryMin")),
      salaryMax: toInt(formData.get("salaryMax")),
      link: toStr(formData.get("link")),
      source: toStr(formData.get("source")),
      resumeId: toInt(formData.get("resumeId")),
      notes: toStr(formData.get("notes")),
      appliedDate: toStr(formData.get("appliedDate")),
      nextAction: toStr(formData.get("nextAction")),
      nextActionDate: toStr(formData.get("nextActionDate")),
      updatedAt: new Date(),
    })
    .where(
      and(eq(applications.id, id), eq(applications.namespaceId, namespaceId)),
    )

  revalidatePath("/dashboard")
}

export async function updateApplicationStatus(id: number, status: string) {
  const namespaceId = await requireNamespaceId()
  await db
    .update(applications)
    .set({ status, updatedAt: new Date() })
    .where(
      and(eq(applications.id, id), eq(applications.namespaceId, namespaceId)),
    )
  revalidatePath("/dashboard")
}

export async function deleteApplication(id: number) {
  const namespaceId = await requireNamespaceId()
  await db
    .delete(applications)
    .where(
      and(eq(applications.id, id), eq(applications.namespaceId, namespaceId)),
    )
  revalidatePath("/dashboard")
}
