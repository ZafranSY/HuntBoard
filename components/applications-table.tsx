"use client"

import type { Application, Resume } from "@/lib/db/schema"
import { STATUS_META, PRIORITY_META, formatSalary, formatDate } from "@/lib/constants"
import { deleteApplication } from "@/app/actions/applications"
import { ApplicationFormDialog } from "@/components/application-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ExternalLink, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function ApplicationsTable({
  applications,
  resumes,
}: {
  applications: Application[]
  resumes: Resume[]
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company / Role</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden lg:table-cell">Priority</TableHead>
            <TableHead className="hidden lg:table-cell">Salary</TableHead>
            <TableHead className="hidden md:table-cell">Applied</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => {
            const status = STATUS_META[app.status as keyof typeof STATUS_META]
            const priority =
              PRIORITY_META[app.priority as keyof typeof PRIORITY_META]
            return (
              <TableRow key={app.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{app.role}</span>
                    <span className="text-xs text-muted-foreground">
                      {app.company}
                      {app.location ? ` · ${app.location}` : ""}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 md:hidden">
                    <Badge variant="secondary" className={cn("text-[10px]", status.badge)}>
                      {status.label}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="secondary" className={status.badge}>
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge variant="secondary" className={priority.badge}>
                    {priority.label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {formatSalary(app.salaryMin, app.salaryMax)}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {formatDate(app.appliedDate)}
                </TableCell>
                <TableCell>
                  <RowActions app={app} resumes={resumes} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function RowActions({ app, resumes }: { app: Application; resumes: Resume[] }) {
  const [pending, startTransition] = useTransition()

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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={pending}
            aria-label="Row actions"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
