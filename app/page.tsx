import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { AuthCard } from "@/components/auth-card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Layers, FileText, Users } from "lucide-react"
import Image from "next/image"

const FEATURES = [
  {
    icon: Layers,
    title: "Pipeline view",
    body: "Drag roles from wishlist to offer. Always know where every application stands.",
  },
  {
    icon: FileText,
    title: "Resume tracking",
    body: "Keep every resume version and know which one you sent to which company.",
  },
  {
    icon: Users,
    title: "Hunt together",
    body: "Each friend gets their own board, secured by a personal PIN.",
  },
]

export default async function HomePage() {
  const session = await getSession()
  if (session.namespaceId) redirect("/dashboard")

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0">
            <Image
              src="/favicon-32x32.png"
              alt="HuntBoard"
              fill
              sizes="36px"
              priority
              className="object-contain block dark:hidden"
            />
            <Image
              src="/apple-touch-icon.png"
              alt="HuntBoard"
              fill
              sizes="36px"
              priority
              className="object-contain hidden dark:block"
            />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            HuntBoard
          </span>
        </div>
        <ThemeToggle />
      </header>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-none border border-border/80 bg-accent/40 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            <span className="h-2 w-2 rounded-none bg-chart-3" />
            Track your job hunt with friends
          </span>
          <h1 className="text-balance text-4xl font-extrabold leading-none tracking-tight sm:text-5xl uppercase font-heading">
            Your job hunt,{" "}
            <span className="text-primary font-black">organised.</span>
          </h1>
          <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            Build your own board. Track every application from wishlist to
            offer. Version your resumes. Share the journey with friends — each
            with their own private board.
          </p>

          <div className="flex flex-col gap-4">
            {FEATURES.map((f, idx) => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-border bg-accent/35 text-foreground font-mono text-xs">
                  0{idx + 1}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold uppercase tracking-tight">{f.title}</span>
                  <span className="text-xs text-muted-foreground">{f.body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm lg:max-w-none">
          <AuthCard />
        </div>
      </section>
    </main>
  )
}
