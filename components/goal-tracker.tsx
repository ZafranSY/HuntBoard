"use client"

import { useState, useTransition } from "react"
import { updateWeeklyGoal } from "@/app/actions/namespaces"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Check, Edit2, Loader2, X } from "lucide-react"

interface GoalTrackerProps {
  weeklyGoal: number
  applications: {
    status: string
    appliedDate: string | null
  }[]
}

function getStartOfLocalWeek(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.getFullYear(), now.getMonth(), diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function GoalTracker({ weeklyGoal, applications }: GoalTrackerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [goalValue, setGoalValue] = useState(String(weeklyGoal))
  const [pending, startTransition] = useTransition()

  // Calculate apps applied in the current local week (Monday - Sunday)
  const startOfWeek = getStartOfLocalWeek()
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)

  const countThisWeek = applications.filter((app) => {
    if (app.status === "wishlist" || !app.appliedDate) return false
    const appDate = parseLocalDate(app.appliedDate)
    return appDate >= startOfWeek && appDate <= endOfWeek
  }).length

  const percentage = weeklyGoal > 0 ? Math.min(100, (countThisWeek / weeklyGoal) * 100) : 0

  function handleSave() {
    const parsed = parseInt(goalValue, 10)
    if (isNaN(parsed) || parsed < 1) {
      toast.error("Goal must be a number greater than 0")
      return
    }

    startTransition(async () => {
      try {
        await updateWeeklyGoal(parsed)
        toast.success("Weekly goal updated")
        setIsEditing(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update weekly goal")
      }
    })
  }

  // Get color based on completion percentage
  let progressColor = "bg-chart-2" // Low progress
  if (percentage >= 100) {
    progressColor = "bg-chart-3" // Completed
  } else if (percentage >= 50) {
    progressColor = "bg-chart-4" // Halfway
  }

  return (
    <div className="flex flex-col gap-2.5 p-4 rounded-none border border-border bg-card mx-4 my-2 relative overflow-hidden group">
      <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider relative z-10">
        <span>Weekly Goal</span>
        <span className="text-[9px] text-muted-foreground/60 font-mono">MON-SUN</span>
      </div>

      <div className="flex items-center justify-between gap-2 relative z-10">
        {isEditing ? (
          <div className="flex items-center gap-1 w-full">
            <Input
              type="number"
              value={goalValue}
              onChange={(e) => setGoalValue(e.target.value)}
              className="h-8 py-1 px-2 text-xs w-20 rounded-none border-border font-mono"
              min="1"
              disabled={pending}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
                if (e.key === "Escape") {
                  setGoalValue(String(weeklyGoal))
                  setIsEditing(false)
                }
              }}
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 shrink-0 rounded-none border border-transparent hover:border-border"
              onClick={handleSave}
              disabled={pending}
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 rounded-none border border-transparent hover:border-border"
              onClick={() => {
                setGoalValue(String(weeklyGoal))
                setIsEditing(false)
              }}
              disabled={pending}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-foreground tabular-nums font-heading">
                {countThisWeek}
              </span>
              <span className="text-xs text-muted-foreground font-mono uppercase">
                / {weeklyGoal} apps
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary/40 shrink-0 rounded-none border border-transparent hover:border-border"
              onClick={() => setIsEditing(true)}
              aria-label="Edit goal"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <div className="w-full bg-accent/30 rounded-none h-2 overflow-hidden relative border border-border/40 z-10">
        <div 
          className={`h-full transition-all duration-500 ease-out rounded-none ${progressColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground font-medium relative z-10">
        <span>{percentage.toFixed(0)}% COMPLETE</span>
        {percentage >= 100 && <span className="text-chart-3 font-bold">MET! 🎉</span>}
      </div>
    </div>
  )
}

