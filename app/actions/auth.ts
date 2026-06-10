"use server"

import { db } from "@/lib/db"
import { namespaces } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { hashPin, verifyPin, slugify } from "@/lib/auth/crypto"
import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"

export type AuthState = { error?: string } | undefined

export async function createNamespace(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const displayName = String(formData.get("displayName") ?? "").trim()
  const pin = String(formData.get("pin") ?? "").trim()
  const confirmPin = String(formData.get("confirmPin") ?? "").trim()

  if (displayName.length < 2)
    return { error: "Name must be at least 2 characters." }
  if (!/^\d{4,8}$/.test(pin))
    return { error: "PIN must be 4-8 digits." }
  if (pin !== confirmPin) return { error: "PINs do not match." }

  const slug = slugify(displayName)
  if (!slug) return { error: "Please use letters or numbers in your name." }

  const existing = await db
    .select()
    .from(namespaces)
    .where(eq(namespaces.slug, slug))
    .limit(1)

  if (existing.length > 0)
    return { error: "That name is taken. Try another." }

  const [created] = await db
    .insert(namespaces)
    .values({ slug, displayName, pinHash: hashPin(pin) })
    .returning()

  const session = await getSession()
  session.namespaceId = created.id
  session.slug = created.slug
  session.displayName = created.displayName
  await session.save()

  redirect("/dashboard")
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const slug = slugify(String(formData.get("slug") ?? ""))
  const pin = String(formData.get("pin") ?? "").trim()

  if (!slug || !pin) return { error: "Enter your board name and PIN." }

  const [ns] = await db
    .select()
    .from(namespaces)
    .where(eq(namespaces.slug, slug))
    .limit(1)

  if (!ns || !verifyPin(pin, ns.pinHash))
    return { error: "Invalid board name or PIN." }

  const session = await getSession()
  session.namespaceId = ns.id
  session.slug = ns.slug
  session.displayName = ns.displayName
  await session.save()

  redirect("/dashboard")
}

export async function logout() {
  const session = await getSession()
  session.destroy()
  redirect("/")
}
