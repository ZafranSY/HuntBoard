"use client"

import { useRef, useState, useTransition, useEffect } from "react"
import {
  createApplication,
  updateApplication,
  getFollowUpLogs,
  addFollowUpLog,
  deleteFollowUpLog,
  toggleFollowUpResponse,
} from "@/app/actions/applications"
import type { Application, Resume, FollowUpLog } from "@/lib/db/schema"
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
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ApplicationFormDialog({
  resumes,
  application,
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
  const isEdit = Boolean(application)

  const [status, setStatus] = useState(application?.status ?? "wishlist")
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  
  const [checklist, setChecklist] = useState({
    verbs: application?.resumeTailored ?? false,
    skills: application?.resumeTailored ?? false,
    format: application?.resumeTailored ?? false,
    research: application?.resumeTailored ?? false,
    typos: application?.resumeTailored ?? false,
  })
  const [resumeTailored, setResumeTailored] = useState(application?.resumeTailored ?? false)

  const handleChecklistChange = (key: keyof typeof checklist, checked: boolean) => {
    const nextChecklist = { ...checklist, [key]: checked }
    setChecklist(nextChecklist)
    const allChecked = Object.values(nextChecklist).every(Boolean)
    setResumeTailored(allChecked)
  }

  const handleResumeTailoredChange = (checked: boolean) => {
    setResumeTailored(checked)
    setChecklist({
      verbs: checked,
      skills: checked,
      format: checked,
      research: checked,
      typos: checked,
    })
  }

  const [followUps, setFollowUps] = useState<FollowUpLog[]>([])
  const [newMethod, setNewMethod] = useState("email")
  const [newContent, setNewContent] = useState("")
  const [newSentAt, setNewSentAt] = useState(() => new Date().toISOString().split("T")[0])
  const [addingFollowUp, setAddingFollowUp] = useState(false)

  useEffect(() => {
    if (open) {
      setStatus(application?.status ?? "wishlist")
      setResumeTailored(application?.resumeTailored ?? false)
      setChecklist({
        verbs: application?.resumeTailored ?? false,
        skills: application?.resumeTailored ?? false,
        format: application?.resumeTailored ?? false,
        research: application?.resumeTailored ?? false,
        typos: application?.resumeTailored ?? false,
      })
      setExpandedSection(null)
    }
  }, [open, application])

  useEffect(() => {
    if (open && application?.id) {
      getFollowUpLogs(application.id).then(setFollowUps).catch(console.error)
    }
  }, [open, application?.id])

  async function handleAddFollowUp() {
    if (!application?.id) return
    setAddingFollowUp(true)
    try {
      const fd = new FormData()
      fd.append("method", newMethod)
      fd.append("content", newContent)
      fd.append("sentAt", newSentAt)
      fd.append("responseReceived", "false")
      await addFollowUpLog(application.id, fd)
      const updated = await getFollowUpLogs(application.id)
      setFollowUps(updated)
      setNewContent("")
      toast.success("Follow-up logged")
    } catch (err) {
      toast.error("Could not add follow-up log")
    } finally {
      setAddingFollowUp(false)
    }
  }

  async function handleDeleteFollowUp(logId: number) {
    if (!confirm("Delete this log?")) return
    try {
      await deleteFollowUpLog(logId)
      setFollowUps((prev) => prev.filter((l) => l.id !== logId))
      toast.success("Log deleted")
    } catch {
      toast.error("Could not delete log")
    }
  }

  async function handleToggleResponse(logId: number, received: boolean) {
    try {
      await toggleFollowUpResponse(logId, received)
      setFollowUps((prev) =>
        prev.map((l) => (l.id === logId ? { ...l, responseReceived: received } : l))
      )
      toast.success(received ? "Marked as responded" : "Marked as no response")
    } catch {
      toast.error("Could not update response status")
    }
  }

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
      {trigger && <div onClick={() => setOpen(true)}>{trigger}</div>}
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
                value={status}
                onValueChange={(val) => setStatus(val ?? "wishlist")}
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
            <Field label="Category / Group" htmlFor="category">
              <Input
                id="category"
                name="category"
                defaultValue={application?.category ?? ""}
                placeholder="e.g. alvis-wish, frontend"
              />
            </Field>
          </div>

          {application?.wishlistId && (
            <input
              type="hidden"
              name="wishlistId"
              value={application.wishlistId}
            />
          )}

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

          {/* REJECTION REASON (conditional on status) */}
          {(status === "rejected" || status === "ghosted") && (
            <Field label="Rejection Reason" htmlFor="rejectionReason">
              <Select
                name="rejectionReason"
                defaultValue={application?.rejectionReason ?? undefined}
              >
                <SelectTrigger id="rejectionReason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ats_filtered">ATS Filtered</SelectItem>
                  <SelectItem value="no_response">No Response</SelectItem>
                  <SelectItem value="post_interview">Post-Interview Rejection</SelectItem>
                  <SelectItem value="overqualified">Overqualified</SelectItem>
                  <SelectItem value="underqualified">Underqualified</SelectItem>
                  <SelectItem value="role_cancelled">Role Cancelled</SelectItem>
                  <SelectItem value="salary_mismatch">Salary Mismatch</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}

          <div className="border border-border/85 p-1 flex flex-col gap-1 mt-2">
            {/* Accordion 1: Checklist */}
            <div>
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === "checklist" ? null : "checklist")}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-left border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <span>[01_TAILORING_CHECKLIST]</span>
                <span className="text-muted-foreground">{expandedSection === "checklist" ? "[-]" : "[+]"}</span>
              </button>
              {expandedSection === "checklist" && (
                <div className="p-3 border-x border-b border-border/40 bg-card/50 flex flex-col gap-3">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    Complete all to verify tailoring of resume:
                  </p>
                  <div className="space-y-2">
                    {[
                      { key: "verbs", label: "Customized resume summary & bullets to match JD key verbs" },
                      { key: "skills", label: "Added/emphasized top 3 skills mentioned in the job description" },
                      { key: "format", label: "Checked for correct ATS friendly single-column format" },
                      { key: "research", label: "Researched company size & recent engineering posts/news" },
                      { key: "typos", label: "Double-checked job link & application form details for typos" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-start gap-2 text-[11px] font-mono leading-tight text-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={checklist[item.key as keyof typeof checklist]}
                          onChange={(e) => handleChecklistChange(item.key as keyof typeof checklist, e.target.checked)}
                          className="mt-0.5 h-3.5 w-3.5 rounded-none border-border bg-background text-foreground focus:ring-0 focus:ring-offset-0"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="border-t border-border/30 pt-2 flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">Resume Tailored:</span>
                    <label className="flex items-center gap-1.5 text-[11px] font-mono font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        name="resumeTailored"
                        checked={resumeTailored}
                        onChange={(e) => handleResumeTailoredChange(e.target.checked)}
                        className="h-3.5 w-3.5 rounded-none border-border bg-background text-foreground focus:ring-0 focus:ring-offset-0"
                      />
                      <span>TAILORED</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Recruiter Contact CRM */}
            <div>
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === "contact" ? null : "contact")}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-left border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <span>[02_RECRUITER_CONTACT_CRM]</span>
                <span className="text-muted-foreground">{expandedSection === "contact" ? "[-]" : "[+]"}</span>
              </button>
              {expandedSection === "contact" && (
                <div className="p-3 border-x border-b border-border/40 bg-card/50 grid gap-3 sm:grid-cols-1">
                  <Field label="Recruiter Name" htmlFor="recruiterName">
                    <Input
                      id="recruiterName"
                      name="recruiterName"
                      defaultValue={application?.recruiterName ?? ""}
                      placeholder="e.g. Sarah Connor"
                    />
                  </Field>
                  <Field label="Recruiter Email" htmlFor="recruiterEmail">
                    <Input
                      id="recruiterEmail"
                      name="recruiterEmail"
                      type="email"
                      defaultValue={application?.recruiterEmail ?? ""}
                      placeholder="e.g. sarah@company.com"
                    />
                  </Field>
                  <Field label="Recruiter LinkedIn Profile URL" htmlFor="recruiterLinkedinUrl">
                    <Input
                      id="recruiterLinkedinUrl"
                      name="recruiterLinkedinUrl"
                      type="url"
                      defaultValue={application?.recruiterLinkedinUrl ?? ""}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Accordion 3: Job Description & Fit */}
            <div>
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === "specs" ? null : "specs")}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-left border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <span>[03_JOB_DESCRIPTION_AND_FIT]</span>
                <span className="text-muted-foreground">{expandedSection === "specs" ? "[-]" : "[+]"}</span>
              </button>
              {expandedSection === "specs" && (
                <div className="p-3 border-x border-b border-border/40 bg-card/50 flex flex-col gap-3">
                  <Field label="Fit Score" htmlFor="fitScore">
                    <Select name="fitScore" defaultValue={application?.fitScore ?? undefined}>
                      <SelectTrigger id="fitScore">
                        <SelectValue placeholder="Select Fit Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="safe">Safe (High probability of interview)</SelectItem>
                        <SelectItem value="target">Target (Matches my core skills)</SelectItem>
                        <SelectItem value="reach">Reach (Aspirational role / high specs)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Portfolio / Project URL Submitted" htmlFor="portfolioUrl">
                    <Input
                      id="portfolioUrl"
                      name="portfolioUrl"
                      type="url"
                      defaultValue={application?.portfolioUrl ?? ""}
                      placeholder="https://zafran-sakowi.my"
                    />
                  </Field>
                  <Field label="Job Description (Raw Text)" htmlFor="jobDescriptionRaw">
                    <Textarea
                      id="jobDescriptionRaw"
                      name="jobDescriptionRaw"
                      defaultValue={application?.jobDescriptionRaw ?? ""}
                      rows={5}
                      placeholder="Paste the raw job description text here for ATS keyword matching..."
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Accordion 4: Interview Prep */}
            <div>
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === "prep" ? null : "prep")}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-left border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <span>[04_INTERVIEW_PREP_AND_RESEARCH]</span>
                <span className="text-muted-foreground">{expandedSection === "prep" ? "[-]" : "[+]"}</span>
              </button>
              {expandedSection === "prep" && (
                <div className="p-3 border-x border-b border-border/40 bg-card/50 flex flex-col gap-3">
                  <Field label="Why do you want this role?" htmlFor="whyThisRole">
                    <Textarea
                      id="whyThisRole"
                      name="whyThisRole"
                      defaultValue={application?.whyThisRole ?? ""}
                      rows={3}
                      placeholder="Explain your motivation for this specific company..."
                    />
                  </Field>
                  <Field label="Company Research Notes" htmlFor="companyResearchNotes">
                    <Textarea
                      id="companyResearchNotes"
                      name="companyResearchNotes"
                      defaultValue={application?.companyResearchNotes ?? ""}
                      rows={4}
                      placeholder="Glassdoor reviews, tech stack, funding, etc..."
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Accordion 5: Follow-Up Logs (Only when editing) */}
            {isEdit && application?.id && (
              <div>
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === "followup" ? null : "followup")}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-left border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors"
                >
                  <span>[05_FOLLOW_UP_LOGS] ({followUps.length})</span>
                  <span className="text-muted-foreground">{expandedSection === "followup" ? "[-]" : "[+]"}</span>
                </button>
                {expandedSection === "followup" && (
                  <div className="p-3 border-x border-b border-border/40 bg-card/50 flex flex-col gap-3">
                    {/* Add new follow up */}
                    <div className="p-2.5 border border-border/50 bg-background/50 flex flex-col gap-2.5">
                      <div className="text-[10px] font-mono font-bold uppercase text-foreground">Log New Follow-Up Action</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[9px] font-mono uppercase" htmlFor="new-method">Method</Label>
                          <Select value={newMethod} onValueChange={(val) => setNewMethod(val ?? "email")}>
                            <SelectTrigger id="new-method" className="h-7 text-xs font-mono">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="linkedin">LinkedIn DM</SelectItem>
                              <SelectItem value="phone">Phone call</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[9px] font-mono uppercase" htmlFor="new-date">Date Sent</Label>
                          <Input
                            id="new-date"
                            type="date"
                            value={newSentAt}
                            onChange={(e) => setNewSentAt(e.target.value)}
                            className="h-7 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[9px] font-mono uppercase" htmlFor="new-content">Notes / Message Content</Label>
                        <Textarea
                          id="new-content"
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          rows={2}
                          placeholder="e.g. Sent cold message to engineering head..."
                          className="text-xs font-mono"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddFollowUp}
                        disabled={addingFollowUp}
                        size="sm"
                        className="h-7 text-[10px] font-mono uppercase"
                      >
                        {addingFollowUp ? "Saving..." : "Add Follow-Up Log"}
                      </Button>
                    </div>

                    {/* Follow-up history list */}
                    <div className="space-y-2 mt-2">
                      {followUps.length === 0 ? (
                        <p className="text-[9px] font-mono text-muted-foreground uppercase text-center py-4 border border-dashed border-border/40 bg-muted/5">
                          No follow-up actions logged yet.
                        </p>
                      ) : (
                        followUps.map((log) => (
                          <div key={log.id} className="p-2 border border-border/40 bg-background/30 flex flex-col gap-1.5 text-xs font-mono relative">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-foreground bg-muted/40 px-1 border border-border/30">
                                {log.method}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                {new Date(log.sentAt).toLocaleDateString()}
                              </span>
                            </div>
                            {log.content && <p className="text-[10px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{log.content}</p>}
                            <div className="flex items-center justify-between border-t border-border/20 pt-1.5 mt-1">
                              <label className="flex items-center gap-1 cursor-pointer select-none text-[9px] font-bold">
                                <input
                                  type="checkbox"
                                  checked={log.responseReceived}
                                  onChange={(e) => handleToggleResponse(log.id, e.target.checked)}
                                  className="h-3 w-3 rounded-none border-border bg-background text-foreground focus:ring-0 focus:ring-offset-0"
                                />
                                <span>RESPONDED</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleDeleteFollowUp(log.id)}
                                className="text-[9px] text-muted-foreground hover:text-destructive uppercase font-bold"
                              >
                                [DELETE]
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
