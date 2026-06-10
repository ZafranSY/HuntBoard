"use client"

import { useRef, useState, useTransition } from "react"
import {
  createWishlistItem,
  updateWishlistItem,
} from "@/app/actions/wishlist"
import type { WishlistItem } from "@/lib/db/schema"
import { PRIORITIES } from "@/lib/db/schema"
import { PRIORITY_META } from "@/lib/constants"
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
  item?: WishlistItem
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function WishlistFormDialog({
  item,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen =
    controlledOnOpenChange !== undefined
      ? controlledOnOpenChange
      : setInternalOpen
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const isEdit = Boolean(item)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (isEdit && item) {
          await updateWishlistItem(item.id, formData)
          toast.success("Shared wishlist item updated")
        } else {
          await createWishlistItem(formData)
          toast.success("Added to shared wishlist")
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
      {trigger && <div onClick={() => setOpen(true)}>{trigger}</div>}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Shared Wishlist Item" : "Add to Shared Wishlist"}
          </DialogTitle>
          <DialogDescription>
            Share an interesting role with the group. Anyone can claim it or copy it.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" htmlFor="company" required>
              <Input
                id="company"
                name="company"
                defaultValue={item?.company ?? ""}
                placeholder="e.g. Google"
                required
                className="rounded-none"
              />
            </Field>
            <Field label="Role" htmlFor="role">
              <Input
                id="role"
                name="role"
                defaultValue={item?.role ?? ""}
                placeholder="e.g. Software Engineer"
                className="rounded-none"
              />
            </Field>
            <Field label="Location" htmlFor="location">
              <Input
                id="location"
                name="location"
                defaultValue={item?.location ?? ""}
                placeholder="e.g. Remote, NYC..."
                className="rounded-none"
              />
            </Field>
            <Field label="Priority" htmlFor="priority">
              <Select
                name="priority"
                defaultValue={item?.priority ?? "medium"}
              >
                <SelectTrigger id="priority" className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Category / Group Tag" htmlFor="category">
            <Input
              id="category"
              name="category"
              defaultValue={item?.category ?? ""}
              placeholder="e.g. alvis-wish, roles, remote-gigs..."
              className="rounded-none"
            />
          </Field>

          <Field label="Job link" htmlFor="link">
            <Input
              id="link"
              name="link"
              type="url"
              defaultValue={item?.link ?? ""}
              placeholder="https://..."
              className="rounded-none"
            />
          </Field>

          <Field label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              name="notes"
              defaultValue={item?.notes ?? ""}
              rows={3}
              placeholder="Add details, job requirements, contact person..."
              className="rounded-none"
            />
          </Field>

          <DialogFooter>
            <Button type="submit" disabled={pending} className="rounded-none">
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add to wishlist"}
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
