"use client"

import type { Application, Resume } from "@/lib/db/schema"
import { PRIORITY_META, formatSalary } from "@/lib/constants"
import {
  deleteApplication,
  updateApplicationStatus,
} from "@/app/actions/applications"
import { ApplicationFormDialog } from "@/components/application-form-dialog"
import {
  ExternalLink,
  Trash2,
} from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// 4 Simplified columns
const KANBAN_COLUMNS = [
  { id: "applied", label: "Applied", dot: "bg-chart-2" },
  { id: "interview", label: "Interview", dot: "bg-chart-4" },
  { id: "offer", label: "Offer", dot: "bg-chart-3" },
  { id: "rejected", label: "Rejected", dot: "bg-chart-5" },
] as const

type KanbanStatus = typeof KANBAN_COLUMNS[number]["id"]

export function PipelineBoard({
  applications,
  resumes,
}: {
  applications: Application[]
  resumes: Resume[]
}) {
  return (
    <div className="w-full">
      {/* Scrollable board container */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent h-[calc(100vh-280px)] min-h-[500px]">
        {KANBAN_COLUMNS.map((col) => {
          // Group database statuses into the 4 columns
          const items = applications.filter((a) => {
            const status = a.status
            if (col.id === "applied") {
              return status === "wishlist" || status === "applied" || status === "viewed"
            }
            if (col.id === "interview") {
              return (
                status === "interview" ||
                status === "technical_test" ||
                status === "final_interview" ||
                status === "interviewing"
              )
            }
            if (col.id === "offer") {
              return status === "offer" || status === "accepted"
            }
            if (col.id === "rejected") {
              return status === "rejected" || status === "ghosted"
            }
            return false
          })

          return (
            <Column
              key={col.id}
              columnId={col.id}
              label={col.label}
              dot={col.dot}
              items={items}
              resumes={resumes}
            />
          )
        })}
      </div>
    </div>
  )
}

function Column({
  columnId,
  label,
  dot,
  items,
  resumes,
}: {
  columnId: KanbanStatus
  label: string
  dot: string
  items: Application[]
  resumes: Resume[]
}) {
  const [pending, startTransition] = useTransition()

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const id = Number(e.dataTransfer.getData("text/plain"))
    if (!id) return
    
    startTransition(async () => {
      try {
        await updateApplicationStatus(id, columnId)
        toast.success(`Moved to ${label}`)
      } catch {
        toast.error("Could not move card")
      }
    })
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={cn(
        "flex flex-1 min-w-[240px] flex-col rounded-none border border-border bg-card/40 h-full relative overflow-hidden",
        pending && "opacity-75"
      )}
    >
      {/* Column Header - Sticky */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border bg-background/80 backdrop-blur-xs z-10 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-none shrink-0", dot)} />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">{label}</span>
        </div>
        <span className="rounded-none border border-border bg-muted/20 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          {items.length}
        </span>
      </div>

      {/* Card List - Scrollable vertically */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {items.length === 0 && (
          <p className="py-8 text-center text-[9px] font-mono uppercase tracking-widest text-muted-foreground/30 border border-dashed border-border/50 bg-muted/5 select-none">
            [DRAG_CARDS_HERE]
          </p>
        )}
        {items.map((app) => (
          <ApplicationCard key={app.id} app={app} resumes={resumes} />
        ))}
      </div>
    </div>
  )
}

function ApplicationCard({
  app,
  resumes,
}: {
  app: Application
  resumes: Resume[]
}) {
  const [pending, startTransition] = useTransition()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const priority = PRIORITY_META[app.priority as keyof typeof PRIORITY_META] || PRIORITY_META.medium

  function onDelete(e: React.MouseEvent) {
    e.stopPropagation() // Prevent opening the dialog
    if (!confirm("Are you sure you want to delete this application?")) return
    startTransition(async () => {
      try {
        await deleteApplication(app.id)
        toast.success("Application deleted")
      } catch {
        toast.error("Could not delete")
      }
    })
  }

  // Format date or updatedAt date
  const formattedDate = app.updatedAt
    ? new Date(app.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : ""

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(app.id))
      }}
      onClick={() => setIsEditDialogOpen(true)}
      className={cn(
        "group flex flex-col gap-1 rounded-none border border-border bg-card p-2 hover:border-foreground/30 hover:bg-muted/10 transition-colors relative cursor-pointer select-none",
        pending && "opacity-50"
      )}
    >
      <div className="absolute inset-0 dot-matrix-mesh opacity-[0.02] pointer-events-none" />

      {/* Header Line: Company */}
      <div className="flex items-center justify-between gap-1.5 relative z-10">
        <span className="text-[11px] font-mono font-bold leading-tight uppercase tracking-tight text-foreground truncate flex-1">
          {app.company}
        </span>
        
        {/* Quick Actions Hover-only */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {app.link && (
            <a
              href={app.link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
              title="Open posting"
            >
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
          <button
            onClick={onDelete}
            className="h-4 w-4 inline-flex items-center justify-center text-muted-foreground hover:text-destructive"
            title="Delete Application"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>

      {/* Role Title Line */}
      <div className="text-[10px] font-mono text-muted-foreground truncate relative z-10">
        {app.role}
      </div>

      {/* Footer Line: Salary / Date & Priority */}
      <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground/40 mt-1 border-t border-border/20 pt-1 relative z-10">
        <span>
          {app.salaryMin || app.salaryMax 
            ? formatSalary(app.salaryMin, app.salaryMax) 
            : formattedDate}
        </span>
        <span className={cn("px-1 py-0 border text-[8px] uppercase shrink-0 font-bold tracking-tight", priority.badge)}>
          {priority.label}
        </span>
      </div>

      {/* Edit Form Dialog */}
      <ApplicationFormDialog
        resumes={resumes}
        application={app}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  )
}
