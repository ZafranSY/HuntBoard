"use client"

import { useRef, useState, useTransition } from "react"
import { importApplicationsFromJson } from "@/app/actions/applications"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, FileCode, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react"
import { toast } from "sonner"

const JSON_EXAMPLE = `[
  {
    "company": "Google",
    "role": "Software Engineer",
    "location": "Mountain View, CA",
    "workMode": "hybrid",
    "status": "applied",
    "priority": "high",
    "salaryMin": 150000,
    "salaryMax": 200000,
    "link": "https://google.com/jobs",
    "source": "LinkedIn",
    "notes": "Referred by John Doe",
    "appliedDate": "2026-06-10",
    "nextAction": "Follow up",
    "nextActionDate": "2026-06-17"
  }
]`

export function ImportJsonDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [jsonText, setJsonText] = useState("")
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successCount, setSuccessCount] = useState<number | null>(null)

  // Validate JSON dynamically
  const validateJson = (text: string) => {
    if (!text.trim()) {
      setErrorMsg(null)
      return null
    }
    try {
      const parsed = JSON.parse(text)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      if (items.length === 0 || !items[0] || typeof items[0] !== "object") {
        return "JSON must be an object or an array of objects."
      }
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (!item || typeof item !== "object") {
          return `Item at index ${i} is not a valid object.`
        }
        if (!item.company || !String(item.company).trim()) {
          return `Item at index ${i} is missing the required 'company' field.`
        }
        if (!item.role || !String(item.role).trim()) {
          return `Item at index ${i} is missing the required 'role' field.`
        }
      }
      return null
    } catch (err) {
      if (err instanceof Error) {
        return `Syntax Error: ${err.message}`
      }
      return "Invalid JSON syntax."
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setJsonText(val)
    setErrorMsg(validateJson(val))
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON_EXAMPLE)
    setCopied(true)
    toast.success("Example copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateJson(jsonText)
    if (validationError) {
      setErrorMsg(validationError)
      toast.error(validationError)
      return
    }

    startTransition(async () => {
      try {
        const res = await importApplicationsFromJson(jsonText)
        toast.success(`Successfully imported ${res.count} applications!`)
        setOpen(false)
        setJsonText("")
        setErrorMsg(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to import applications")
      }
    })
  }

  const isValid = jsonText.trim().length > 0 && !errorMsg

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent className="max-h-[95dvh] overflow-y-auto sm:max-w-2xl bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileCode className="h-5 w-5 text-primary" />
            Batch Import via JSON
          </DialogTitle>
          <DialogDescription>
            Add multiple job applications at once by pasting a JSON payload.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2">
          {/* Example / Formatting Section */}
          <div className="rounded-none border border-border bg-accent/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Required JSON Format
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground rounded-none border border-transparent hover:border-border"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy Example"}
              </Button>
            </div>
            <pre className="text-xs font-mono bg-card/60 p-3 rounded-none border border-border/60 overflow-x-auto text-foreground max-h-[160px] scrollbar-thin">
              {JSON_EXAMPLE}
            </pre>
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Note:</span> <code className="text-primary font-mono">company</code> and <code className="text-primary font-mono">role</code> are required for each entry. Optional fields: <code className="text-muted-foreground">location, workMode, status, priority, salaryMin, salaryMax, link, source, notes, appliedDate, nextAction, nextActionDate</code>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="json-input" className="text-sm font-medium">
                  Paste JSON Data
                </Label>
                {jsonText.trim() && (
                  <div className="flex items-center gap-1.5 text-xs">
                    {errorMsg ? (
                      <span className="flex items-center gap-1 text-destructive font-medium">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Invalid
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-500 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Valid
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Textarea
                id="json-input"
                value={jsonText}
                onChange={handleTextChange}
                placeholder="[&#10;  {&#10;    &quot;company&quot;: &quot;Acme Corp&quot;,&#10;    &quot;role&quot;: &quot;Frontend Engineer&quot;&#10;  }&#10;]"
                className="min-h-[220px] font-mono text-sm border-border bg-card focus-visible:ring-primary focus-visible:ring-1 rounded-none"
              />
              {errorMsg && (
                <p className="text-xs text-destructive flex items-start gap-1 mt-1 bg-destructive/10 p-2.5 rounded-none border border-destructive/20 font-mono">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </p>
              )}
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || pending}
                className="h-10 font-medium px-6 gap-2"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import Applications"
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
