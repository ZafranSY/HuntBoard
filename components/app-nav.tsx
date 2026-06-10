"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/auth"
import { cn } from "@/lib/utils"
import Image from "next/image"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resumes", label: "Resumes", icon: FileText },
]

export function AppNav({ displayName }: { displayName: string }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src="/apple-touch-icon.png"
              alt="HuntBoard"
              fill
              sizes="32px"
              priority
              className="object-contain block dark:hidden"
            />
            <Image
              src="/apple-touch-icon.png"
              alt="HuntBoard"
              fill
              sizes="32px"
              priority
              className="object-contain hidden dark:block"
            />
          </div>
          <span className="hidden text-base font-semibold tracking-tight sm:inline">
            HuntBoard
          </span>
        </div>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                >
                  <item.icon className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-1">
          <span
            className={cn(
              "hidden max-w-[10rem] truncate rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground sm:inline",
            )}
          >
            {displayName}
          </span>
          <ThemeToggle />
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
