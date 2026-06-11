"use server"

import { db } from "@/lib/db"
import { applications, followUpLogs } from "@/lib/db/schema"
import { requireNamespaceId } from "@/lib/auth/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cache } from "react"

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

function toBool(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true"
}

export const getApplications = cache(async () => {
  const namespaceId = await requireNamespaceId()
  try {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.namespaceId, namespaceId))
      .orderBy(desc(applications.updatedAt))
  } catch (err) {
    console.error("DATABASE_ERROR in getApplications:", err)
    if (err && typeof err === "object" && "cause" in err) {
      console.error("DATABASE_ERROR_CAUSE:", err.cause)
    }
    throw err
  }
})

export async function createApplication(formData: FormData) {
  const namespaceId = await requireNamespaceId()
  const company = toStr(formData.get("company"))
  const role = toStr(formData.get("role"))
  if (!company || !role) throw new Error("Company and role are required.")

  const status = toStr(formData.get("status")) ?? "wishlist"
  let appliedDate = toStr(formData.get("appliedDate"))
  if (status !== "wishlist" && !appliedDate) {
    appliedDate = new Date().toISOString().split("T")[0]
  }

  await db.insert(applications).values({
    namespaceId,
    company,
    role,
    location: toStr(formData.get("location")),
    workMode: toStr(formData.get("workMode")),
    status,
    priority: toStr(formData.get("priority")) ?? "medium",
    salaryMin: toInt(formData.get("salaryMin")),
    salaryMax: toInt(formData.get("salaryMax")),
    link: toStr(formData.get("link")),
    source: toStr(formData.get("source")),
    resumeId: toInt(formData.get("resumeId")),
    notes: toStr(formData.get("notes")),
    appliedDate,
    nextAction: toStr(formData.get("nextAction")),
    nextActionDate: toStr(formData.get("nextActionDate")),
    category: toStr(formData.get("category")),
    wishlistId: toInt(formData.get("wishlistId")),
    jobDescriptionRaw: toStr(formData.get("jobDescriptionRaw")),
    fitScore: toStr(formData.get("fitScore")),
    resumeTailored: toBool(formData.get("resumeTailored")),
    recruiterName: toStr(formData.get("recruiterName")),
    recruiterEmail: toStr(formData.get("recruiterEmail")),
    recruiterLinkedinUrl: toStr(formData.get("recruiterLinkedinUrl")),
    portfolioUrl: toStr(formData.get("portfolioUrl")),
    rejectionReason: toStr(formData.get("rejectionReason")),
    screeningAnswered: toBool(formData.get("screeningAnswered")),
    whyThisRole: toStr(formData.get("whyThisRole")),
    companyResearchNotes: toStr(formData.get("companyResearchNotes")),
  })

  revalidatePath("/dashboard")
  revalidatePath("/wishlist")
}

export async function updateApplication(id: number, formData: FormData) {
  const namespaceId = await requireNamespaceId()
  const status = toStr(formData.get("status")) ?? "wishlist"

  const [app] = await db
    .select()
    .from(applications)
    .where(
      and(eq(applications.id, id), eq(applications.namespaceId, namespaceId)),
    )
    .limit(1)

  if (!app) throw new Error("Application not found")

  let appliedDate = toStr(formData.get("appliedDate"))
  if (status !== "wishlist" && !appliedDate && !app.appliedDate) {
    appliedDate = new Date().toISOString().split("T")[0]
  }

  await db
    .update(applications)
    .set({
      company: toStr(formData.get("company")) ?? undefined,
      role: toStr(formData.get("role")) ?? undefined,
      location: toStr(formData.get("location")),
      workMode: toStr(formData.get("workMode")),
      status,
      priority: toStr(formData.get("priority")) ?? "medium",
      salaryMin: toInt(formData.get("salaryMin")),
      salaryMax: toInt(formData.get("salaryMax")),
      link: toStr(formData.get("link")),
      source: toStr(formData.get("source")),
      resumeId: toInt(formData.get("resumeId")),
      notes: toStr(formData.get("notes")),
      appliedDate,
      nextAction: toStr(formData.get("nextAction")),
      nextActionDate: toStr(formData.get("nextActionDate")),
      category: toStr(formData.get("category")),
      wishlistId: toInt(formData.get("wishlistId")),
      jobDescriptionRaw: toStr(formData.get("jobDescriptionRaw")),
      fitScore: toStr(formData.get("fitScore")),
      resumeTailored: toBool(formData.get("resumeTailored")),
      recruiterName: toStr(formData.get("recruiterName")),
      recruiterEmail: toStr(formData.get("recruiterEmail")),
      recruiterLinkedinUrl: toStr(formData.get("recruiterLinkedinUrl")),
      portfolioUrl: toStr(formData.get("portfolioUrl")),
      rejectionReason: toStr(formData.get("rejectionReason")),
      screeningAnswered: toBool(formData.get("screeningAnswered")),
      whyThisRole: toStr(formData.get("whyThisRole")),
      companyResearchNotes: toStr(formData.get("companyResearchNotes")),
      updatedAt: new Date(),
    })
    .where(
      and(eq(applications.id, id), eq(applications.namespaceId, namespaceId)),
    )

  revalidatePath("/dashboard")
  revalidatePath("/wishlist")
}

