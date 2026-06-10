import { getApplications } from "@/app/actions/applications"
import { getResumes } from "@/app/actions/resumes"
import { DashboardClient } from "@/components/dashboard-client"

export default async function DashboardPage() {
  const [applications, resumes] = await Promise.all([
    getApplications(),
    getResumes(),
  ])

  return (
    <div className="flex flex-col gap-6">
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
