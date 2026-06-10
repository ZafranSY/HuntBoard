"use client"

import { useMemo, useState } from "react"
import type { Application, Resume } from "@/lib/db/schema"
import { PipelineBoard } from "@/components/pipeline-board"
import { ApplicationsTable } from "@/components/applications-table"
import { ApplicationFormDialog } from "@/components/application-form-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Briefcase,
  Send,
  CalendarClock,
  Trophy,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function DashboardClient({
  applications,
  resumes,
}: {
  applications: Application[]
  resumes: Resume[]
}) {
  const [view, setView] = useState<"board" | "table">("board")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return applications
    return applications.filter(
      (a) =>
        a.company.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        (a.location ?? "").toLowerCase().includes(q),
    )
  }, [applications, query])

  const stats = useMemo(() => {
    const total = applications.length
    const active = applications.filter((a) =>
      ["applied", "interviewing"].includes(a.status),
    ).length
    const interviewing = applications.filter(
      (a) => a.status === "interviewing",
    ).length
    const offers = applications.filter((a) => a.status === "offer").length
    return { total, active, interviewing, offers }
  }, [applications])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Total roles" value={stats.total} />
        <StatCard icon={Send} label="Active" value={stats.active} />
        <StatCard
          icon={CalendarClock}
          label="Interviewing"
          value={stats.interviewing}
        />
        <StatCard icon={Trophy} label="Offers" value={stats.offers} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, role..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border p-0.5">
            <Button
              variant={view === "board" ? "secondary" : "ghost"}
              size="sm"
              className="h-8"
              onClick={() => setView("board")}
            >
              <LayoutGrid className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Board</span>
            </Button>
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-8"
              onClick={() => setView("table")}
            >
              <List className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Table</span>
            </Button>
          </div>

          <ApplicationFormDialog
            resumes={resumes}
            trigger={
              <Button size="sm" className="h-9">
                <Plus className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Add role</span>
              </Button>
            }
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState resumes={resumes} hasApplications={applications.length > 0} />
      ) : view === "board" ? (
        <PipelineBoard applications={filtered} resumes={resumes} />
      ) : (
        <ApplicationsTable applications={filtered} resumes={resumes} />
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex flex-col">
        <span className="text-2xl font-bold leading-none">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

function EmptyState({
  resumes,
  hasApplications,
}: {
  resumes: Resume[]
  hasApplications: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Briefcase className="h-6 w-6" />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold">
          {hasApplications ? "No matches found" : "Your board is empty"}
        </h3>
        <p className="max-w-sm text-pretty text-sm text-muted-foreground">
          {hasApplications
            ? "Try a different search term."
            : "Add the first role you're chasing and start tracking your hunt."}
        </p>
      </div>
      {!hasApplications && (
        <ApplicationFormDialog
          resumes={resumes}
          trigger={
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              Add your first role
            </Button>
          }
        />
      )}
    </div>
  )
}
