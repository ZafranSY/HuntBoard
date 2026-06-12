"use server"

import { db } from "@/lib/db"
import { namespaces } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { hashPin, verifyPin, slugify } from "@/lib/auth/crypto"
import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export type AuthState = { error?: string } | undefined

type AttemptRecord = {
  count: number
  lockoutUntil?: number
}

const loginAttempts = new Map<string, AttemptRecord>()

export async function createNamespace(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const displayName = String(formData.get("displayName") ?? "").trim()
  const pin = String(formData.get("pin") ?? "").trim()
  const confirmPin = String(formData.get("confirmPin") ?? "").trim()
  const redirectTo = String(formData.get("redirectTo") ?? "").trim()

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
  session.namespaceSlug = created.slug
  session.displayName = created.displayName
  session.color = created.color
  session.accessMethod = "pin"
  session.permission = "owner"
  session.isLoggedIn = true
  await session.save()

  if (redirectTo && redirectTo.startsWith("/")) {
    redirect(redirectTo)
  } else {
    redirect("/dashboard")
  }
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const slug = slugify(String(formData.get("slug") ?? ""))
  const pin = String(formData.get("pin") ?? "").trim()
  const redirectTo = String(formData.get("redirectTo") ?? "").trim()

  if (!slug || !pin) return { error: "Enter your board name and PIN." }

  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1"
  const limitKey = `${ip}:${slug}`

  const attempts = loginAttempts.get(limitKey)
  if (attempts && attempts.lockoutUntil && Date.now() < attempts.lockoutUntil) {
    const minutesLeft = Math.ceil((attempts.lockoutUntil - Date.now()) / 60000)
    return {
      error: `Too many failed attempts. Locked out for ${minutesLeft} minute${
        minutesLeft > 1 ? "s" : ""
      }.`,
    }
  }

  const [ns] = await db
    .select()
    .from(namespaces)
    .where(eq(namespaces.slug, slug))
    .limit(1)

  if (!ns || !ns.pinHash || !verifyPin(pin, ns.pinHash)) {
    const count = (attempts?.count ?? 0) + 1
    if (count >= 5) {
      loginAttempts.set(limitKey, {
        count,
        lockoutUntil: Date.now() + 10 * 60 * 1000,
      })
      return { error: "Incorrect PIN. Locked out for 10 minutes." }
    } else {
      loginAttempts.set(limitKey, { count })
      return { error: `Incorrect PIN, try again. (${5 - count} attempts remaining)` }
    }
  }

  loginAttempts.delete(limitKey)

  const session = await getSession()
  session.namespaceId = ns.id
  session.namespaceSlug = ns.slug
  session.displayName = ns.displayName
  session.color = ns.color
  session.accessMethod = "pin"
  session.permission = "owner"
  session.isLoggedIn = true
  await session.save()

  if (redirectTo && redirectTo.startsWith("/")) {
    redirect(redirectTo)
  } else {
    redirect("/dashboard")
  }
}

export async function logout() {
  const session = await getSession()
  session.destroy()
  redirect("/")
}
