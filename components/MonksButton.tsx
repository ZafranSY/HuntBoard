import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MonksButtonProps {
  label: string
  href?: string
  variant?: "primary" | "secondary" | "outline" | "primary-inverted"
  onClick?: () => void
  className?: string
  disabled?: boolean
  type?: "button" | "submit" | "reset"
}

export default function MonksButton({
  label,
  href,
  variant = "primary",
  onClick,
  className,
  disabled = false,
  type = "button",
}: MonksButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-heading font-bold text-xs uppercase tracking-wider rounded-full transition-all duration-200 select-none py-2.5 px-5 h-10 outline-none focus-visible:ring-2 focus-visible:ring-[#E82D2D] disabled:opacity-40 disabled:pointer-events-none"

  const variants = {
    primary:
      "bg-primary text-primary-foreground border border-transparent hover:opacity-90 active:scale-[0.98]",
    "primary-inverted":
      "bg-background text-foreground border border-transparent hover:bg-muted active:scale-[0.98]",
    outline:
      "bg-transparent text-foreground border border-foreground/30 hover:border-foreground hover:bg-foreground/5 active:scale-[0.98]",
    secondary:
      "bg-muted text-foreground border border-transparent hover:bg-muted/80 active:scale-[0.98]",
  }

  // Right-docked interlocking circle arrow badge
  const arrowBadge = (
    <span className={cn(
      "ml-2 flex items-center justify-center h-5 w-5 rounded-full shrink-0 transition-transform duration-200 group-hover:translate-x-0.5",
      variant === "primary" ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
    )}>
      <ArrowRight className="h-3 w-3 stroke-[2.5]" />
    </span>
  )

  const hasBadge = variant === "primary" || variant === "primary-inverted"

  const buttonContent = (
    <>
      <span>{label}</span>
      {hasBadge && arrowBadge}
    </>
  )

  if (href && !disabled) {
    return (
      <Link href={href} className={cn("group", baseStyles, variants[variant], className)}>
        {buttonContent}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn("group", baseStyles, variants[variant], className)}
    >
      {buttonContent}
    </button>
  )
}
