"use server"

import { db } from "@/lib/db"
import { wishlist, applications } from "@/lib/db/schema"
import { requirePermission, requireSectionAccess } from "@/lib/auth/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { cache } from "react"

function toStr(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim()
  return s ? s : null
}

export const getWishlistItems = cache(async () => {
  await requirePermission("viewer")
  await requireSectionAccess("wishlist")
  return db
    .select()
    .from(wishlist)
    .orderBy(desc(wishlist.createdAt))
})

export async function createWishlistItem(formData: FormData) {
  const session = await requirePermission("contributor")
  await requireSectionAccess("wishlist")
  const namespaceId = session.namespaceId!
  const userNsId = session.userNamespaceId ?? session.namespaceId!
  const company = toStr(formData.get("company"))
  const role = toStr(formData.get("role"))
  if (!company) throw new Error("Company name is required.")

  await db.insert(wishlist).values({
    addedByNamespaceId: userNsId,
    company,
    role,
    location: toStr(formData.get("location")),
    priority: toStr(formData.get("priority")) ?? "medium",
    link: toStr(formData.get("link")),
    notes: toStr(formData.get("notes")),
    category: toStr(formData.get("category")),
  })

  revalidatePath("/wishlist")
}

export async function updateWishlistItem(id: number, formData: FormData) {
  const session = await requirePermission("contributor")
  await requireSectionAccess("wishlist")
  const namespaceId = session.namespaceId!
  const userNsId = session.userNamespaceId ?? session.namespaceId!

  const [item] = await db
    .select()
    .from(wishlist)
    .where(eq(wishlist.id, id))
    .limit(1)

  if (!item) throw new Error("Wishlist item not found")

  if (session.permission === "contributor" && item.addedByNamespaceId !== userNsId) {
    throw new Error("Forbidden: You can only edit your own wishlist items.")
  }

  await db
    .update(wishlist)
    .set({
      company: toStr(formData.get("company")) ?? undefined,
      role: toStr(formData.get("role")),
      location: toStr(formData.get("location")),
      priority: toStr(formData.get("priority")) ?? "medium",
      link: toStr(formData.get("link")),
      notes: toStr(formData.get("notes")),
      category: toStr(formData.get("category")),
      updatedAt: new Date(),
    })
    .where(eq(wishlist.id, id))

  revalidatePath("/wishlist")
}

export async function deleteWishlistItem(id: number) {
  const session = await requirePermission("contributor")
  await requireSectionAccess("wishlist")
  const namespaceId = session.namespaceId!
  const userNsId = session.userNamespaceId ?? session.namespaceId!

  const [item] = await db
    .select()
    .from(wishlist)
    .where(eq(wishlist.id, id))
    .limit(1)

  if (!item) throw new Error("Wishlist item not found")

  if (session.permission === "contributor" && item.addedByNamespaceId !== userNsId) {
    throw new Error("Forbidden: You can only delete your own wishlist items.")
  }

  await db.delete(wishlist).where(eq(wishlist.id, id))

  revalidatePath("/wishlist")
}

export async function claimWishlistItem(id: number, type: "apply" | "wishlist") {
  const session = await requirePermission("contributor")
  await requireSectionAccess("wishlist")
  const namespaceId = session.namespaceId!
  const userNsId = session.userNamespaceId ?? session.namespaceId!

  const [item] = await db
    .select()
    .from(wishlist)
    .where(eq(wishlist.id, id))
    .limit(1)

  if (!item) throw new Error("Wishlist item not found")

  const existing = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.namespaceId, namespaceId),
        eq(applications.wishlistId, id),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    if (type === "apply" && existing[0].status === "wishlist") {
      await db
        .update(applications)
        .set({
          status: "applied",
          appliedDate: new Date().toISOString().split("T")[0],
          updatedAt: new Date(),
        })
        .where(eq(applications.id, existing[0].id))
    }
  } else {
    await db.insert(applications).values({
      namespaceId,
      createdBy: userNsId,
      company: item.company,
      role: item.role ?? "Unknown Role",
      location: item.location,
      status: type === "apply" ? "applied" : "wishlist",
      appliedDate: type === "apply" ? new Date().toISOString().split("T")[0] : null,
      priority: item.priority,
      link: item.link,
      notes: item.notes,
      wishlistId: item.id,
      category: item.category,
    })
  }

  revalidatePath("/wishlist")
  revalidatePath("/dashboard")
}

export async function importWishlistItems(items: any[]) {
  const session = await requirePermission("contributor")
  await requireSectionAccess("wishlist")
  const namespaceId = session.namespaceId!
  const userNsId = session.userNamespaceId ?? session.namespaceId!

  const valuesToInsert = items.map((item) => {
    const company = String(item.company || item.Company || item.company_name || "").trim()
    if (!company) {
      throw new Error("Each imported job must have a company name.")
    }

    const priority = String(item.priority || item.Priority || "medium").trim().toLowerCase()
    const validPriority = ["low", "medium", "high"].includes(priority) ? priority : "medium"

    return {
      addedByNamespaceId: userNsId,
      company,
      role: String(item.role || item.Role || item.title || item.position || "").trim() || null,
      location: String(item.location || item.Location || "").trim() || null,
      priority: validPriority,
      link: String(item.link || item.Link || item.url || "").trim() || null,
      notes: String(item.notes || item.Notes || "").trim() || null,
      category: String(item.category || item.Category || "").trim() || null,
    }
  })

  if (valuesToInsert.length > 0) {
    await db.insert(wishlist).values(valuesToInsert)
  }

  revalidatePath("/wishlist")
}

export async function renameWishlistCategory(oldName: string, newName: string) {
  const session = await requirePermission("editor")
  await requireSectionAccess("wishlist")
  const namespaceId = session.namespaceId!

  const trimmedOld = oldName.trim()
  const trimmedNew = newName.trim()
  if (!trimmedOld || !trimmedNew) {
    throw new Error("Category names cannot be empty.")
  }

  await db
    .update(wishlist)
    .set({ category: trimmedNew })
    .where(
      and(
        eq(wishlist.category, trimmedOld),
        eq(wishlist.addedByNamespaceId, namespaceId)
      )
    )

  await db
    .update(applications)
    .set({ category: trimmedNew })
    .where(
      and(
        eq(applications.category, trimmedOld),
        eq(applications.namespaceId, namespaceId)
      )
    )

  revalidatePath("/wishlist")
  revalidatePath("/dashboard")
}

export async function deleteWishlistCategory(categoryName: string) {
  const session = await requirePermission("editor")
  await requireSectionAccess("wishlist")
  const namespaceId = session.namespaceId!

  const trimmed = categoryName.trim()
  if (!trimmed) {
    throw new Error("Category name cannot be empty.")
  }

  await db
    .update(wishlist)
    .set({ category: null })
    .where(
      and(
        eq(wishlist.category, trimmed),
        eq(wishlist.addedByNamespaceId, namespaceId)
      )
    )

  await db
    .update(applications)
    .set({ category: null })
    .where(
      and(
        eq(applications.category, trimmed),
        eq(applications.namespaceId, namespaceId)
      )
    )

  revalidatePath("/wishlist")
  revalidatePath("/dashboard")
}
