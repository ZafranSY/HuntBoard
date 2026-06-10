import { getApplications } from "@/app/actions/applications"
import { getResumes } from "@/app/actions/resumes"
import { AnalyticsClient } from "@/components/analytics-client"

export default async function AnalyticsPage() {
  const [applications, resumes] = await Promise.all([
    getApplications(),
    getResumes(),
  ])
  return <AnalyticsClient applications={applications} resumes={resumes} />
}
