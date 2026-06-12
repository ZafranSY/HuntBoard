import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { shareLinks, namespaces } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { getSession } from "@/lib/auth/session"
import { ThemeToggle } from "@/components/theme-toggle"
import { JoinForm } from "./join-form"
import { buttonVariants } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, Home } from "lucide-react"

export const metadata: Metadata = {
  title: "Join Board - HuntBoard",
  description: "Collaborate on job application tracking.",
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function JoinPage({ params }: PageProps) {
  const { token } = await params

  // 1. Find shareLink by token
  const [link] = await db
    .select()
    .from(shareLinks)
    .where(and(eq(shareLinks.token, token), isNull(shareLinks.revokedAt)))
    .limit(1)

  // Determine if valid
  let isLinkValid = true
  let invalidReason = ""

  if (!link) {
    isLinkValid = false
    invalidReason = "This invite link is invalid or has been revoked."
  } else {
    // Check expiration
    if (link.expiresAt && new Date() > link.expiresAt) {
      isLinkValid = false
      invalidReason = "This invite link has expired."
    }
    // Check max uses
    else if (link.maxUses !== null && link.usedCount >= link.maxUses) {
      isLinkValid = false
      invalidReason = "This invite link has reached its maximum usage limit."
    }
  }

  // Get current user session
  const session = await getSession()
  const isLoggedIn = !!session.namespaceId
  const currentUserName = session.displayName

  // Fetch board details if link is valid
  let boardName = ""
  let boardColor = ""
  if (isLinkValid && link) {
    const [board] = await db
      .select()
      .from(namespaces)
      .where(eq(namespaces.id, link.boardId))
      .limit(1)

    if (!board) {
      isLinkValid = false
      invalidReason = "The target board does not exist."
    } else {
      boardName = board.displayName
      boardColor = board.color
    }
  }

  return (
    <main className="min-h-dvh flex flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0">
            <Image
              src="/favicon-32x32.png"
              alt="HuntBoard"
              fill
              sizes="36px"
              priority
              className="object-contain block dark:hidden"
            />
            <Image
              src="/apple-touch-icon.png"
              alt="HuntBoard"
              fill
              sizes="36px"
              priority
              className="object-contain hidden dark:block"
            />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            HuntBoard
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <section className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {isLinkValid && link ? (
            <JoinForm
              token={token}
              boardName={boardName}
              boardColor={boardColor}
              permission={link.permission as "viewer" | "contributor" | "editor"}
              isLoggedIn={isLoggedIn}
              currentUserName={currentUserName}
              requireAccount={link.requireAccount ?? false}
            />
          ) : (
            <div className="w-full rounded-none border border-border bg-card p-6 shadow-none sm:p-8 relative overflow-hidden text-center flex flex-col items-center gap-6">
              <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
              
              <div className="h-12 w-12 rounded-none border border-destructive/30 bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>

              <div className="flex flex-col gap-2">
                <h1 className="text-xl font-extrabold uppercase font-heading tracking-tight">
                  Link Invalid or Expired
                </h1>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {invalidReason || "This invite link is no longer valid. Contact the board owner for a new invite link."}
                </p>
              </div>

              <div className="w-full border-t border-border/80 my-2" />

              <Link 
                href="/" 
                className={buttonVariants({ variant: "default", size: "lg", className: "w-full" })}
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
