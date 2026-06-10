"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { LayoutDashboard, FileText, LogOut, Menu, X, Heart, BarChart3 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/auth"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { GoalTracker } from "@/components/goal-tracker"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
]

export function AppNav({
  displayName,
  weeklyGoal,
  applications,
}: {
  displayName: string
  weeklyGoal: number
  applications: {
    status: string
    appliedDate: string | null
  }[]
}) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Close drawer on path change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const navContent = (
    <div className="relative flex flex-col h-full z-10">
      {/* dot matrix background */}
      <div className="dot-matrix-mesh opacity-30" />

      {/* Branding */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/50 relative overflow-hidden">
        <div className="relative h-9 w-9 shrink-0 transition-transform duration-200 hover:scale-105">
          <Image
            src="/apple-touch-icon.png"
            alt="HuntBoard"
            fill
            sizes="36px"
            priority
            className="object-contain"
          />
        </div>
        <div className="flex flex-col relative z-10">
          <span className="text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
            HUNTBOARD <span className="font-mono text-[9px] text-muted-foreground font-normal">[SYS_V1]</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            JOB_HUNT_ROUTER
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1.5 px-4 py-6 grow relative z-10">
        {NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className="w-full">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-3 py-2.5 h-10 font-mono text-xs uppercase tracking-wider transition-all duration-200 rounded-none border border-transparent",
                  active 
                    ? "bg-[#2D2D2D]/10 dark:bg-[#EAE8E4]/10 text-foreground border-l-2 border-l-[#E82D2D] font-bold" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  active ? "text-[#E82D2D]" : "text-muted-foreground"
                )} />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto font-mono text-[9px] opacity-65">
                    [ACTIVE]
                  </span>
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Weekly Goal Tracker */}
      <div className="relative z-10">
        <GoalTracker weeklyGoal={weeklyGoal} applications={applications} />
      </div>

      {/* Footer Profile & Actions */}
      <div className="p-4 border-t border-border/50 bg-secondary/10 mt-auto flex flex-col gap-3 relative z-10">
        <div className="flex items-center justify-between gap-3 px-2 py-1.5">
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">Operator</span>
            <span className="text-xs font-mono font-semibold text-foreground truncate max-w-[10rem]">
              {displayName}
            </span>
          </div>
          <ThemeToggle />
        </div>
        <form action={logout} className="w-full">
          <Button
            type="submit"
            variant="outline"
            className="w-full justify-center gap-2 h-9 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all duration-200 rounded-none"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Terminate Session</span>
          </Button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-20 md:w-64 md:border-r md:border-border md:bg-card md:text-card-foreground relative overflow-hidden">
        <div className="blueprint-grid-lines">
          <div className="blueprint-grid-cols">
            <div className="blueprint-grid-col-line" />
            <div className="blueprint-grid-col-line" />
          </div>
        </div>
        {navContent}
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 px-4">
        <div className="flex items-center gap-2.5">
          <div className="relative h-7 w-7 shrink-0">
            <Image
              src="/apple-touch-icon.png"
              alt="HuntBoard"
              fill
              sizes="28px"
              priority
              className="object-contain"
            />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            HuntBoard
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile Drawer (Backdrop & Sheet) */}
      <div 
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-300",
          isOpen ? "visible" : "invisible"
        )}
      >
        {/* Backdrop overlay */}
        <div
          className={cn(
            "fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setIsOpen(false)}
        />

        {/* Drawer sheet */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Close button in Drawer */}
          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {navContent}
        </div>
      </div>
    </>
  )
}
