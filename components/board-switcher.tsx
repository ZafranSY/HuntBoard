"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Layers, RefreshCw, Star, User, ShieldCheck } from "lucide-react"
import { switchBoardAction } from "@/app/actions/sharing"
import { cn } from "@/lib/utils"

interface BoardItem {
  id: number
  displayName: string
  color: string
  slug: string
  permission: "owner" | "editor" | "contributor" | "viewer"
  isCurrent: boolean
}

interface BoardSwitcherProps {
  boards: BoardItem[]
}

export function BoardSwitcher({ boards }: BoardSwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // If there's only 1 board, no switcher is needed.
  if (boards.length <= 1) return null

  const handleSwitch = (boardId: number, displayName: string) => {
    startTransition(async () => {
      try {
        await switchBoardAction(boardId)
        toast.success(`Switched active board to ${displayName}`)
        router.refresh()
      } catch (err: any) {
        toast.error(err.message || "Failed to switch board")
      }
    })
  }

  return (
    <div className="border border-border bg-card p-4 rounded-none relative overflow-hidden flex flex-col gap-3">
      <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
      
      <div className="flex items-center justify-between border-b border-border/20 pb-2 relative z-10">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          [BOARD_ACCESS_DIRECTORY]
        </span>
        <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
          {boards.length} Boards Available
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 relative z-10">
        {boards.map((board) => (
          <button
            key={board.id}
            disabled={isPending || board.isCurrent}
            onClick={() => handleSwitch(board.id, board.displayName)}
            className={cn(
              "flex items-center justify-between p-3 border text-left font-mono transition-all duration-200 rounded-none relative group",
              board.isCurrent
                ? "bg-[#2D2D2D]/5 dark:bg-[#EAE8E4]/5 text-foreground border-foreground/30 font-bold"
                : "border-border/40 bg-background/50 hover:bg-background/80 hover:border-border text-muted-foreground hover:text-foreground cursor-pointer"
            )}
            style={{
              borderLeftWidth: board.isCurrent ? "4px" : "1px",
              borderLeftColor: board.isCurrent ? board.color : undefined,
            }}
          >
            <div className="flex flex-col gap-1 min-w-0 pr-2">
              <span className="text-xs font-bold truncate flex items-center gap-1.5">
                {board.displayName}
                {board.permission === "owner" ? (
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                ) : (
                  <User className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                Role: {board.permission}
              </span>
            </div>

            <div className="shrink-0 flex items-center gap-1.5">
              {board.isCurrent ? (
                <BadgeStatus text="ACTIVE" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/25" />
              ) : isPending ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-[9px] text-[#E82D2D] opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase">
                  [SWITCH]
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function BadgeStatus({ text, className }: { text: string; className?: string }) {
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 text-[8px] font-bold tracking-widest uppercase border font-mono rounded-none",
        className
      )}
    >
      [{text}]
    </span>
  )
}
