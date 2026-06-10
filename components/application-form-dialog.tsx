"use client"

import { useRef, useState, useTransition } from "react"
import {
  createApplication,
  updateApplication,
} from "@/app/actions/applications"
import type { Application, Resume } from "@/lib/db/schema"
import { APPLICATION_STATUSES, PRIORITIES } from "@/lib/db/schema"
import { STATUS_META, PRIORITY_META } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  resumes: Resume[]
  application?: Application
  trigger: React.ReactNode
}

export function ApplicationFormDialog({ resumes, application, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = Boolean(application)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (isEdit && application) {
          await updateApplication(application.id, formData)
          toast.success("Application updated")
        } else {
          await createApplication(formData)
          toast.success("Application added")
        }
        setOpen(false)
        formRef.current?.reset()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong",
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit application" : "Add application"}
          </DialogTitle>
          <DialogDescription>
            Track a role you&apos;re interested in or have applied to.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" htmlFor="company" required>
              <Input
                id="company"
                name="company"
                defaultValue={application?.company ?? ""}
                required
              />
            </Field>
            <Field label="Role" htmlFor="role" required>
              <Input
                id="role"
                name="role"
                defaultValue={application?.role ?? ""}
                required
              />
            </Field>
            <Field label="Location" htmlFor="location">
              <Input
                id="location"
                name="location"
                defaultValue={application?.location ?? ""}
                placeholder="Remote, NYC..."
              />
            </Field>
            <Field label="Work mode" htmlFor="workMode">
              <Select
                name="workMode"
                defaultValue={application?.workMode ?? undefined}
              >
                <SelectTrigger id="workMode">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status" htmlFor="status">
              <Select
                name="status"
                defaultValue={application?.status ?? "wishlist"}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Priority" htmlFor="priority">
              <Select
                name="priority"
                defaultValue={application?.priority ?? "medium"}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Salary min" htmlFor="salaryMin">
              <Input
                id="salaryMin"
                name="salaryMin"
                type="number"
                inputMode="numeric"
                defaultValue={application?.salaryMin ?? ""}
                placeholder="80000"
              />
            </Field>
            <Field label="Salary max" htmlFor="salaryMax">
              <Input
                id="salaryMax"
                name="salaryMax"
                type="number"
                inputMode="numeric"
                defaultValue={application?.salaryMax ?? ""}
                placeholder="120000"
              />
            </Field>
            <Field label="Applied date" htmlFor="appliedDate">
              <Input
                id="appliedDate"
                name="appliedDate"
                type="date"
                defaultValue={application?.appliedDate ?? ""}
              />
            </Field>
            <Field label="Resume used" htmlFor="resumeId">
              <Select
                name="resumeId"
                defaultValue={
                  application?.resumeId ? String(application.resumeId) : undefined
                }
              >
                <SelectTrigger id="resumeId">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.length === 0 && (
                    <SelectItem value="none" disabled>
                      No resumes yet
                    </SelectItem>
                  )}
                  {resumes.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Job link" htmlFor="link">
            <Input
              id="link"
              name="link"
              type="url"
              defaultValue={application?.link ?? ""}
              placeholder="https://..."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Next action" htmlFor="nextAction">
              <Input
                id="nextAction"
                name="nextAction"
                defaultValue={application?.nextAction ?? ""}
                placeholder="Follow up with recruiter"
              />
            </Field>
            <Field label="Next action date" htmlFor="nextActionDate">
              <Input
                id="nextActionDate"
                name="nextActionDate"
                type="date"
                defaultValue={application?.nextActionDate ?? ""}
              />
            </Field>
          </div>

          <Field label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              name="notes"
              defaultValue={application?.notes ?? ""}
              rows={3}
              placeholder="Anything worth remembering..."
            />
          </Field>

          <Field label="Source" htmlFor="source">
            <Input
              id="source"
              name="source"
              defaultValue={application?.source ?? ""}
              placeholder="LinkedIn, referral..."
            />
          </Field>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  )
}
