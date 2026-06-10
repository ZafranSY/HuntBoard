"use client"

import { useRef, useState, useTransition } from "react"
import { createResume, updateResume } from "@/app/actions/resumes"
import type { Resume } from "@/lib/db/schema"
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
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function ResumeFormDialog({
  resume,
  trigger,
}: {
  resume?: Resume
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = Boolean(resume)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (isEdit && resume) {
          await updateResume(resume.id, formData)
          toast.success("Resume updated")
        } else {
          await createResume(formData)
          toast.success("Resume added")
        }
        setOpen(false)
        formRef.current?.reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit resume" : "Add resume"}</DialogTitle>
          <DialogDescription>
            Track a resume version so you know what you sent where.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={resume?.name ?? ""}
              placeholder="Backend-focused resume"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                name="version"
                defaultValue={resume?.version ?? ""}
                placeholder="v3"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="targetRole">Target role</Label>
              <Input
                id="targetRole"
                name="targetRole"
                defaultValue={resume?.targetRole ?? ""}
                placeholder="Senior SWE"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="link">Link</Label>
            <Input
              id="link"
              name="link"
              type="url"
              defaultValue={resume?.link ?? ""}
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={resume?.notes ?? ""}
              rows={3}
              placeholder="What's different about this version..."
            />
          </div>
          <div className="flex items-center justify-between rounded-none border border-border bg-accent/20 px-3 py-2.5">
            <div className="flex flex-col">
              <Label htmlFor="isActive">Active resume</Label>
              <span className="text-xs text-muted-foreground">
                Currently in rotation
              </span>
            </div>
            <Switch
              id="isActive"
              name="isActive"
              defaultChecked={resume?.isActive ?? true}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add resume"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
