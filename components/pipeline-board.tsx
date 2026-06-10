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
import { useTransition } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function PipelineBoard({
  applications,
  resumes,
}: {
  applications: Application[]
  resumes: Resume[]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {APPLICATION_STATUSES.map((status) => {
        const items = applications.filter((a) => a.status === status)
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
        "flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3 transition-colors",
        pending && "opacity-70",
      )}
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
          <span className="text-sm font-medium">{meta.label}</span>
        </div>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {items.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">
            Drag cards here
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
        "group flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-sm",
        pending && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5">
          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-muted-foreground/50" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">
              {app.role}
            </span>
            <span className="text-xs text-muted-foreground">{app.company}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                aria-label="Card actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ApplicationFormDialog
                resumes={resumes}
                application={app}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                }
              />
              {app.link && (
                <DropdownMenuItem>
                  <a
                    href={app.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open posting
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className={cn("text-[10px]", priority.badge)}>
          {priority.label}
        </Badge>
        {app.location && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {app.location}
          </span>
        )}
      </div>

      {(app.salaryMin || app.salaryMax) && (
        <span className="text-xs font-medium text-muted-foreground">
          {formatSalary(app.salaryMin, app.salaryMax)}
        </span>
      )}

      {app.nextAction && (
        <div className="rounded-md bg-accent/50 px-2 py-1 text-xs text-accent-foreground">
          Next: {app.nextAction}
        </div>
      )}
    </div>
  )
}
