"use client"

import type { Application, Resume, ApplicationStatus } from "@/lib/db/schema"
import { APPLICATION_STATUSES } from "@/lib/db/schema"
import {
  STATUS_META,
  PRIORITY_META,
  formatSalary,
} from "@/lib/constants"
import {
  deleteApplication,
  updateApplicationStatus,
} from "@/app/actions/applications"
import { ApplicationFormDialog } from "@/components/application-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ExternalLink,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
} from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const ACTIVE_COLUMNS: ApplicationStatus[] = [
  "wishlist",
  "applied",
  "viewed",
  "interview",
  "technical_test",
  "final_interview",
  "offer",
  "accepted",
]

const CLOSED_COLUMNS: ApplicationStatus[] = [
  "rejected",
  "ghosted",
]

export function PipelineBoard({
  applications,
  resumes,
}: {
  applications: Application[]
  resumes: Resume[]
}) {
  const [showClosed, setShowClosed] = useState(false)

  const columns = showClosed
    ? [...ACTIVE_COLUMNS, ...CLOSED_COLUMNS]
    : ACTIVE_COLUMNS

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2 px-1">
        <Switch
          id="show-closed"
          checked={showClosed}
          onCheckedChange={setShowClosed}
        />
        <Label htmlFor="show-closed" className="text-xs text-muted-foreground cursor-pointer select-none">
          Show Closed (Rejected / Ghosted)
        </Label>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {columns.map((status) => {
          const items = applications.filter((a) => {
            if (status === "interview") {
              return a.status === "interview" || a.status === "interviewing"
            }
            return a.status === status
          })
          return (
            <Column
              key={status}
              status={status}
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
  status,
  items,
  resumes,
}: {
  status: ApplicationStatus
  items: Application[]
  resumes: Resume[]
}) {
  const meta = STATUS_META[status]
  const [pending, startTransition] = useTransition()

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const id = Number(e.dataTransfer.getData("text/plain"))
    if (!id) return
    startTransition(async () => {
      try {
        await updateApplicationStatus(id, status)
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
        "flex w-72 shrink-0 flex-col gap-3 rounded-none border border-border bg-muted/10 p-3 transition-colors relative",
        pending && "opacity-70",
      )}
    >
      <div className="flex items-center justify-between px-1 border-b border-border/50 pb-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-none", meta.dot)} />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">{meta.label}</span>
        </div>
        <span className="rounded-none border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground select-none">
          {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {items.length === 0 && (
          <p className="px-1 py-8 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 border border-dashed border-border/50 bg-card/40">
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
  const priority = PRIORITY_META[app.priority as keyof typeof PRIORITY_META]

  function onDelete() {
    startTransition(async () => {
      try {
        await deleteApplication(app.id)
        toast.success("Application deleted")
      } catch {
        toast.error("Could not delete")
      }
    })
  }

  return (
    <div
      draggable
      onDragStart={(e) =>
          e.dataTransfer.setData("text/plain", String(app.id))
      }
      className={cn(
        "group flex flex-col gap-2.5 rounded-none border border-border bg-card p-3 shadow-none hover:border-primary/50 transition-colors relative overflow-hidden cursor-grab active:cursor-grabbing",
        pending && "opacity-50",
      )}
    >
      <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="flex items-start gap-1.5">
          <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight uppercase tracking-tight text-foreground">
              {app.role}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/80 mt-0.5">{app.company}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 rounded-none border border-transparent hover:border-border"
                aria-label="Card actions"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="rounded-none">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] font-mono uppercase tracking-wider">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} className="rounded-none">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {app.link && (
                <DropdownMenuItem className="rounded-none">
                  <a
                    href={app.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center w-full"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open posting
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive rounded-none"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ApplicationFormDialog
        resumes={resumes}
        application={app}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <div className="flex flex-wrap items-center gap-1.5 relative z-10">
        <Badge variant="secondary" className={cn("text-[9px] font-mono rounded-none uppercase", priority.badge)}>
          {priority.label}
        </Badge>
        {app.location && (
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {app.location}
          </span>
        )}
      </div>

      {/* Salary if present */}
      {(app.salaryMin || app.salaryMax) && (
        <span className="text-[10px] font-mono text-muted-foreground/80 relative z-10">
          {formatSalary(app.salaryMin, app.salaryMax)}
        </span>
      )}

      {app.nextAction && (
        <div className="rounded-none bg-accent/40 px-2 py-1 text-[10px] font-mono border-l border-primary/30 relative z-10 text-muted-foreground">
          <span className="text-[8px] uppercase tracking-wider text-muted-foreground/50 block font-bold mb-0.5">Next Step</span>
          {app.nextAction}
        </div>
      )}
    </div>
  )
}

