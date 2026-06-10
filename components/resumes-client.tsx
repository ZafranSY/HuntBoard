"use client"

import { useTransition } from "react"
import type { Application, Resume } from "@/lib/db/schema"
import { deleteResume } from "@/app/actions/resumes"
import { ResumeFormDialog } from "@/components/resume-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ExternalLink,
  FileText,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

export function ResumesClient({
  resumes,
  applications,
}: {
  resumes: Resume[]
  applications: Application[]
}) {
  const usage = (resumeId: number) =>
    applications.filter((a) => a.resumeId === resumeId).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Resumes</h1>
          <p className="text-sm text-muted-foreground">
            Keep track of every version and where you sent it.
          </p>
        </div>
        <ResumeFormDialog
          trigger={
            <Button size="sm" className="h-9">
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Add resume</span>
            </Button>
          }
        />
      </div>

      {resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <FileText className="h-6 w-6" />
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold">No resumes yet</h3>
            <p className="max-w-sm text-pretty text-sm text-muted-foreground">
              Add your resume versions so you can link them to applications.
            </p>
          </div>
          <ResumeFormDialog
            trigger={
              <Button>
                <Plus className="mr-1.5 h-4 w-4" />
                Add your first resume
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              usageCount={usage(resume.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ResumeCard({
  resume,
  usageCount,
}: {
  resume: Resume
  usageCount: number
}) {
  const [pending, startTransition] = useTransition()

  function onDelete() {
    startTransition(async () => {
      try {
        await deleteResume(resume.id)
        toast.success("Resume deleted")
      } catch {
        toast.error("Could not delete")
      }
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <FileText className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <span className="font-semibold leading-tight">{resume.name}</span>
            {resume.version && (
              <span className="text-xs text-muted-foreground">
                {resume.version}
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={pending}
              aria-label="Resume actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ResumeFormDialog
              resume={resume}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              }
            />
            {resume.link && (
              <DropdownMenuItem>
                <a
                  href={resume.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open file
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {resume.targetRole && (
        <p className="text-sm text-muted-foreground">
          Target: {resume.targetRole}
        </p>
      )}
      {resume.notes && (
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          {resume.notes}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 pt-1">
        {resume.isActive ? (
          <Badge variant="secondary" className="bg-chart-3/15 text-chart-3">
            Active
          </Badge>
        ) : (
          <Badge variant="secondary">Archived</Badge>
        )}
        <span className="text-xs text-muted-foreground">
          Used in {usageCount} {usageCount === 1 ? "application" : "applications"}
        </span>
      </div>
    </div>
  )
}
