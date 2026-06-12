import { getResumes } from "@/app/actions/resumes"
import { getApplications } from "@/app/actions/applications"
import { ResumesClient } from "@/components/resumes-client"
import { getSession, isSectionAllowed } from "@/lib/auth/session"
import { AccessRestricted } from "@/components/access-restricted"

export default async function ResumesPage() {
  const session = await getSession()
  if (!isSectionAllowed(session, "resumes")) {
    return <AccessRestricted />
  }

  const [resumes, applications] = await Promise.all([
    getResumes(),
    getApplications(),
  ])

  return <ResumesClient resumes={resumes} applications={applications} />
}
