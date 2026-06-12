"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { joinBoardWithGuestName, joinBoardLoggedInAction } from "@/app/actions/sharing"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, UserPlus, CheckCircle, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface JoinFormProps {
  token: string
  boardName: string
  boardColor: string
  permission: "viewer" | "contributor" | "editor"
  isLoggedIn: boolean
  currentUserName?: string
  requireAccount?: boolean
}

export function JoinForm({
  token,
  boardName,
  boardColor,
  permission,
  isLoggedIn,
  currentUserName,
  requireAccount = false,
}: JoinFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showGuestForm, setShowGuestForm] = useState(!isLoggedIn)

  const handleJoinLoggedIn = () => {
    setError(null)
    startTransition(async () => {
      const res = await joinBoardLoggedInAction(token)
      if (res?.error) {
        setError(res.error)
      } else {
        // Redirect to dashboard
        window.location.href = "/dashboard"
      }
    })
  }

  const handleJoinGuest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setError("Please enter your name.")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await joinBoardWithGuestName(token, displayName)
      if (res?.error) {
        setError(res.error)
      } else {
        // Redirect to dashboard
        window.location.href = "/dashboard"
      }
    })
  }

  const permissionDescriptions = {
    viewer: "View the board and applications in read-only mode.",
    contributor: "Add applications and edit/update only the ones you create.",
    editor: "Full access to add, edit, and delete any applications on the board.",
  }

  return (
    <div className="w-full rounded-none border border-border bg-card p-6 shadow-none sm:p-8 relative overflow-hidden group">
      <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-none border border-border/80 bg-accent/40 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mx-auto sm:mx-0">
            <span 
              className="h-2 w-2 shrink-0" 
              style={{ backgroundColor: boardColor || "#6366f1" }} 
            />
            Invite to Join Board
          </span>
          <h1 className="text-balance text-2xl font-extrabold uppercase font-heading tracking-tight mt-1">
            Join <span style={{ color: boardColor || "#6366f1" }}>{boardName}</span>
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            You have been invited to collaborate with the permission level of{" "}
            <span className="font-semibold uppercase text-foreground">{permission}</span>.
          </p>
        </div>

        <div className="rounded-none border border-border bg-accent/15 p-4 flex gap-3 items-start">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold uppercase tracking-tight text-foreground">
              Permission: {permission}
            </span>
            <span className="text-xs text-muted-foreground leading-normal">
              {permissionDescriptions[permission]}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-none border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-mono text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {requireAccount && !isLoggedIn ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left leading-normal font-mono">
              This board requires you to be logged in to join.
            </p>
            
            <Link 
              href={`/?redirectTo=/join/${token}`}
              className={cn(buttonVariants({ variant: "default", size: "lg" }), "w-full justify-center text-center")}
            >
              Sign in to Join
            </Link>

            <Link 
              href={`/?redirectTo=/join/${token}&tab=signup`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full justify-center text-center")}
            >
              Create a board first
            </Link>
          </div>
        ) : isLoggedIn && !showGuestForm ? (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-muted-foreground">
              You are currently signed in as <span className="font-semibold text-foreground">{currentUserName}</span>.
            </div>
            
            <Button
              onClick={handleJoinLoggedIn}
              disabled={isPending}
              size="lg"
              className="w-full"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join as {currentUserName}
            </Button>

            {!requireAccount && (
              <button
                onClick={() => {
                  setShowGuestForm(true)
                  setError(null)
                }}
                className="text-xs text-muted-foreground underline hover:text-foreground transition-colors font-mono self-center mt-2"
              >
                Or join as a guest with a different name
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleJoinGuest} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="guest-name">Your Display Name</Label>
              <Input
                id="guest-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Alvis"
                required
                autoComplete="off"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Your guest profile will be created with this name.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              size="lg"
              className="w-full"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <UserPlus className="mr-2 h-4 w-4" />
              Join Board
            </Button>

            {isLoggedIn && !requireAccount && (
              <button
                type="button"
                onClick={() => {
                  setShowGuestForm(false)
                  setError(null)
                }}
                className="text-xs text-muted-foreground underline hover:text-foreground transition-colors font-mono self-center mt-2"
              >
                Go back to join as {currentUserName}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
