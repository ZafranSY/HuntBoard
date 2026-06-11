import type { ApplicationStatus, Priority } from "@/lib/db/schema"

export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; dot: string; badge: string }
> = {
  wishlist: {
    label: "Wishlist",
    dot: "bg-chart-5",
    badge: "bg-chart-5/15 text-chart-5",
  },
  applied: {
    label: "Applied",
    dot: "bg-chart-2",
    badge: "bg-chart-2/15 text-chart-2",
  },
  viewed: {
    label: "Responded",
    dot: "bg-chart-1",
    badge: "bg-chart-1/15 text-chart-1",
  },
  interviewing: {
    label: "Interviewing",
    dot: "bg-chart-4",
    badge: "bg-chart-4/15 text-chart-4",
  },
  interview: {
    label: "Interview",
    dot: "bg-chart-4",
    badge: "bg-chart-4/15 text-chart-4",
  },
  technical_test: {
    label: "Technical Test",
    dot: "bg-chart-4",
    badge: "bg-chart-4/15 text-chart-4",
  },
  final_interview: {
    label: "Final Interview",
    dot: "bg-chart-4",
    badge: "bg-chart-4/15 text-chart-4",
  },
  offer: {
    label: "Offer",
    dot: "bg-chart-3",
    badge: "bg-chart-3/15 text-chart-3",
  },
  accepted: {
    label: "Accepted",
    dot: "bg-chart-3",
    badge: "bg-chart-3/15 text-chart-3",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-chart-5",
    badge: "bg-chart-5/15 text-chart-5",
  },
  ghosted: {
    label: "Ghosted",
    dot: "bg-chart-5",
    badge: "bg-chart-5/15 text-chart-5",
  },
}

export const PRIORITY_META: Record<
  Priority,
  { label: string; badge: string }
> = {
  low: { label: "Low", badge: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", badge: "bg-chart-2/15 text-chart-2" },
  high: { label: "High", badge: "bg-destructive/15 text-destructive" },
}

export function formatSalary(min: number | null, max: number | null): string {
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `${fmt(min)}+`
  if (max) return `Up to ${fmt(max)}`
  return "—"
}

export function formatDate(d: string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
