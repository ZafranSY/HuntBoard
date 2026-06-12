import { getApplications } from "@/app/actions/applications"
import { getResumes } from "@/app/actions/resumes"
import { DashboardClient } from "@/components/dashboard-client"
import { getSession, isSectionAllowed } from "@/lib/auth/session"
import { AccessRestricted } from "@/components/access-restricted"
import { getAccessibleBoards } from "@/app/actions/sharing"
import { BoardSwitcher } from "@/components/board-switcher"

export default async function DashboardPage() {
  const session = await getSession()
  if (!isSectionAllowed(session, "dashboard")) {
    return <AccessRestricted />
  }

  const [applications, resumes, boards] = await Promise.all([
    getApplications(),
    isSectionAllowed(session, "resumes") ? getResumes() : Promise.resolve([]),
    getAccessibleBoards(),
  ])

  const isCollaborator = session.permission && session.permission !== "owner"

  return (
    <div className="flex flex-col gap-6">
      {boards.length > 1 && <BoardSwitcher boards={boards} />}

      {isCollaborator && (
        <div className="border border-border bg-card p-4 rounded-none relative overflow-hidden flex flex-col gap-2">
          <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#D97706] animate-pulse" />
              [COLLABORATOR_ACCESS]
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
              ROLE: {session.permission}
            </span>
          </div>
          <p className="text-[11px] font-mono text-foreground/80 relative z-10">
            You&apos;re viewing <span className="font-bold text-[#E82D2D]">{session.displayName}</span>&apos;s board as a <span className="font-bold text-[#E82D2D]">{session.permission}</span>.
          </p>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Your pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Every role you&apos;re chasing, from wishlist to offer.
        </p>
      </div>
      <DashboardClient applications={applications} resumes={resumes} />
    </div>
  )
}

