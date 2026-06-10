import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { AppNav } from "@/components/app-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session.namespaceId) redirect("/")

  return (
    <div className="min-h-dvh">
      <AppNav displayName={session.displayName ?? "My board"} />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        {children}
      </div>
    </div>
  )
}