export async function updateApplicationStatus(id: number, status: string) {
  const namespaceId = await requireNamespaceId()

  const [app] = await db
    .select()
    .from(applications)
    .where(
      and(eq(applications.id, id), eq(applications.namespaceId, namespaceId)),
    )
    .limit(1)

  if (!app) throw new Error("Application not found")

  // Map Kanban status 'responded' to database status 'viewed'
  const targetStatus = status === "responded" ? "viewed" : status

  const updates: Partial<typeof applications.$inferInsert> = {
    status: targetStatus,
    updatedAt: new Date(),
  }

  if (targetStatus !== "wishlist" && !app.appliedDate) {
    updates.appliedDate = new Date().toISOString().split("T")[0]
  }

  await db
    .update(applications)
    .set(updates)
    .where(
      and(eq(applications.id, id), eq(applications.namespaceId, namespaceId)),
    )
  revalidatePath("/dashboard")
  revalidatePath("/wishlist")
}

export async function deleteApplication(id: number) {
  const namespaceId = await requireNamespaceId()
  await db
    .delete(applications)
    .where(
      and(eq(applications.id, id), eq(applications.namespaceId, namespaceId)),
    )
  revalidatePath("/dashboard")
  revalidatePath("/wishlist")
}

export async function importApplicationsFromJson(jsonText: string) {
  const namespaceId = await requireNamespaceId()
  
  let data: any
  try {
    data = JSON.parse(jsonText)
  } catch (err) {
    throw new Error("Invalid JSON syntax. Please check your JSON format.")
  }

  const rawItems = Array.isArray(data) ? data : [data]
  if (rawItems.length === 0 || !rawItems[0] || typeof rawItems[0] !== "object") {
    throw new Error("JSON must be a job application object or an array of job application objects.")
  }

  const validStatuses = ["wishlist", "applied", "interviewing", "offer", "rejected"]
  const validPriorities = ["low", "medium", "high"]

  const parsedItems = []
  
  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i]
    if (!item || typeof item !== "object") {
      throw new Error(`Item at index ${i} is not a valid object.`)
    }

    const company = String(item.company ?? "").trim()
    const role = String(item.role ?? "").trim()

    if (!company) {
      throw new Error(`Item at index ${i} is missing required 'company' field.`)
    }
    if (!role) {
      throw new Error(`Item at index ${i} is missing required 'role' field.`)
    }

    // Status mapping and validation
    let status = "wishlist"
    if (item.status) {
      const s = String(item.status).trim().toLowerCase()
      if (validStatuses.includes(s)) {
        status = s
      }
    }

    // Priority mapping and validation
    let priority = "medium"
    if (item.priority) {
      const p = String(item.priority).trim().toLowerCase()
      if (validPriorities.includes(p)) {
        priority = p
      }
    }

    // Safe helper functions for optional fields
    const getOptionalStr = (val: any) => {
      if (val === undefined || val === null) return null
      const s = String(val).trim()
      return s ? s : null
    }

    const getOptionalInt = (val: any) => {
      if (val === undefined || val === null) return null
      const n = Number.parseInt(String(val).trim(), 10)
      return Number.isNaN(n) ? null : n
    }

    const getOptionalDate = (val: any) => {
      if (val === undefined || val === null) return null
      const s = String(val).trim()
      if (!s) return null
      // Simple format check (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        return s
      }
      // Try parsing date and output as YYYY-MM-DD
      const d = new Date(s)
      if (Number.isNaN(d.getTime())) return null
      return d.toISOString().split("T")[0]
    }

    parsedItems.push({
      namespaceId,
      company,
      role,
      location: getOptionalStr(item.location),
      workMode: getOptionalStr(item.workMode),
      status,
      priority,
      salaryMin: getOptionalInt(item.salaryMin),
      salaryMax: getOptionalInt(item.salaryMax),
      link: getOptionalStr(item.link),
      source: getOptionalStr(item.source),
      resumeId: getOptionalInt(item.resumeId),
      notes: getOptionalStr(item.notes),
      appliedDate: getOptionalDate(item.appliedDate),
      nextAction: getOptionalStr(item.nextAction),
      nextActionDate: getOptionalDate(item.nextActionDate),
    })
  }

  // Insert in batch
  await db.insert(applications).values(parsedItems)

  revalidatePath("/dashboard")
  return { success: true, count: parsedItems.length }
}

