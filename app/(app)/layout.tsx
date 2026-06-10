import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { AppNav } from "@/components/app-nav"
import { db } from "@/lib/db"
import { namespaces, applications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session.namespaceId) redirect("/")

  const [[ns], apps] = await Promise.all([
    db
      .select({ weeklyGoal: namespaces.weeklyGoal })
      .from(namespaces)
      .where(eq(namespaces.id, session.namespaceId))
      .limit(1),
    db
      .select({ status: applications.status, appliedDate: applications.appliedDate })
      .from(applications)
      .where(eq(applications.namespaceId, session.namespaceId)),
  ])

  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-background">
      <AppNav
        displayName={session.displayName ?? "My board"}
        weeklyGoal={ns?.weeklyGoal ?? 10}
        applications={apps}
      />
      <main className="flex-1 md:pl-64 flex flex-col">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8 grow">
          {children}
        </div>
      </main>
    </div>
  )
}
