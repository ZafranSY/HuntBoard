import { getResumes } from "@/app/actions/resumes"
import { getApplications } from "@/app/actions/applications"
import { ResumesClient } from "@/components/resumes-client"

export default async function ResumesPage() {
  const [resumes, applications] = await Promise.all([
    getResumes(),
    getApplications(),
  ])

  return <ResumesClient resumes={resumes} applications={applications} />
}
