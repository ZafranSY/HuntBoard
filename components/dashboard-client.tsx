"use client"

import { useMemo, useState } from "react"
import type { Application, Resume } from "@/lib/db/schema"
import { PipelineBoard } from "@/components/pipeline-board"
import { ApplicationsTable } from "@/components/applications-table"
import { ApplicationFormDialog } from "@/components/application-form-dialog"
import { ImportJsonDialog } from "@/components/import-json-dialog"
import MonksButton from "@/components/MonksButton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LayoutGrid,
  List,
  Search,
  Briefcase,
  Send,
  CalendarClock,
  Trophy,
  FileCode,
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
      {/* Industrial grid chassis stat layout */}
      <div className="grid grid-cols-2 gap-px bg-border border border-border rounded-none relative overflow-hidden lg:grid-cols-4">
        <div className="absolute inset-0 dot-matrix-mesh opacity-10 pointer-events-none" />
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
          {/* View Toggle */}
          <div className="flex items-center rounded-none border border-border p-0.5 bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 font-mono text-[10px] uppercase tracking-wider rounded-none",
                view === "board" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:bg-transparent"
              )}
              onClick={() => setView("board")}
            >
              <LayoutGrid className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Board</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 font-mono text-[10px] uppercase tracking-wider rounded-none",
                view === "table" ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:bg-transparent"
              )}
              onClick={() => setView("table")}
            >
              <List className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Table</span>
            </Button>
          </div>

          <ImportJsonDialog
            trigger={
              <MonksButton label="Import JSON" variant="outline" className="h-8" />
            }
          />

          <ApplicationFormDialog
            resumes={resumes}
            trigger={
              <MonksButton label="Add role" variant="primary" className="h-8" />
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
    <div className="flex items-center gap-4 bg-card p-5 relative overflow-hidden group">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-border bg-muted/30 text-foreground transition-colors duration-200 group-hover:bg-[#E82D2D]/10 group-hover:border-[#E82D2D]/30">
        <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
      </span>
      <div className="flex flex-col">
        <span className="text-3xl font-heading font-black tracking-tight leading-none text-foreground">{value}</span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">{label}</span>
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
    <div className="flex flex-col items-center justify-center gap-4 rounded-none border border-dashed border-border bg-card/50 px-6 py-16 text-center relative overflow-hidden">
      <div className="absolute inset-0 dot-matrix-mesh opacity-10 pointer-events-none" />
      <span className="flex h-12 w-12 items-center justify-center rounded-none border border-border bg-muted/30 text-foreground">
        <Briefcase className="h-5 w-5" />
      </span>
      <div className="flex flex-col gap-1 relative z-10">
        <h3 className="text-base font-bold uppercase tracking-wide font-heading">
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
            <MonksButton label="Add your first role" variant="primary" />
          }
        />
      )}
    </div>
  )
}