export async function addFollowUpLog(applicationId: number, formData: FormData) {
  const namespaceId = await requireNamespaceId()
  
  const [app] = await db
    .select()
    .from(applications)
    .where(
      and(eq(applications.id, applicationId), eq(applications.namespaceId, namespaceId))
    )
    .limit(1)

  if (!app) throw new Error("Application not found")

  const method = toStr(formData.get("method"))
  if (!method) throw new Error("Method is required")

  const sentAtStr = toStr(formData.get("sentAt"))
  const sentAt = sentAtStr ? new Date(sentAtStr) : new Date()

  await db.insert(followUpLogs).values({
    applicationId,
    method,
    sentAt,
    content: toStr(formData.get("content")),
    responseReceived: toBool(formData.get("responseReceived")),
    responseNote: toStr(formData.get("responseNote")),
  })

  revalidatePath("/dashboard")
}

export async function deleteFollowUpLog(logId: number) {
  const namespaceId = await requireNamespaceId()

  const [log] = await db
    .select({
      id: followUpLogs.id,
      applicationId: followUpLogs.applicationId,
    })
    .from(followUpLogs)
    .innerJoin(applications, eq(followUpLogs.applicationId, applications.id))
    .where(
      and(eq(followUpLogs.id, logId), eq(applications.namespaceId, namespaceId))
    )
    .limit(1)

  if (!log) throw new Error("Follow-up log not found or unauthorized")

  await db.delete(followUpLogs).where(eq(followUpLogs.id, logId))

  revalidatePath("/dashboard")
}

export async function toggleFollowUpResponse(
  logId: number,
  received: boolean,
  responseNote?: string
) {
  const namespaceId = await requireNamespaceId()

  const [log] = await db
    .select({
      id: followUpLogs.id,
      applicationId: followUpLogs.applicationId,
    })
    .from(followUpLogs)
    .innerJoin(applications, eq(followUpLogs.applicationId, applications.id))
    .where(
      and(eq(followUpLogs.id, logId), eq(applications.namespaceId, namespaceId))
    )
    .limit(1)

  if (!log) throw new Error("Follow-up log not found or unauthorized")

  await db
    .update(followUpLogs)
    .set({
      responseReceived: received,
      responseNote: responseNote ?? null,
    })
    .where(eq(followUpLogs.id, logId))

  revalidatePath("/dashboard")
}

export async function getFollowUpLogs(applicationId: number) {
  const namespaceId = await requireNamespaceId()

  return db
    .select({
      id: followUpLogs.id,
      applicationId: followUpLogs.applicationId,
      method: followUpLogs.method,
      sentAt: followUpLogs.sentAt,
      content: followUpLogs.content,
      responseReceived: followUpLogs.responseReceived,
      responseNote: followUpLogs.responseNote,
    })
    .from(followUpLogs)
    .innerJoin(applications, eq(followUpLogs.applicationId, applications.id))
    .where(
      and(
        eq(followUpLogs.applicationId, applicationId),
        eq(applications.namespaceId, namespaceId)
      )
    )
    .orderBy(desc(followUpLogs.sentAt))
}

