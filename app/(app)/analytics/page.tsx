import { getApplications } from "@/app/actions/applications"
import { getResumes } from "@/app/actions/resumes"
import { AnalyticsClient } from "@/components/analytics-client"
import { getSession, isSectionAllowed } from "@/lib/auth/session"
import { AccessRestricted } from "@/components/access-restricted"

export default async function AnalyticsPage() {
  const session = await getSession()
  if (!isSectionAllowed(session, "analytics")) {
    return <AccessRestricted />
  }

  const [applications, resumes] = await Promise.all([
    isSectionAllowed(session, "dashboard") ? getApplications() : Promise.resolve([]),
    isSectionAllowed(session, "resumes") ? getResumes() : Promise.resolve([]),
  ])
  return <AnalyticsClient applications={applications} resumes={resumes} />
}
