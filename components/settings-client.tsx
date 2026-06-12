"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { 
  Key, 
  Share2, 
  Trash2, 
  Settings, 
  Users, 
  History, 
  Plus, 
  Copy, 
  Check, 
  Loader2, 
  ShieldAlert, 
  Lock,
  Unlock,
  AlertTriangle,
  UserX,
  Palette,
  Goal,
  Clock,
  UserCheck
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import MonksButton from "@/components/MonksButton"
import { 
  updateNamespaceSettings, 
  changePinAction, 
  disablePinAction, 
  enablePinAction, 
  removeAllCollaboratorsAction 
} from "@/app/actions/namespaces"
import { 
  createInviteLinkAction, 
  revokeInviteLinkAction, 
  updateCollaboratorAction, 
  revokeCollaboratorAction 
} from "@/app/actions/sharing"
import { cn } from "@/lib/utils"


interface SettingsClientProps {
  namespace: {
    id: number
    displayName: string
    weeklyGoal: number
    color: string
    pinHash: string | null
    slug: string
  }
  sessionPermission: "owner" | "editor" | "contributor" | "viewer"
  collaborators: {
    id: string
    displayName: string
    color: string
    permission: "owner" | "editor" | "contributor" | "viewer" | string
    joinedAt: Date
    lastActivityAt: Date | null
    collaboratorNamespaceId: number
    sharedSections?: string[] | null
  }[]
  inviteLinks: {
    id: string
    boardId: number
    token: string
    linkName: string | null
    permission: "owner" | "editor" | "contributor" | "viewer" | string
    expiresAt: Date | null
    maxUses: number | null
    usedCount: number
    createdAt: Date
    revokedAt: Date | null
    sharedSections?: string[] | null
    requireAccount?: boolean
  }[]
  activityLog: {
    id: string
    action: string
    createdAt: Date
    actorName: string | null
    details: any
  }[]
}

