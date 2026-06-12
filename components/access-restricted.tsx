import { ShieldAlert, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AccessRestricted() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 relative overflow-hidden font-mono">
      <div className="dot-matrix-mesh opacity-10 pointer-events-none absolute inset-0" />
      
      <div className="max-w-md w-full border border-border bg-card p-8 text-center relative z-10 space-y-6">
        <div className="flex justify-center">
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-none">
            <ShieldAlert className="h-10 w-10" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            [ACCESS_RESTRICTED]
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
            Security Clearance Level Insufficient
          </p>
        </div>

        <div className="border border-border/50 p-4 bg-muted/5 text-xs text-muted-foreground leading-relaxed text-left uppercase space-y-2">
          <p>• The board owner has restricted access to this section.</p>
          <p>• Only specific pipelines and directories were shared in this session.</p>
          <p>• If you believe this is an error, please request a new gateway link from the administrator.</p>
        </div>

        <div className="flex justify-center pt-2">
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="rounded-none border border-border text-xs uppercase font-mono tracking-wider hover:bg-muted/50 transition-colors h-10 px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Control Panel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
