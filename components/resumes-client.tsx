"use client"

import { useTransition } from "react"
import type { Application, Resume } from "@/lib/db/schema"
import { deleteResume } from "@/app/actions/resumes"
import { ResumeFormDialog } from "@/components/resume-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import MonksButton from "@/components/MonksButton"
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
      <div className="flex items-center justify-between gap-4 border-b pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-heading font-black tracking-tight uppercase">Resumes</h1>
          <p className="text-xs font-mono text-muted-foreground uppercase mt-1">
            Keep track of every version and where you sent it.
          </p>
        </div>
        <ResumeFormDialog
          trigger={
            <MonksButton label="Add resume" variant="primary" className="h-9" />
          }
        />
      </div>

      {resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-none border border-dashed border-border bg-card px-6 py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 dot-matrix-mesh opacity-10 pointer-events-none" />
          <span className="flex h-12 w-12 items-center justify-center rounded-none border border-border bg-muted/30 text-foreground relative z-10">
            <FileText className="h-6 w-6" />
          </span>
          <div className="flex flex-col gap-1 relative z-10">
            <h3 className="text-base font-heading font-bold uppercase">No resumes yet</h3>
            <p className="max-w-sm text-pretty text-xs font-mono text-muted-foreground uppercase">
              Add your resume versions so you can link them to applications.
            </p>
          </div>
          <div className="relative z-10 mt-2">
            <ResumeFormDialog
              trigger={
                <MonksButton label="Add your first resume" variant="primary" className="h-9" />
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-border bg-border gap-px rounded-none">
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
    <div className="bg-card p-5 flex flex-col gap-4 justify-between group relative overflow-hidden rounded-none">
      <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-none border border-border bg-muted/30 text-foreground">
            <FileText className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight">{resume.name}</span>
            {resume.version && (
              <span className="text-[10px] font-mono uppercase text-muted-foreground mt-0.5">
                {resume.version}
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-none border border-transparent hover:border-border"
                disabled={pending}
                aria-label="Resume actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="rounded-none">
            <ResumeFormDialog
              resume={resume}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-none">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              }
            />
            {resume.link && (
              <DropdownMenuItem className="rounded-none">
                <a
                  href={resume.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open file
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive rounded-none"
              onSelect={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2 relative z-10">
        {resume.targetRole && (
          <div className="text-xs">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block">Target Role</span>
            <span className="font-semibold text-card-foreground">{resume.targetRole}</span>
          </div>
        )}
        {resume.notes && (
          <p className="line-clamp-3 bg-muted/40 p-2 text-[10px] leading-normal italic font-mono border-l border-primary/20">
            &ldquo;{resume.notes}&rdquo;
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-4 border-t border-border/50 relative z-10">
        {resume.isActive ? (
          <Badge variant="secondary" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono rounded-none">
            ACTIVE
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] font-mono rounded-none">
            ARCHIVED
          </Badge>
        )}
        <span className="text-[10px] font-mono text-muted-foreground">
          USED IN {usageCount} {usageCount === 1 ? "APP" : "APPS"}
        </span>
      </div>
    </div>
  )
}