export function SettingsClient({
  namespace,
  sessionPermission,
  collaborators,
  inviteLinks,
  activityLog,
}: SettingsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(sessionPermission === "owner" ? "general" : "collaborators")
  const [pending, startTransition] = useTransition()

  // Origin for invite links
  const [origin, setOrigin] = useState("")
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  // State for General Settings
  const [displayName, setDisplayName] = useState(namespace.displayName)
  const [weeklyGoal, setWeeklyGoal] = useState(namespace.weeklyGoal)

  // State for PIN forms
  const [pinInput, setPinInput] = useState("")
  const [confirmPinInput, setConfirmPinInput] = useState("")
  const [oldPin, setOldPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmNewPin, setConfirmNewPin] = useState("")

  // State for Invite Link Form
  const [linkName, setLinkName] = useState("")
  const [invitePermission, setInvitePermission] = useState<"viewer" | "contributor" | "editor">("viewer")
  const [expiresIn, setExpiresIn] = useState("never")
  const [customExpiresAt, setCustomExpiresAt] = useState("")
  const [maxUses, setMaxUses] = useState("")
  const [sharedSections, setSharedSections] = useState<string[]>(["dashboard", "resumes", "wishlist", "analytics"])
  const [requireAccount, setRequireAccount] = useState<boolean>(false)

  // Copy state
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)

  // Handlers for General Settings
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      try {
        await updateNamespaceSettings(displayName, Number(weeklyGoal))
        toast.success("Settings updated successfully")
        router.refresh()
      } catch (err: any) {
        toast.error(err.message || "Failed to update settings")
      }
    })
  }

  // Handlers for PIN
  const handleEnablePin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput !== confirmPinInput) {
      toast.error("PINs do not match")
      return
    }
    startTransition(async () => {
      try {
        await enablePinAction(pinInput)
        toast.success("PIN protection enabled")
        setPinInput("")
        setConfirmPinInput("")
        router.refresh()
      } catch (err: any) {
        toast.error(err.message || "Failed to enable PIN")
      }
    })
  }

  const handleDisablePin = () => {
    if (!confirm("Are you sure you want to disable PIN protection?")) return
    startTransition(async () => {
      try {
        await disablePinAction()
        toast.success("PIN protection disabled")
        router.refresh()
      } catch (err: any) {
        toast.error(err.message || "Failed to disable PIN")
      }
    })
  }

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPin !== confirmNewPin) {
      toast.error("New PINs do not match")
      return
    }
    startTransition(async () => {
      try {
        await changePinAction(oldPin, newPin)
        toast.success("PIN changed successfully")
        setOldPin("")
        setNewPin("")
        setConfirmNewPin("")
        router.refresh()
      } catch (err: any) {
        toast.error(err.message || "Failed to change PIN")
      }
    })
  }

  // Collaborator Handlers
  const handleUpdateCollaboratorRole = (collabId: string, role: "viewer" | "contributor" | "editor") => {
    startTransition(async () => {
      try {
        await updateCollaboratorAction(collabId, role)
        toast.success("Collaborator role updated")
        router.refresh()
      } catch (err: any) {
        toast.error(err.message || "Failed to update collaborator role")
      }
    })
  }

  const handleRevokeCollaborator = (collabId: string, name: string) => {
    if (!confirm(`Revoke access for ${name}?`)) return
    startTransition(async () => {
      try {
        await revokeCollaboratorAction(collabId)
        toast.success(`${name} access revoked`)
        router.refresh()
      } catch (err: any) {
        toast.error(err.message || "Failed to revoke collaborator access")
      }
    })
  }

  // Invite Links Handlers
  const handleCreateInviteLink = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("boardId", String(namespace.id))
        formData.append("linkName", linkName)
        formData.append("permission", invitePermission)
        formData.append("expiresIn", expiresIn)
        if (expiresIn === "custom" && customExpiresAt) {
          formData.append("expiresAt", customExpiresAt)
        }
        if (maxUses) {
          formData.append("maxUses", maxUses)
        }
        sharedSections.forEach((section) => {
          formData.append("sharedSections", section)
        })
        formData.append("requireAccount", String(requireAccount))

        await createInviteLinkAction(formData)
        toast.success("Invite link generated")
        setLinkName("")
        setInvitePermission("viewer")
        setExpiresIn("never")
        setCustomExpiresAt("")
        setMaxUses("")
        setSharedSections(["dashboard", "resumes", "wishlist", "analytics"])
        setRequireAccount(false)
        router.refresh()
      } catch (err: any) {
        toast.error(err.message || "Failed to create invite link")
      }
    })
  }

  const handleRevokeInviteLink = (linkId: string) => {
    if (!confirm("Revoke this invite link? Users won't be able to join using it anymore.")) return
    startTransition(async () => {
      try {
        await revokeInviteLinkAction(linkId)
        toast.success("Invite link revoked")
        router.refresh()
      } catch (err: any) {
        toast.error(err.message || "Failed to revoke link")
      }
    })
  }

  // Danger Zone Handlers
  const handleRevokeAllCollaborators = () => {
    if (!confirm("CRITICAL WARNING: This will revoke access for ALL current collaborators. They will lose access to this board immediately. Are you sure?")) return
    startTransition(async () => {
      try {
        await removeAllCollaboratorsAction()
        toast.success("All collaborator access revoked")
        router.refresh()
      } catch (err: any) {
        toast.error(err.message || "Failed to revoke all collaborators")
      }
    })
  }

  const copyToClipboard = (linkId: string, token: string) => {
    const url = `${origin}/join/${token}`
    navigator.clipboard.writeText(url)
    setCopiedLinkId(linkId)
    toast.success("Invite link copied to clipboard")
    setTimeout(() => setCopiedLinkId(null), 2000)
  }

  const isOwner = sessionPermission === "owner"

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Blueprint Header */}
      <div className="flex flex-col gap-1 border-b pb-5 relative overflow-hidden">
        <div className="absolute inset-0 dot-matrix-mesh opacity-10 pointer-events-none" />
        <h1 className="text-3xl font-heading font-black tracking-tight uppercase flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary animate-pulse" /> Settings
        </h1>
        <p className="text-xs font-mono text-muted-foreground uppercase mt-1">
          BOARD: {namespace.displayName} ({namespace.slug}) &bull; ROLE: {sessionPermission}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Custom Styled TabsList for Industrial look */}
        <TabsList className="flex flex-wrap gap-1 bg-transparent border-b border-border/80 p-0 rounded-none w-full justify-start h-auto mb-6">
          {isOwner && (
            <>
              <TabsTrigger 
                value="general" 
                className="rounded-none border-b-2 border-transparent data-active:border-primary font-mono text-xs uppercase px-4 py-3 h-auto"
                id="btn-tab-general"
              >
                <Palette className="h-3.5 w-3.5 mr-2" /> General
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="rounded-none border-b-2 border-transparent data-active:border-primary font-mono text-xs uppercase px-4 py-3 h-auto"
                id="btn-tab-security"
              >
                <Key className="h-3.5 w-3.5 mr-2" /> Security (PIN)
              </TabsTrigger>
            </>
          )}
          <TabsTrigger 
            value="collaborators" 
            className="rounded-none border-b-2 border-transparent data-active:border-primary font-mono text-xs uppercase px-4 py-3 h-auto"
            id="btn-tab-collaborators"
          >
            <Users className="h-3.5 w-3.5 mr-2" /> Collaborators
          </TabsTrigger>
          {isOwner && (
            <>
              <TabsTrigger 
                value="sharing" 
                className="rounded-none border-b-2 border-transparent data-active:border-primary font-mono text-xs uppercase px-4 py-3 h-auto"
                id="btn-tab-sharing"
              >
                <Share2 className="h-3.5 w-3.5 mr-2" /> Invite Links
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="rounded-none border-b-2 border-transparent data-active:border-primary font-mono text-xs uppercase px-4 py-3 h-auto"
                id="btn-tab-logs"
              >
                <History className="h-3.5 w-3.5 mr-2" /> Activity Log
              </TabsTrigger>
              <TabsTrigger 
                value="danger" 
                className="rounded-none border-b-2 border-transparent data-active:border-destructive/60 hover:text-destructive data-active:text-destructive text-muted-foreground font-mono text-xs uppercase px-4 py-3 h-auto"
                id="btn-tab-danger"
              >
                <ShieldAlert className="h-3.5 w-3.5 mr-2" /> Danger Zone
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* ================= GENERAL TAB ================= */}
        {isOwner && (
          <TabsContent value="general" className="outline-none">
            <Card className="rounded-none border border-border shadow-none relative overflow-hidden bg-card">
              <div className="absolute inset-0 dot-matrix-mesh opacity-[0.02] pointer-events-none" />
              <CardHeader className="border-b border-border/50 py-4 px-6 bg-muted/20">
                <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" /> Customize Board Settings
                </CardTitle>
                <CardDescription className="text-xs font-mono uppercase text-muted-foreground">
                  Update appearance and operational metrics of your board
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveGeneral} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase text-muted-foreground block">Board Name</label>
                    <Input
                      id="input-board-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      placeholder="My HuntBoard"
                      className="rounded-none border-border/80 focus-visible:ring-primary/20 h-10 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase text-muted-foreground block">Weekly Applications Goal</label>
                    <div className="flex items-center gap-2">
                      <Goal className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        id="input-weekly-goal"
                        type="number"
                        min="1"
                        value={weeklyGoal}
                        onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                        required
                        className="rounded-none border-border/80 focus-visible:ring-primary/20 h-10 w-28 font-mono"
                      />
                      <span className="text-xs font-mono uppercase text-muted-foreground">applications / week</span>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4 flex justify-end">
                    <MonksButton
                      type="submit"
                      disabled={pending}
                      label={pending ? "Saving..." : "Save Board Settings"}
                      variant="primary"
                    />
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ================= SECURITY TAB ================= */}
        {isOwner && (
          <TabsContent value="security" className="outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Enable / Disable PIN Card */}
              <Card className="rounded-none border border-border shadow-none relative overflow-hidden bg-card">
                <div className="absolute inset-0 dot-matrix-mesh opacity-[0.02] pointer-events-none" />
                <CardHeader className="border-b border-border/50 py-4 px-6 bg-muted/20">
                  <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                    {namespace.pinHash ? (
                      <Lock className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Unlock className="h-4 w-4 text-amber-500" />
                    )}
                    PIN Authentication Status
                  </CardTitle>
                  <CardDescription className="text-xs font-mono uppercase text-muted-foreground">
                    Secure access to your board with a numeric pass-key
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono uppercase text-muted-foreground">CURRENT STATE:</span>
                    {namespace.pinHash ? (
                      <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono rounded-none">
                        ENABLED
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-mono rounded-none">
                        DISABLED / ACCESSIBLE TO ALL WITH BOARD PATH
                      </Badge>
                    )}
                  </div>

                  {namespace.pinHash ? (
                    <div className="space-y-4 pt-2">
                      <p className="text-xs font-mono uppercase text-muted-foreground leading-relaxed">
                        To remove passcode restrictions on this board, click below. This will allow any visitor with the URL path to access.
                      </p>
                      <Button
                        id="btn-disable-pin"
                        onClick={handleDisablePin}
                        disabled={pending}
                        variant="outline"
                        className="rounded-none border-border hover:border-destructive hover:bg-destructive/5 hover:text-destructive text-xs font-mono uppercase w-full h-10 transition-colors"
                      >
                        {pending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Unlock className="h-4 w-4 mr-2" />
                        )}
                        Disable PIN Protection
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleEnablePin} className="space-y-4 pt-2">
                      <p className="text-xs font-mono uppercase text-muted-foreground leading-relaxed">
                        Protect this board immediately. Visitors will need this passcode to view/edit content.
                      </p>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground block">Passcode (4-8 digits)</label>
                        <Input
                          id="input-enable-pin"
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={8}
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                          required
                          className="rounded-none font-mono"
                          placeholder="••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground block">Confirm Passcode</label>
                        <Input
                          id="input-enable-pin-confirm"
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={8}
                          value={confirmPinInput}
                          onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ""))}
                          required
                          className="rounded-none font-mono"
                          placeholder="••••"
                        />
                      </div>
                      <Button
                        id="btn-submit-enable-pin"
                        type="submit"
                        disabled={pending || !pinInput}
                        className="w-full rounded-none font-mono text-xs uppercase h-10 bg-primary text-primary-foreground hover:bg-primary/95"
                      >
                        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                        Enable PIN Code
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Change PIN Card */}
              {namespace.pinHash && (
                <Card className="rounded-none border border-border shadow-none relative overflow-hidden bg-card">
                  <div className="absolute inset-0 dot-matrix-mesh opacity-[0.02] pointer-events-none" />
                  <CardHeader className="border-b border-border/50 py-4 px-6 bg-muted/20">
                    <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" /> Modify Existing PIN
                    </CardTitle>
                    <CardDescription className="text-xs font-mono uppercase text-muted-foreground">
                      Update the passcode currently set for access auth
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleChangePin} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground block">Current Passcode</label>
                        <Input
                          id="input-change-pin-current"
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={8}
                          value={oldPin}
                          onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
                          required
                          className="rounded-none font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground block">New Passcode (4-8 digits)</label>
                        <Input
                          id="input-change-pin-new"
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={8}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                          required
                          className="rounded-none font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground block">Confirm New Passcode</label>
                        <Input
                          id="input-change-pin-new-confirm"
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={8}
                          value={confirmNewPin}
                          onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ""))}
                          required
                          className="rounded-none font-mono"
                        />
                      </div>
                      <Button
                        id="btn-submit-change-pin"
                        type="submit"
                        disabled={pending || !newPin || !oldPin}
                        className="w-full rounded-none font-mono text-xs uppercase h-10 bg-primary text-primary-foreground hover:bg-primary/95"
                      >
                        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                        Apply New Passcode
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}

        {/* ================= COLLABORATORS TAB ================= */}
        <TabsContent value="collaborators" className="outline-none">
          <Card className="rounded-none border border-border shadow-none relative overflow-hidden bg-card">
            <div className="absolute inset-0 dot-matrix-mesh opacity-[0.02] pointer-events-none" />
            <CardHeader className="border-b border-border/50 py-4 px-6 bg-muted/20">
              <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Active Board Collaborators
              </CardTitle>
              <CardDescription className="text-xs font-mono uppercase text-muted-foreground">
                Review users currently participating in this tracking workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {collaborators.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                  <Users className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-xs font-mono uppercase text-muted-foreground">No active collaborators on this board.</p>
                  {isOwner && (
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("sharing")}
                      className="rounded-none text-xs font-mono uppercase h-9 border-dashed mt-2"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Generate invite link
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/10">
                        <th className="p-4 text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Name</th>
                        <th className="p-4 text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Access Scope</th>
                        <th className="p-4 text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Joined Date</th>
                        <th className="p-4 text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Last Sync</th>
                        {isOwner && <th className="p-4 text-[10px] font-mono uppercase text-muted-foreground tracking-wider text-right">Settings</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-xs">
                      {collaborators.map((collab) => (
                        <tr key={collab.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4 flex items-center gap-2.5">
                            <div 
                              className="h-2.5 w-2.5 shrink-0" 
                              style={{ backgroundColor: collab.color }}
                            />
                            <span className="font-bold text-foreground">{collab.displayName}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <Badge className="w-fit bg-primary/5 text-primary border border-primary/15 text-[10px] font-mono rounded-none uppercase">
                                {collab.permission}
                              </Badge>
                              {collab.sharedSections && (
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {(collab.sharedSections as string[]).map((sec) => (
                                    <span key={sec} className="text-[9px] text-muted-foreground uppercase bg-muted/40 px-1 border border-border/20">
                                      {sec}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(collab.joinedAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {collab.lastActivityAt ? (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-emerald-500" />
                                {new Date(collab.lastActivityAt).toLocaleDateString()}{" "}
                                {new Date(collab.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              "Never"
                            )}
                          </td>
                          {isOwner && (
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Role select */}
                                <select
                                  id={`role-select-${collab.id}`}
                                  value={collab.permission}
                                  onChange={(e) => handleUpdateCollaboratorRole(collab.id, e.target.value as any)}
                                  disabled={pending}
                                  className="bg-background border border-border px-2 py-1 text-[11px] rounded-none focus:outline-none focus:border-primary font-mono"
                                >
                                  <option value="viewer">Viewer</option>
                                  <option value="contributor">Contributor</option>
                                  <option value="editor">Editor</option>
                                </select>

                                {/* Revoke button */}
                                <Button
                                  id={`btn-revoke-collab-${collab.id}`}
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRevokeCollaborator(collab.id, collab.displayName)}
                                  disabled={pending}
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-none"
                                >
                                  <UserX className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= SHARING & INVITES TAB ================= */}
        {isOwner && (
          <TabsContent value="sharing" className="outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Create link panel */}
              <div className="md:col-span-1">
                <Card className="rounded-none border border-border shadow-none relative overflow-hidden bg-card">
                  <div className="absolute inset-0 dot-matrix-mesh opacity-[0.02] pointer-events-none" />
                  <CardHeader className="border-b border-border/50 py-4 px-6 bg-muted/20">
                    <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                      <Plus className="h-4 w-4 text-primary" /> Create Invite Link
                    </CardTitle>
                    <CardDescription className="text-xs font-mono uppercase text-muted-foreground">
                      Deploy new entry gateways to this board
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleCreateInviteLink} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground block">Link Name / Label</label>
                        <Input
                          id="input-link-name"
                          type="text"
                          placeholder="E.g., Team Member Invite"
                          value={linkName}
                          onChange={(e) => setLinkName(e.target.value)}
                          className="rounded-none font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground block">Granted Scope/Permission</label>
                        <select
                          id="select-link-permission"
                          value={invitePermission}
                          onChange={(e) => setInvitePermission(e.target.value as any)}
                          className="w-full bg-background border border-border px-3 py-2 text-xs rounded-none focus:outline-none focus:border-primary font-mono h-9"
                        >
                          <option value="viewer">Viewer (Read Only)</option>
                          <option value="contributor">Contributor (Edit Own Cards)</option>
                          <option value="editor">Editor (Edit Everything)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground block">Link Expiration</label>
                        <select
                          id="select-link-expires"
                          value={expiresIn}
                          onChange={(e) => setExpiresIn(e.target.value)}
                          className="w-full bg-background border border-border px-3 py-2 text-xs rounded-none focus:outline-none focus:border-primary font-mono h-9"
                        >
                          <option value="never">Never Expires</option>
                          <option value="7days">Expires in 7 Days</option>
                          <option value="30days">Expires in 30 Days</option>
                          <option value="custom">Custom Date</option>
                        </select>
                      </div>

                      {expiresIn === "custom" && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono uppercase text-muted-foreground block">Expire Date</label>
                          <Input
                            id="input-link-expires-date"
                            type="datetime-local"
                            value={customExpiresAt}
                            onChange={(e) => setCustomExpiresAt(e.target.value)}
                            required
                            className="rounded-none font-mono"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground block">Max Usage Limit</label>
                        <Input
                          id="input-link-max-uses"
                          type="number"
                          min="1"
                          placeholder="Unlimited"
                          value={maxUses}
                          onChange={(e) => setMaxUses(e.target.value)}
                          className="rounded-none font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground block">Allowed Sections</label>
                        <div className="grid grid-cols-2 gap-2 border border-border p-3 bg-muted/10">
                          {[
                            { id: "dashboard", label: "Applications" },
                            { id: "resumes", label: "Resumes" },
                            { id: "wishlist", label: "Wishlist" },
                            { id: "analytics", label: "Analytics" }
                          ].map((sec) => {
                            const isChecked = sharedSections.includes(sec.id);
                            return (
                              <label key={sec.id} className="flex items-center space-x-2 cursor-pointer text-xs font-mono select-none">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setSharedSections((prev) =>
                                      prev.includes(sec.id) ? prev.filter((s) => s !== sec.id) : [...prev, sec.id]
                                    );
                                  }}
                                  className="h-3.5 w-3.5 rounded-none border-border bg-background text-primary focus:ring-0 focus:ring-offset-0 accent-primary cursor-pointer"
                                />
                                <span className={isChecked ? "text-foreground" : "text-muted-foreground"}>
                                  {sec.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase text-muted-foreground block">Guest Access Policy</label>
                        <div className="space-y-2 border border-border p-3 bg-muted/10">
                          <label className="flex items-start space-x-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="requireAccount"
                              checked={!requireAccount}
                              onChange={() => setRequireAccount(false)}
                              className="mt-0.5 h-3.5 w-3.5 rounded-full border-border bg-background text-primary focus:ring-0 focus:ring-offset-0 accent-primary cursor-pointer"
                            />
                            <div className="text-[11px] font-mono leading-tight">
                              <span className={!requireAccount ? "text-foreground font-semibold" : "text-muted-foreground"}>
                                Public (Anyone)
                              </span>
                              <span className="block text-[9px] text-muted-foreground mt-0.5">Guests can join with a guest name.</span>
                            </div>
                          </label>
                          <label className="flex items-start space-x-2 cursor-pointer select-none border-t border-border/50 pt-2 mt-2">
                            <input
                              type="radio"
                              name="requireAccount"
                              checked={requireAccount}
                              onChange={() => setRequireAccount(true)}
                              className="mt-0.5 h-3.5 w-3.5 rounded-full border-border bg-background text-primary focus:ring-0 focus:ring-offset-0 accent-primary cursor-pointer"
                            />
                            <div className="text-[11px] font-mono leading-tight">
                              <span className={requireAccount ? "text-foreground font-semibold" : "text-muted-foreground"}>
                                Registered Users Only
                              </span>
                              <span className="block text-[9px] text-muted-foreground mt-0.5">Requires a registered account.</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      <Button
                        id="btn-create-link"
                        type="submit"
                        disabled={pending}
                        className="w-full rounded-none font-mono text-xs uppercase h-10 bg-primary text-primary-foreground hover:bg-primary/95"
                      >
                        {pending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Generate Invite Link
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Active links list */}
              <div className="md:col-span-2">
                <Card className="rounded-none border border-border shadow-none relative overflow-hidden bg-card h-full flex flex-col">
                  <div className="absolute inset-0 dot-matrix-mesh opacity-[0.02] pointer-events-none" />
                  <CardHeader className="border-b border-border/50 py-4 px-6 bg-muted/20">
                    <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-primary" /> Deployed Gateway Links
                    </CardTitle>
                    <CardDescription className="text-xs font-mono uppercase text-muted-foreground">
                      Active links capable of admitting new collaborators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 grow flex flex-col">
                    {inviteLinks.filter((l) => !l.revokedAt).length === 0 ? (
                      <div className="p-12 text-center flex flex-col items-center justify-center gap-3 my-auto">
                        <Share2 className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-xs font-mono uppercase text-muted-foreground">No active invite links deployed.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {inviteLinks.map((link) => {
                          const isRevoked = !!link.revokedAt
                          const isExpired = link.expiresAt ? new Date() > new Date(link.expiresAt) : false
                          const isMaxedOut = link.maxUses !== null && link.usedCount >= link.maxUses
                          const isInactive = isRevoked || isExpired || isMaxedOut

                          return (
                            <div 
                              key={link.id} 
                              className={cn(
                                "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono",
                                isInactive ? "opacity-55 bg-muted/5" : "hover:bg-muted/5"
                              )}
                            >
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-foreground">
                                    {link.linkName || `Link_${link.token.slice(0, 8)}`}
                                  </span>
                                  <Badge className="bg-primary/5 text-primary border border-primary/10 text-[9px] font-mono rounded-none uppercase">
                                    {link.permission}
                                  </Badge>
                                  {isRevoked && <Badge variant="destructive" className="text-[9px] font-mono rounded-none">REVOKED</Badge>}
                                  {isExpired && <Badge variant="destructive" className="text-[9px] font-mono rounded-none">EXPIRED</Badge>}
                                  {isMaxedOut && <Badge variant="destructive" className="text-[9px] font-mono rounded-none">LIMIT REACHED</Badge>}
                                </div>
                                <div className="flex items-center gap-2 bg-muted/30 p-1.5 border border-border/40 text-[10px] w-full select-all truncate">
                                  <span className="truncate">{origin}/join/{link.token}</span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                                  <span>USES: {link.usedCount} {link.maxUses ? `/ ${link.maxUses}` : ""}</span>
                                  {link.expiresAt && (
                                    <span>EXPIRES: {new Date(link.expiresAt).toLocaleDateString()}</span>
                                  )}
                                  <span>GUEST POLICY: {link.requireAccount ? "Account Required" : "Public/Guest Name"}</span>
                                </div>
                                {link.sharedSections && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {(link.sharedSections as string[]).map((sec) => (
                                      <span key={sec} className="text-[9px] text-muted-foreground uppercase bg-muted/40 px-1 border border-border/20">
                                        {sec === "dashboard" ? "applications" : sec}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {!isRevoked && (
                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  <Button
                                    id={`btn-copy-link-${link.id}`}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(link.id, link.token)}
                                    className="rounded-none h-8 font-mono text-[10px] uppercase"
                                  >
                                    {copiedLinkId === link.id ? (
                                      <Check className="h-3 w-3 mr-1 text-emerald-500" />
                                    ) : (
                                      <Copy className="h-3 w-3 mr-1" />
                                    )}
                                    Copy Link
                                  </Button>
                                  <Button
                                    id={`btn-revoke-link-${link.id}`}
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRevokeInviteLink(link.id)}
                                    disabled={pending}
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-none border border-transparent hover:border-border/30"
                                    title="Revoke Link"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}

        {/* ================= ACTIVITY LOG TAB ================= */}
        {isOwner && (
          <TabsContent value="logs" className="outline-none">
            <Card className="rounded-none border border-border shadow-none relative overflow-hidden bg-card">
              <div className="absolute inset-0 dot-matrix-mesh opacity-[0.02] pointer-events-none" />
              <CardHeader className="border-b border-border/50 py-4 px-6 bg-muted/20">
                <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" /> Board Audit Log
                </CardTitle>
                <CardDescription className="text-xs font-mono uppercase text-muted-foreground">
                  History of sharing operations and security modifications
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {activityLog.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                    <History className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-xs font-mono uppercase text-muted-foreground">No recent board activity logged.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40 font-mono text-xs">
                    {activityLog.map((log) => {
                      let actionText = ""
                      let iconColor = "text-primary"

                      switch (log.action) {
                        case "link_created":
                          actionText = `Invite link "${log.details?.linkName || "Unnamed"}" created with ${log.details?.permission || "viewer"} scope.`
                          iconColor = "text-indigo-500"
                          break
                        case "link_used":
                          actionText = `Collaborator joined board via invite link.`
                          iconColor = "text-emerald-500"
                          break
                        case "link_revoked":
                          actionText = `Invite link was revoked.`
                          iconColor = "text-amber-500"
                          break
                        case "collaborator_removed":
                          actionText = log.details?.message || `Collaborator access was revoked.`
                          iconColor = "text-destructive"
                          break
                        case "permission_changed":
                          actionText = `Collaborator role updated: ${log.details?.oldPermission} → ${log.details?.newPermission}.`
                          iconColor = "text-indigo-500"
                          break
                        default:
                          actionText = `Action "${log.action}" performed.`
                      }

                      return (
                        <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-muted/5 transition-colors">
                          <div className="flex gap-3">
                            <span className={cn("mt-0.5 shrink-0 select-none", iconColor)}>▶</span>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-foreground">{actionText}</span>
                              <span className="text-[10px] text-muted-foreground">
                                ACTOR: {log.actorName || "SYSTEM"}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ================= DANGER ZONE TAB ================= */}
        {isOwner && (
          <TabsContent value="danger" className="outline-none">
            <Card className="rounded-none border border-border shadow-none relative overflow-hidden bg-card">
              <div className="absolute inset-0 dot-matrix-mesh opacity-[0.02] pointer-events-none" />
              <CardHeader className="border-b border-border/50 py-4 px-6 bg-red-950/5 dark:bg-red-950/10">
                <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2 text-red-500 dark:text-red-400">
                  <ShieldAlert className="h-4 w-4" /> Danger Zone Actions
                </CardTitle>
                <CardDescription className="text-xs font-mono uppercase text-muted-foreground">
                  Highly destructive options. Execute with caution.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border/80 p-5 bg-muted/5 hover:border-red-500/20 transition-colors duration-300">
                  <div className="space-y-1 flex-1">
                    <span className="text-xs font-bold font-mono uppercase tracking-wider text-red-500 dark:text-red-400 block flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Revoke All Collaborators
                    </span>
                    <p className="text-xs text-muted-foreground uppercase leading-relaxed font-mono">
                      Instantly kick all guest operators from this board. They will lose access to all pipeline tracking cards.
                    </p>
                  </div>
                  <Button
                    id="btn-revoke-all-collaborators"
                    variant="outline"
                    onClick={handleRevokeAllCollaborators}
                    disabled={pending}
                    className="rounded-none border-red-500/20 hover:border-red-500 hover:bg-red-500/10 text-red-500 dark:text-red-400 text-xs font-mono uppercase shrink-0 h-10 transition-all duration-200"
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <UserX className="h-4 w-4 mr-1.5" />
                    )}
                    Revoke All Collaborators
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
