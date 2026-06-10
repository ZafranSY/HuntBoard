"use client"

import { useEffect, useState, useMemo } from "react"
import type { Application, Resume } from "@/lib/db/schema"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TrendingUp,
  Compass,
  Sliders,
  Clock,
  MapPin,
  FileText,
  FileCode,
  Calendar,
} from "lucide-react"

export function AnalyticsClient({
  applications,
  resumes,
}: {
  applications: Application[]
  resumes: Resume[]
}) {
  const [mounted, setMounted] = useState(false)
  const [dateRange, setDateRange] = useState<"30_days" | "3_months" | "6_months" | "all">("all")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Date Cutoff Filter
  const cutoffDate = useMemo(() => {
    if (dateRange === "30_days") {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return d
    }
    if (dateRange === "3_months") {
      const d = new Date()
      d.setMonth(d.getMonth() - 3)
      return d
    }
    if (dateRange === "6_months") {
      const d = new Date()
      d.setMonth(d.getMonth() - 6)
      return d
    }
    return null
  }, [dateRange])

  // Filtered applications based on date selection
  const filteredApps = useMemo(() => {
    if (!cutoffDate) return applications
    return applications.filter((app) => {
      const dateToCheck = app.appliedDate ? new Date(app.appliedDate) : new Date(app.createdAt)
      return dateToCheck >= cutoffDate
    })
  }, [applications, cutoffDate])

  // 1. Compute 6 months data for Chart 1
  const chart1Data = useMemo(() => {
    const monthsList = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      }
    }).reverse()

    return monthsList.map(({ year, month, label }) => {
      let appliedCount = 0
      let interviewCount = 0
      let offerCount = 0

      filteredApps.forEach((app) => {
        if (!app.appliedDate) return
        const appDate = new Date(app.appliedDate)
        if (appDate.getFullYear() === year && appDate.getMonth() === month) {
          if (app.status !== "wishlist") {
            appliedCount++
          }
          if (
            [
              "interviewing",
              "interview",
              "technical_test",
              "final_interview",
              "offer",
              "accepted",
            ].includes(app.status)
          ) {
            interviewCount++
          }
          if (["offer", "accepted"].includes(app.status)) {
            offerCount++
          }
        }
      })

      return {
        name: label,
        Applied: appliedCount,
        Interviews: interviewCount,
        Offers: offerCount,
      }
    })
  }, [filteredApps])

  // 2. Compute Source Performance data for Chart 2
  const chart2Data = useMemo(() => {
    const sourceMap: Record<
      string,
      { apps: number; interviews: number; offers: number }
    > = {}

    filteredApps.forEach((app) => {
      if (app.status === "wishlist") return
      const src = (app.source ?? "").trim() || "Direct/Unknown"
      if (!sourceMap[src]) {
        sourceMap[src] = { apps: 0, interviews: 0, offers: 0 }
      }
      sourceMap[src].apps++
      if (
        [
          "interviewing",
          "interview",
          "technical_test",
          "final_interview",
          "offer",
          "accepted",
        ].includes(app.status)
      ) {
        sourceMap[src].interviews++
      }
      if (["offer", "accepted"].includes(app.status)) {
        sourceMap[src].offers++
      }
    })

    return Object.entries(sourceMap)
      .map(([name, stats]) => {
        const rate = stats.apps > 0 ? (stats.interviews / stats.apps) * 100 : 0
        return {
          name,
          Applications: stats.apps,
          Interviews: stats.interviews,
          Offers: stats.offers,
          rate,
        }
      })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10) // show top 10
  }, [filteredApps])

  // 3. Compute Cumulative Funnel Steps
  const funnelSteps = useMemo(() => {
    let cWishlist = 0
    let cApplied = 0
    let cViewed = 0
    let cInterview = 0
    let cTechTest = 0
    let cFinalInterview = 0
    let cOffer = 0
    let cAccepted = 0

    filteredApps.forEach((app) => {
      cWishlist++
      if (app.status !== "wishlist") {
        cApplied++
      }
      if (!["wishlist", "applied"].includes(app.status)) {
        cViewed++
      }
      if (
        [
          "interviewing",
          "interview",
          "technical_test",
          "final_interview",
          "offer",
          "accepted",
        ].includes(app.status)
      ) {
        cInterview++
      }
      if (
        [
          "technical_test",
          "final_interview",
          "offer",
          "accepted",
        ].includes(app.status)
      ) {
        cTechTest++
      }
      if (["final_interview", "offer", "accepted"].includes(app.status)) {
        cFinalInterview++
      }
      if (["offer", "accepted"].includes(app.status)) {
        cOffer++
      }
      if (app.status === "accepted") {
        cAccepted++
      }
    })

    return [
      { name: "Wishlist", count: cWishlist },
      { name: "Applied", count: cApplied },
      { name: "Viewed", count: cViewed },
      { name: "Interview", count: cInterview },
      { name: "Technical Test", count: cTechTest },
      { name: "Final Interview", count: cFinalInterview },
      { name: "Offer", count: cOffer },
      { name: "Accepted", count: cAccepted },
    ]
  }, [filteredApps])

  // 4. Compute Pending Applications Age Distribution
  const ageData = useMemo(() => {
    let bucket1 = 0 // 0-7 days
    let bucket2 = 0 // 8-14 days
    let bucket3 = 0 // 15-30 days
    let bucket4 = 0 // 30+ days

    const now = new Date()

    filteredApps.forEach((app) => {
      if (["wishlist", "rejected", "ghosted", "accepted"].includes(app.status)) {
        return
      }

      const date = app.appliedDate ? new Date(app.appliedDate) : new Date(app.createdAt)
      const diffTime = now.getTime() - date.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 7) {
        bucket1++
      } else if (diffDays <= 14) {
        bucket2++
      } else if (diffDays <= 30) {
        bucket3++
      } else {
        bucket4++
      }
    })

    return [
      { range: "0-7 days", count: bucket1 },
      { range: "8-14 days", count: bucket2 },
      { range: "15-30 days", count: bucket3 },
      { range: "30+ days", count: bucket4 },
    ]
  }, [filteredApps])

  // 5. Compute Location Breakdown
  const locationData = useMemo(() => {
    const counts = {
      KL: 0,
      Johor: 0,
      Remote: 0,
      Penang: 0,
      Overseas: 0,
      Other: 0,
    }

    let totalCount = 0

    filteredApps.forEach((app) => {
      totalCount++
      const locLower = (app.location ?? "").toLowerCase()
      const modeLower = (app.workMode ?? "").toLowerCase()

      if (modeLower === "remote" || locLower.includes("remote")) {
        counts.Remote++
      } else if (
        locLower.includes("kl") ||
        locLower.includes("kuala lumpur") ||
        locLower.includes("selangor") ||
        locLower.includes("klang") ||
        locLower.includes("pj") ||
        locLower.includes("petaling jaya")
      ) {
        counts.KL++
      } else if (
        locLower.includes("johor") ||
        locLower.includes("jb") ||
        locLower.includes("bahru")
      ) {
        counts.Johor++
      } else if (
        locLower.includes("penang") ||
        locLower.includes("george town") ||
        locLower.includes("pg")
      ) {
        counts.Penang++
      } else if (
        locLower.includes("singapore") ||
        locLower.includes("sg") ||
        locLower.includes("overseas") ||
        locLower.includes("us") ||
        locLower.includes("uk") ||
        locLower.includes("germany") ||
        locLower.includes("canada") ||
        locLower.includes("australia")
      ) {
        counts.Overseas++
      } else {
        counts.Other++
      }
    })

    const colors = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
      "hsl(var(--muted-foreground))",
    ]

    return Object.entries(counts)
      .map(([name, count], idx) => {
        const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0
        return {
          name,
          value: count,
          percentage,
          color: colors[idx % colors.length],
        }
      })
      .filter((d) => d.value > 0)
  }, [filteredApps])

  // 6. Compute Resume Version Performance
  const resumePerformance = useMemo(() => {
    const resumeMap: Record<
      string,
      { name: string; version: string; apps: number; interviews: number; offers: number }
    > = {}

    resumes.forEach((r) => {
      resumeMap[r.id.toString()] = {
        name: r.name,
        version: r.version ?? "1.0",
        apps: 0,
        interviews: 0,
        offers: 0,
      }
    })

    filteredApps.forEach((app) => {
      if (app.status === "wishlist") return
      const resId = app.resumeId?.toString() || "no_resume"
      if (!resumeMap[resId]) {
        resumeMap[resId] = {
          name: resId === "no_resume" ? "No Resume Assigned" : `Resume #${resId}`,
          version: "—",
          apps: 0,
          interviews: 0,
          offers: 0,
        }
      }
      resumeMap[resId].apps++
      if (
        [
          "interviewing",
          "interview",
          "technical_test",
          "final_interview",
          "offer",
          "accepted",
        ].includes(app.status)
      ) {
        resumeMap[resId].interviews++
      }
      if (["offer", "accepted"].includes(app.status)) {
        resumeMap[resId].offers++
      }
    })

    return Object.entries(resumeMap)
      .map(([id, data]) => {
        const conversionRate = data.apps > 0 ? (data.interviews / data.apps) * 100 : 0
        return {
          id,
          ...data,
          conversionRate,
        }
      })
      .filter((d) => d.apps > 0)
      .sort((a, b) => b.conversionRate - a.conversionRate)
  }, [filteredApps, resumes])

  // Computed Auto-Generated Insights
  const insights = useMemo(() => {
    const list: string[] = []

    // 1. Best Source
    const activeSources = chart2Data.filter((d) => d.Applications >= 1)
    if (activeSources.length > 0) {
      const sorted = [...activeSources].sort((a, b) => b.rate - a.rate)
      const best = sorted[0]
      const others = sorted.slice(1)
      const secondBest = others[0]

      if (best.rate > 0) {
        if (secondBest && secondBest.rate > 0) {
          list.push(
            `📊 Your best source is ${best.name} (${best.rate.toFixed(0)}% interview rate vs ${secondBest.rate.toFixed(0)}% on ${secondBest.name}).`
          )
        } else {
          list.push(
            `📊 Your best source is ${best.name} with a ${best.rate.toFixed(0)}% interview conversion rate.`
          )
        }
      } else {
        list.push(`📊 Source conversion rates are currently 0%. Send more applications!`)
      }
    } else {
      list.push(`📊 Best source conversion metrics require more application logs.`)
    }

    // 2. Applications Pace
    const appliedCount = filteredApps.filter((a) => a.status !== "wishlist").length
    let monthsCount = 1
    if (dateRange === "3_months") monthsCount = 3
    else if (dateRange === "6_months") monthsCount = 6
    else if (dateRange === "all") {
      const dates = filteredApps
        .map((a) => (a.appliedDate ? new Date(a.appliedDate) : new Date(a.createdAt)))
        .map((d) => d.getTime())
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates))
        const maxDate = new Date()
        const diffMonths =
          (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
          (maxDate.getMonth() - minDate.getMonth())
        monthsCount = Math.max(1, diffMonths)
      }
    }

    const avgPerMonth = (appliedCount / monthsCount).toFixed(0)
    list.push(
      `📊 You've applied to ${appliedCount} jobs in ${monthsCount} ${monthsCount === 1 ? "month" : "months"} — averaging ${avgPerMonth}/month.`
    )

    // 3. Average Time to Response
    let totalDiffDays = 0
    let responseCount = 0

    filteredApps.forEach((app) => {
      if (["wishlist", "applied"].includes(app.status)) return

      const startDate = app.appliedDate ? new Date(app.appliedDate) : new Date(app.createdAt)
      const endDate = new Date(app.updatedAt)
      const diffTime = endDate.getTime() - startDate.getTime()
      if (diffTime > 0) {
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        totalDiffDays += diffDays
        responseCount++
      }
    })

    if (responseCount > 0) {
      const avgResponse = (totalDiffDays / responseCount).toFixed(0)
      list.push(
        `📊 Your average time to first response is ${avgResponse} ${avgResponse === "1" ? "day" : "days"}.`
      )
    } else {
      list.push(`📊 Average response times will calculate as your pipeline advances.`)
    }

    // 4. Resume version performance
    const activeResumes = resumePerformance.filter((r) => r.apps >= 1)
    if (activeResumes.length > 1) {
      const sorted = [...activeResumes].sort((a, b) => b.conversionRate - a.conversionRate)
      const best = sorted[0]

      const otherRates = sorted.slice(1).map((r) => r.conversionRate)
      const avgOtherRate =
        otherRates.reduce((sum, r) => sum + r, 0) / otherRates.length

      if (best.conversionRate > 0 && avgOtherRate > 0) {
        const multiplier = (best.conversionRate / avgOtherRate).toFixed(1)
        list.push(
          `📊 ${best.name} (v${best.version}) outperforms your other resume versions by ${multiplier}×.`
        )
      } else if (best.conversionRate > 0) {
        list.push(
          `📊 ${best.name} (v${best.version}) is your top performing version with a ${best.conversionRate.toFixed(0)}% interview rate.`
        )
      } else {
        list.push(
          `📊 Resume performance rates are currently 0%. Log responses to view conversion benchmarks.`
        )
      }
    } else {
      list.push(`📊 Resume performance tracking requires additional application history.`)
    }

    return list
  }, [filteredApps, dateRange, chart2Data, resumePerformance])

  // Custom tooltips to keep styles extremely high-end
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-none border border-border bg-card p-3 shadow-none font-mono text-xs">
          <p className="font-bold mb-1.5 uppercase text-muted-foreground">{label}</p>
          <div className="flex flex-col gap-1">
            {payload.map((p: any) => (
              <div key={p.name} className="flex items-center justify-between gap-8">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-none"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.name}:
                </span>
                <span className="font-bold text-foreground">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  const SourceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-none border border-border bg-card p-3 shadow-none font-mono text-xs">
          <p className="font-bold mb-1.5 uppercase text-foreground">{data.name}</p>
          <p className="text-muted-foreground">
            {data.Applications} apps &rarr; {data.Interviews} interviews ({data.rate.toFixed(0)}% rate)
          </p>
          <p className="text-muted-foreground mt-1">
            Offers gotten: <span className="font-bold text-foreground">{data.Offers}</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
        [Loading Analytics Data...]
      </div>
    )
  }

  const maxFunnelCount = funnelSteps[0].count || 1

  return (
    <div className="flex flex-col gap-8">
      {/* Blueprint Header with Date Filter */}
      <div className="relative border-b border-border pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <span className="absolute top-0 right-0 font-mono text-[10px] text-muted-foreground tracking-widest select-none hidden sm:block">
          [SYS_ANALYTICS_V2]
        </span>
        <div>
          <h1 className="text-3xl font-heading font-black tracking-tight uppercase">
            Analytics
          </h1>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground/75 mt-1">
            Metrics // Performance // Funnel Conversion
          </p>
        </div>

        {/* Date Filter Widget */}
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={dateRange} onValueChange={(val: any) => setDateRange(val)}>
            <SelectTrigger className="w-[160px] h-8 bg-background/50 text-[11px] font-mono uppercase tracking-wider rounded-none border-border">
              <SelectValue placeholder="FILTER RANGE" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="30_days" className="rounded-none">LAST 30 DAYS</SelectItem>
              <SelectItem value="3_months" className="rounded-none">LAST 3 MONTHS</SelectItem>
              <SelectItem value="6_months" className="rounded-none">LAST 6 MONTHS</SelectItem>
              <SelectItem value="all" className="rounded-none">ALL TIME</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid of Main Charts (1 and 2, 4 and 5 as a 2x2 layout if large screen) */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-border bg-border gap-px rounded-none">
        {/* Chart 1: Applications Over Time */}
        <div className="relative bg-card p-6 rounded-none flex flex-col group overflow-hidden border-b border-r border-border">
          <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
          <div className="absolute top-2 left-2 font-mono text-[9px] text-muted-foreground/30 select-none">
            [01_TIME_SERIES]
          </div>
          <div className="absolute top-2 right-2 font-mono text-[9px] text-muted-foreground/30 select-none">
            [SEC_TIME]
          </div>

          <div className="flex items-center gap-2 mb-6 mt-1">
            <TrendingUp className="h-4 w-4 text-chart-2" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              Applications Over Time
            </h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chart1Data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="currentColor"
                  className="text-muted-foreground font-mono text-[10px]"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="currentColor"
                  className="text-muted-foreground font-mono text-[10px]"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--accent)" }} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="square"
                  iconSize={8}
                  wrapperStyle={{
                    fontFamily: "monospace",
                    fontSize: "11px",
                    textTransform: "uppercase",
                  }}
                />
                <Bar dataKey="Applied" fill="var(--chart-2)" radius={0} />
                <Bar dataKey="Interviews" fill="var(--chart-4)" radius={0} />
                <Bar dataKey="Offers" fill="var(--chart-3)" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Source Performance */}
        <div className="relative bg-card p-6 rounded-none flex flex-col group overflow-hidden border-b border-r border-border">
          <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
          <div className="absolute top-2 left-2 font-mono text-[9px] text-muted-foreground/30 select-none">
            [02_SOURCE_STATS]
          </div>
          <div className="absolute top-2 right-2 font-mono text-[9px] text-muted-foreground/30 select-none">
            [SEC_SRC]
          </div>

          <div className="flex items-center gap-2 mb-6 mt-1">
            <Compass className="h-4 w-4 text-chart-4" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              Source Performance
            </h3>
          </div>

          <div className="h-72 w-full">
            {chart2Data.length === 0 ? (
              <div className="h-full flex items-center justify-center font-mono text-xs uppercase tracking-wider text-muted-foreground/60">
                [No Source Data Recorded]
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chart2Data}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    stroke="currentColor"
                    className="text-muted-foreground font-mono text-[10px]"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="currentColor"
                    className="text-muted-foreground font-mono text-[10px]"
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip content={<SourceTooltip />} cursor={{ fill: "var(--accent)" }} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="square"
                    iconSize={8}
                    wrapperStyle={{
                      fontFamily: "monospace",
                      fontSize: "11px",
                      textTransform: "uppercase",
                    }}
                  />
                  <Bar dataKey="Applications" fill="var(--chart-2)" radius={0} />
                  <Bar dataKey="Interviews" fill="var(--chart-4)" radius={0} />
                  <Bar dataKey="Offers" fill="var(--chart-3)" radius={0} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: Pending Application Age Distribution */}
        <div className="relative bg-card p-6 rounded-none flex flex-col group overflow-hidden border-b border-r border-border">
          <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
          <div className="absolute top-2 left-2 font-mono text-[9px] text-muted-foreground/30 select-none">
            [04_STALE_TRACKING]
          </div>
          <div className="absolute top-2 right-2 font-mono text-[9px] text-muted-foreground/30 select-none">
            [SEC_AGE]
          </div>

          <div className="flex items-center gap-2 mb-6 mt-1">
            <Clock className="h-4 w-4 text-chart-2" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              Application Age Distribution
            </h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="range"
                  stroke="currentColor"
                  className="text-muted-foreground font-mono text-[10px]"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="currentColor"
                  className="text-muted-foreground font-mono text-[10px]"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-none border border-border bg-card p-3 shadow-none font-mono text-xs">
                          <p className="font-bold mb-1 uppercase text-muted-foreground">
                            {payload[0].payload.range}
                          </p>
                          <p className="text-foreground">
                            Pending Apps: <span className="font-bold">{payload[0].value}</span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                  cursor={{ fill: "var(--accent)" }}
                />
                <Bar dataKey="count" fill="var(--chart-2)" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Location Breakdown */}
        <div className="relative bg-card p-6 rounded-none flex flex-col group overflow-hidden border-b border-r border-border">
          <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
          <div className="absolute top-2 left-2 font-mono text-[9px] text-muted-foreground/30 select-none">
            [05_GEOGRAPHIC_SPREAD]
          </div>
          <div className="absolute top-2 right-2 font-mono text-[9px] text-muted-foreground/30 select-none">
            [SEC_LOC]
          </div>

          <div className="flex items-center gap-2 mb-6 mt-1">
            <MapPin className="h-4 w-4 text-chart-3" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              Location Breakdown
            </h3>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {locationData.length === 0 ? (
              <div className="font-mono text-xs uppercase text-muted-foreground/60">
                [No Location Logs Available]
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 h-full w-full">
                <div className="h-48 w-48 shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={locationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {locationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="rounded-none border border-border bg-card p-3 shadow-none font-mono text-xs">
                                <p className="font-bold mb-1 uppercase text-foreground">{data.name}</p>
                                <p className="text-muted-foreground">
                                  Count: <span className="font-bold text-foreground">{data.value}</span>
                                </p>
                                <p className="text-muted-foreground">
                                  Share: <span className="font-bold text-foreground">{data.percentage.toFixed(0)}%</span>
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex-1 w-full flex flex-col gap-2 font-mono text-xs max-h-[200px] overflow-y-auto pr-1">
                  {locationData.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between border-b border-border/40 pb-1.5"
                    >
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span
                          className="h-2 w-2 rounded-none"
                          style={{ backgroundColor: entry.color }}
                        />
                        {entry.name}
                      </span>
                      <span className="text-foreground font-bold">
                        {entry.value} ({entry.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart 6: Resume Version Performance */}
      <div className="relative border border-border bg-card p-6 rounded-none overflow-hidden flex flex-col group">
        <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
        <div className="absolute top-2 left-2 font-mono text-[9px] text-muted-foreground/30 select-none">
          [06_ASSET_METRICS]
        </div>
        <div className="absolute top-2 right-2 font-mono text-[9px] text-muted-foreground/30 select-none">
          [SEC_RESUME]
        </div>

        <div className="flex items-center gap-2 mb-6 mt-1">
          <FileText className="h-4 w-4 text-chart-4" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            Resume Version Performance
          </h3>
        </div>

        {resumePerformance.length === 0 ? (
          <div className="py-12 flex items-center justify-center font-mono text-xs uppercase tracking-wider text-muted-foreground/60">
            [No Active Resume Metrics Available]
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px]">
                  <th className="py-2.5 font-bold">Resume File // Version</th>
                  <th className="py-2.5 text-right font-bold">Applications</th>
                  <th className="py-2.5 text-right font-bold">Interviews</th>
                  <th className="py-2.5 text-right font-bold">Conv. Rate</th>
                  <th className="py-2.5 pl-6 font-bold">Visual Benchmark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {resumePerformance.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/15 transition-colors">
                    <td className="py-3 font-semibold text-foreground">
                      {row.name}{" "}
                      <span className="text-[10px] text-muted-foreground/55 bg-accent/40 px-1 rounded-none ml-1 font-mono uppercase border border-border/50">
                        V{row.version}
                      </span>
                    </td>
                    <td className="py-3 text-right text-muted-foreground font-mono">{row.apps}</td>
                    <td className="py-3 text-right text-muted-foreground font-mono">{row.interviews}</td>
                    <td className="py-3 text-right font-extrabold text-foreground font-mono">
                      {row.conversionRate.toFixed(0)}%
                    </td>
                    <td className="py-3 pl-6">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 bg-accent/30 rounded-none overflow-hidden border border-border/20 relative">
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-chart-3 transition-all duration-300"
                            style={{ width: `${row.conversionRate}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground/65 font-mono">
                          ({row.interviews}/{row.apps})
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chart 3: Pipeline Funnel */}
      <div className="relative border border-border bg-card p-6 rounded-none overflow-hidden flex flex-col group">
        <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
        <div className="absolute top-2 left-2 font-mono text-[9px] text-muted-foreground/30 select-none">
          [03_FUNNEL_CONVERSION]
        </div>
        <div className="absolute top-2 right-2 font-mono text-[9px] text-muted-foreground/30 select-none">
          [SEC_CONV]
        </div>

        <div className="flex items-center gap-2 mb-8 mt-1">
          <Sliders className="h-4 w-4 text-chart-3" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            Pipeline Funnel
          </h3>
        </div>

        {maxFunnelCount === 0 ? (
          <div className="py-20 flex items-center justify-center font-mono text-xs uppercase tracking-wider text-muted-foreground/60">
            [No Applications in Pipeline]
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
            {funnelSteps.map((step, idx) => {
              const prevCount = idx > 0 ? funnelSteps[idx - 1].count : 0
              const dropOff =
                idx > 0 && prevCount > 0
                  ? ((prevCount - step.count) / prevCount) * 100
                  : 0
              const pctOfStart =
                maxFunnelCount > 0 ? (step.count / maxFunnelCount) * 100 : 0

              return (
                <div key={step.name} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  {/* Step Label */}
                  <div className="w-36 shrink-0 font-mono text-xs uppercase font-semibold text-foreground flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground/55">[0{idx + 1}]</span>
                    {step.name}
                  </div>

                  {/* Progress Bar Area */}
                  <div className="flex-1 relative bg-accent/40 rounded-none h-6 border border-border/30 overflow-hidden flex items-center px-2">
                    {/* Visual Bar fill */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-500"
                      style={{ width: `${pctOfStart}%` }}
                    />

                    <span className="relative font-mono text-xs font-bold text-foreground">
                      {step.count}
                    </span>
                  </div>

                  {/* Percentage of start */}
                  <div className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground select-none">
                    {pctOfStart.toFixed(0)}%
                  </div>

                  {/* Drop-off from previous step */}
                  <div className="w-24 shrink-0 text-right font-mono text-xs">
                    {idx === 0 ? (
                      <span className="text-muted-foreground/50">—</span>
                    ) : dropOff > 0 ? (
                      <span className="text-destructive font-semibold">
                        &darr; {dropOff.toFixed(0)}% drop
                      </span>
                    ) : (
                      <span className="text-success-green font-semibold">0% drop</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Summary Insights Section */}
      <div className="relative border border-border bg-card p-6 rounded-none overflow-hidden flex flex-col group">
        <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
        <div className="absolute top-2 left-2 font-mono text-[9px] text-muted-foreground/30 select-none">
          [07_SUMMARY_INSIGHTS]
        </div>
        <div className="absolute top-2 right-2 font-mono text-[9px] text-muted-foreground/30 select-none">
          [SEC_INSIGHTS]
        </div>

        <div className="flex items-center gap-2 mb-4 mt-1 border-b border-border/40 pb-3">
          <FileCode className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            Computed Pipeline Insights
          </h3>
        </div>

        <div className="flex flex-col gap-2.5">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-none bg-accent/20 border border-border/30"
            >
              {insight}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
