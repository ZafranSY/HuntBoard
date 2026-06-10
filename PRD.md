# Product Requirements Document
# Job Hunt Dashboard — "HuntBoard"
**Version:** 1.0  
**Author:** Jaf  
**Date:** 2026-06-10  
**Status:** Ready for Development

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Tech Stack & Architecture](#3-tech-stack--architecture)
4. [Database Schema](#4-database-schema)
5. [Authentication & Namespace System](#5-authentication--namespace-system)
6. [Feature Specifications](#6-feature-specifications)
   - 6.1 Core Dashboard
   - 6.2 Application Management
   - 6.3 Kanban Pipeline Board
   - 6.4 Wishlist
   - 6.5 Follow-Up System
   - 6.6 Resume & Cover Letter Tracking
   - 6.7 Analytics
   - 6.8 Multi-User / Namespace System
   - 6.9 Settings & Utility
7. [UI/UX Specifications](#7-uiux-specifications)
8. [Page & Route Structure](#8-page--route-structure)
9. [API Routes](#9-api-routes)
10. [Component Structure](#10-component-structure)
11. [Data Models (TypeScript)](#11-data-models-typescript)
12. [Environment & Deployment](#12-environment--deployment)
13. [Implementation Order](#13-implementation-order)
14. [Acceptance Criteria](#14-acceptance-criteria)

---

## 1. Product Overview

HuntBoard is a personal job application tracking dashboard built with Next.js 14, deployed entirely on Vercel. It is designed for a small group of job seekers (the builder + friends) who want to track their applications, coordinate on shared wishlists, and see analytics on their hunt — without using external services like Firebase or Supabase.

Each user gets their own **namespace** (e.g. `jaf`, `alvis`) that stores their data in isolation. No email/password login — access is by namespace name + optional PIN. The app is fast, opinionated, and built for daily use during an active job hunt.

**Target users:** Final-year CS students in Malaysia actively applying to tech jobs.

**Core value:** Replace the Google Sheets everyone uses for job tracking with something that actually helps — pipeline visibility, follow-up reminders, source analytics, and resume version tracking.

---

## 2. Goals & Non-Goals

### Goals
- Full application lifecycle tracking from wishlist to offer
- Kanban pipeline board with drag and drop
- Per-namespace isolation (multi-user without full auth)
- Analytics that tell you where to focus your energy
- Follow-up reminders that surface proactively
- Resume version performance tracking
- Shared wishlist across all namespaces
- Zero external DB hosting — Vercel Postgres only
- Mobile responsive, works on phone

### Non-Goals
- Not a public product. Not SaaS. Private, invite-only via namespace name.
- No email notifications (no third-party email service)
- No job scraping or auto-apply
- No AI features
- No real-time collaboration (no websockets)
- No file uploads (resume files stored by name/version string only, not actual files)

---

## 3. Tech Stack & Architecture

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Drag & Drop:** `@hello-pangea/dnd` (maintained fork of react-beautiful-dnd)
- **Charts:** Recharts
- **Date handling:** date-fns
- **Form handling:** React Hook Form + Zod

### Backend
- **API:** Next.js Route Handlers (App Router `/app/api/`)
- **ORM:** Drizzle ORM (lightweight, edge-compatible, works perfectly with Vercel Postgres)
- **Database:** Vercel Postgres (free tier, 256MB, ~100k rows, plenty for job tracking)
- **Session:** Cookies via `iron-session` (no JWT complexity, no NextAuth needed)

### Infrastructure
- **Hosting:** Vercel (free hobby tier)
- **Database:** Vercel Postgres (attached to Vercel project)
- **No Redis, no KV, no external services**

### Why Drizzle over Prisma
Drizzle is edge-compatible, has zero overhead, migrations are simpler for a solo project, and it works natively with Vercel Postgres's `@vercel/postgres` driver. Prisma adds too much boilerplate for this project size.

### Why Vercel Postgres over Neon/Supabase
Vercel Postgres is provisioned directly in the Vercel dashboard. One dashboard, one billing, zero external accounts. It is Neon under the hood anyway.

---

## 4. Database Schema

### SQL (Drizzle schema file: `src/db/schema.ts`)

```typescript
import { pgTable, text, timestamp, integer, boolean, uuid, pgEnum } from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const applicationStatusEnum = pgEnum('application_status', [
  'wishlist',
  'applied',
  'viewed',
  'interview',
  'technical_test',
  'final_interview',
  'offer',
  'accepted',
  'rejected',
  'ghosted',
  'withdrawn'
]);

export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);

export const sourceEnum = pgEnum('source', [
  'jobstreet',
  'linkedin',
  'indeed',
  'company_website',
  'referral',
  'cold_email',
  'recruitment_agency',
  'other'
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

// Namespaces (users)
export const namespaces = pgTable('namespaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),          // e.g. "jaf", "alvis"
  displayName: text('display_name').notNull(),    // e.g. "Jaf", "Alvis"
  pinHash: text('pin_hash'),                      // bcrypt hash of 4-digit PIN, nullable = no PIN
  color: text('color').notNull().default('#6366f1'), // accent color for namespace tag
  isPublic: boolean('is_public').notNull().default(false), // allow read-only view by others
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Applications
export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  namespaceId: uuid('namespace_id').notNull().references(() => namespaces.id, { onDelete: 'cascade' }),

  // Core fields
  company: text('company').notNull(),
  role: text('role').notNull(),
  location: text('location'),
  salaryMin: integer('salary_min'),               // in RM
  salaryMax: integer('salary_max'),               // in RM
  salaryCurrency: text('salary_currency').notNull().default('MYR'),
  status: applicationStatusEnum('status').notNull().default('applied'),
  source: sourceEnum('source'),
  appliedDate: timestamp('applied_date'),
  
  // Contact
  contactPerson: text('contact_person'),
  contactEmail: text('contact_email'),
  jobUrl: text('job_url'),
  
  // Tracking
  resumeVersion: text('resume_version'),
  coverLetterVersion: text('cover_letter_version'),
  
  // Notes
  notes: text('notes'),
  jobDescription: text('job_description'),
  nextAction: text('next_action'),
  followUpDate: timestamp('follow_up_date'),
  
  // Pipeline
  kanbanOrder: integer('kanban_order').notNull().default(0), // ordering within status column
  
  // Meta
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Status history (for timeline/activity log)
export const statusHistory = pgTable('status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  fromStatus: applicationStatusEnum('from_status'),
  toStatus: applicationStatusEnum('to_status').notNull(),
  note: text('note'),
  changedAt: timestamp('changed_at').notNull().defaultNow(),
});

// Wishlist (shared across all namespaces)
export const wishlist = pgTable('wishlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  addedByNamespaceId: uuid('added_by_namespace_id').notNull().references(() => namespaces.id),

  company: text('company').notNull(),
  role: text('role'),
  location: text('location'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  jobUrl: text('job_url'),
  notes: text('notes'),
  priority: priorityEnum('priority').notNull().default('medium'),
  
  // Track if someone has already moved this to applied
  claimedByNamespaceIds: text('claimed_by_namespace_ids').array().notNull().default([]),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Resume versions registry
export const resumeVersions = pgTable('resume_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  namespaceId: uuid('namespace_id').notNull().references(() => namespaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),                  // e.g. "resume-v5", "resume-faang"
  notes: text('notes'),                           // e.g. "Used for startup roles"
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Cover letter versions registry
export const coverLetterVersions = pgTable('cover_letter_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  namespaceId: uuid('namespace_id').notNull().references(() => namespaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

---

## 5. Authentication & Namespace System

### Concept
No email. No password. Just a **namespace slug** (e.g. `jaf`) and an optional 4-digit PIN.

### How it works

1. User lands on `/` — sees a namespace picker.
2. If namespaces exist already, they see a list: `[Jaf] [Alvis] [+ Create New]`
3. User clicks their name → if that namespace has a PIN, a PIN input appears → enter PIN → session cookie is set → redirect to `/dashboard`
4. If no PIN, clicking the name sets the session directly.
5. Session stores `namespaceId` + `namespaceSlug` in an encrypted `iron-session` cookie.
6. All API routes read from session to scope queries to the correct namespace.

### Session structure
```typescript
interface SessionData {
  namespaceId: string;
  namespaceSlug: string;
  isLoggedIn: boolean;
}
```

### PIN handling
- PIN is a 4-digit number string (e.g. `"1234"`)
- Stored as bcrypt hash in DB (`bcryptjs`, 10 rounds)
- PIN is optional — namespaces without a PIN are open
- No PIN recovery — if forgotten, an admin (you) deletes and recreates the namespace via a local script

### Cross-namespace viewing
- If `isPublic: true` on a namespace, any logged-in user can visit `/[slug]` to see that namespace in read-only mode
- No editing, no adding applications — just viewing stats and pipeline
- Default: `isPublic: false`

### Namespace creation
- Anyone can create a new namespace from the home screen
- Just pick a slug (letters/numbers/hyphens only) and display name
- Optionally set a PIN during creation
- No approval needed — it's a private app between friends

---

## 6. Feature Specifications

---

### 6.1 Core Dashboard

**Route:** `/dashboard` or `/[slug]/dashboard`

#### Stats Cards Row
Eight cards displayed in a 4+4 grid (desktop) or 2-column grid (mobile):

| Card | Formula |
|------|---------|
| Total Applications | COUNT where status != wishlist AND isArchived = false |
| Interviews | COUNT where status IN (interview, technical_test, final_interview) |
| Offers | COUNT where status IN (offer, accepted) |
| Rejections | COUNT where status = rejected |
| Ghosted | COUNT where status = ghosted |
| Pending | COUNT where status IN (applied, viewed) |
| Interview Rate | (Interviews / Total Applications) × 100 |
| Offer Rate | (Offers / Total Applications) × 100 |

Each card shows: metric label, big number, and a small percentage change vs last 30 days (e.g. `+3 this month`).

#### Today's Summary Bar
A horizontal strip below stats cards:
- Follow-ups due today (count + link to follow-up view)
- Interviews this week (count)
- Applications this week (count)
- Days since last application (if > 3 days, show in orange)

#### Goal Tracker
- User sets a weekly application goal (e.g. 10 apps/week)
- Progress bar: `7 / 10 this week`
- Stored in namespace settings
- Resets every Monday

#### Recent Activity Feed
Last 10 status changes across all applications, newest first:
```
Mattel → Interview  ·  2 hours ago
Google → Rejected   ·  Yesterday
Grab → Applied      ·  2 days ago
```

#### Follow-Up Alert Banner
If there are overdue follow-ups (followUpDate < today), show a sticky amber banner at top:
```
⚠️  3 follow-ups are overdue. View them →
```

---

### 6.2 Application Management

**Route:** `/applications`

#### Application List (Table View)
Sortable, filterable table. Columns:

| Column | Sortable | Filterable |
|--------|----------|------------|
| Company | ✅ | ✅ (text search) |
| Role | ✅ | ✅ (text search) |
| Status | ✅ | ✅ (multi-select) |
| Location | ✅ | ✅ |
| Applied Date | ✅ | Date range |
| Source | — | ✅ (multi-select) |
| Follow-Up Date | ✅ | — |
| Age (days) | ✅ | — |

**Color coding for status badges:**
- wishlist: gray
- applied: blue
- viewed: purple
- interview: yellow
- technical_test: orange
- final_interview: orange (darker)
- offer: green
- accepted: green (darker)
- rejected: red
- ghosted: gray (faded)
- withdrawn: gray

#### Toggle: Table View ↔ Kanban View
Persistent preference saved to localStorage. Both views show the same data.

#### Quick Add Form
Floating `+ Add Application` button (bottom right, FAB style).
Opens a slide-over panel with minimal required fields:
- Company (required)
- Role (required)
- Status (default: applied)
- Applied Date (default: today)

All other fields optional. Can fill full details later by clicking into the record.

#### Full Application Detail
Click any row → opens a slide-over or full-page detail view.

**All fields:**
```
Company *
Role *
Location
Salary Range (min - max, currency)
Status *
Applied Date
Source (dropdown: Jobstreet, LinkedIn, Indeed, etc.)
Job URL
Contact Person
Contact Email
Resume Version (dropdown from resume versions registry)
Cover Letter Version (dropdown from cover letter versions registry)
Job Description (long text)
Notes (long text, personal notes)
Next Action (short text: "Follow up next week")
Follow-Up Date (date picker)
```

**Activity Timeline** (bottom of detail view):
Shows all status changes for this application in chronological order:
```
Jun 10 → Applied
Jun 14 → Viewed
Jun 17 → Interview (added note: "HR screening call 3pm")
```

#### Duplicate Warning
When adding a new application, check if `(company + role)` already exists in the namespace. If yes, show inline warning:
```
⚠️ You already have an application for "Software Engineer" at "Mattel". Add anyway?
```

#### Archive
- Rejected and ghosted applications clutter the pipeline.
- Archive button on each application.
- Archived applications excluded from all stats and pipeline by default.
- `/applications?archived=true` shows archived applications only.
- Unarchive any time.

#### Bulk Actions
Select multiple rows via checkbox → bulk actions dropdown:
- Change status (moves all selected to chosen status)
- Archive selected
- Delete selected (hard delete, requires confirmation)

---

### 6.3 Kanban Pipeline Board

**Route:** `/pipeline`

#### Layout
Full-width horizontal scrollable board. Each column = one status.

**Columns (left to right):**
1. Wishlist
2. Applied
3. Viewed
4. Interview
5. Technical Test
6. Final Interview
7. Offer
8. Accepted

Rejected and Ghosted not shown by default (they'd clutter the board). Toggle to show them via a "Show Closed" checkbox.

#### Cards
Each card shows:
- Company name (bold)
- Role (subtitle)
- Days since applied (e.g. `Day 14`)
- Status badge
- Follow-up indicator (📅 if follow-up date set)
- Color dot for source (Jobstreet = orange, LinkedIn = blue, etc.)

Click a card → opens the full application detail slide-over (same as table view).

#### Drag & Drop
- Drag card from one column to another → updates `status` in DB via PATCH request
- Drag within a column → updates `kanbanOrder`
- Drag is handled by `@hello-pangea/dnd`
- Optimistic update: card moves immediately, API call happens in background. If API fails, card snaps back.

#### Column Headers
Each column header shows:
- Column name
- Count of cards in that column
- Subtle color accent per column (e.g. Interview column header = yellow)

#### Empty State
Empty columns show:
```
No applications here yet.
Drag a card here or add one →
```

---

### 6.4 Wishlist

**Route:** `/wishlist`

Two sections on this page:

#### Section A: Your Private Wishlist
Applications you personally want to apply to but haven't yet. These ARE your `status = 'wishlist'` application records — not a separate table. They appear in your Kanban as the first column.

You can add them directly from the wishlist page with full detail form.

**One-click "Move to Applied":** Changes status from `wishlist` → `applied`, sets `appliedDate` to today, and prompts you to confirm the application details.

#### Section B: Shared Group Wishlist
A communal list from the `wishlist` table. Every namespace can see and contribute to this.

**Shared wishlist card shows:**
- Company name
- Role (optional)
- Location (optional)
- Priority badge (Low / Medium / High)
- Job URL (if added)
- Notes
- Added by: `[Jaf]` tag
- Claimed by: `[Alvis ✓]` `[Jaf ✓]` (shows who has already applied from this list)

**Actions per card:**
- "I applied for this" → marks you as having claimed this entry. Creates an application in your namespace automatically with the shared wishlist data pre-filled.
- "Add to my wishlist" → copies to your private wishlist without marking as applied.
- Edit (only original author can edit)
- Delete (only original author can delete)

**Adding to shared wishlist:**
- `+ Add to Group Wishlist` button → form: company, role, location, job URL, notes, priority.
- Anyone can add. Anyone can see. Only author can edit/delete.

**Filtering shared wishlist:**
- Filter by: Priority, Location, Added By (namespace), Claimed/Unclaimed
- Sort by: Date added, Priority, Company name

---

### 6.5 Follow-Up System

**Route:** `/follow-ups`

#### Follow-Up Dashboard
Three sections:

**Overdue** (red header)
Applications where `followUpDate < today` and status is not closed (rejected/accepted/ghosted/withdrawn).
Shows: Company, Role, Status, Follow-up date, Days overdue.

**Due Today** (amber header)
Applications where `followUpDate = today`.

**Upcoming — This Week** (green header)
Applications where `followUpDate` is within next 7 days.

Each entry has:
- Company + Role
- Current status
- Snooze button: push follow-up date by 3 days (one click)
- Mark Done: clears the follow-up date
- View Application: opens detail slide-over

#### Auto-Surface Logic
Even without a manually set follow-up date, surface applications automatically if:
- Status is `applied` or `viewed`
- `appliedDate` was more than 7 days ago
- No status change in 7 days
These appear in a separate "No Response — Might Want to Follow Up" section at the bottom, styled differently (not red, more neutral).

---

### 6.6 Resume & Cover Letter Tracking

**Route:** `/resume-tracker`

#### Resume Versions List
Table showing all registered resume versions for the namespace:

| Version Name | Notes | Apps Sent | Interviews | Conversion Rate |
|---|---|---|---|---|
| resume-v1 | First version, generic | 30 | 0 | 0% |
| resume-v2 | Emphasized FYP | 20 | 5 | 25% |
| resume-faang | Quantified everything | 10 | 4 | 40% |

**Conversion Rate** = (Interviews / Apps Sent) × 100

Clicking a version → shows all applications that used that version.

#### Add / Edit Resume Version
- Name (required, e.g. `resume-v5`)
- Notes (e.g. `Used for startup roles, emphasizes side projects`)
- Click Add → appears in dropdown when creating/editing applications

#### Cover Letter Versions
Same layout as resume versions. Separate table. Shows:

| Version Name | Notes | Apps Sent | Interviews | Rate |
|---|---|---|---|---|
| cover-generic | Used broadly | 15 | 2 | 13% |
| cover-tech | Tailored for tech | 8 | 3 | 37.5% |

#### Key Insight Banner
If one resume version has significantly higher conversion than others, show a callout:
```
💡 resume-v3 has a 40% interview rate vs your average of 12%. 
   Consider using it more.
```
Logic: if any version has > 2× average conversion rate and ≥ 5 applications, show this banner.

---

### 6.7 Analytics

**Route:** `/analytics`

All charts use Recharts. All data is scoped to the current namespace.

#### Chart 1: Applications Over Time (Bar Chart)
- X-axis: Month (last 6 months)
- Y-axis: Number of applications
- Bars grouped by: Applied, Interviews, Offers
- Tooltip: `June 2026: 28 applied, 4 interviews, 1 offer`

#### Chart 2: Source Performance (Horizontal Bar Chart)
- Each row = one source (Jobstreet, LinkedIn, etc.)
- Three sub-bars: Applications sent, Interviews gotten, Offers gotten
- Sorted by interview conversion rate descending
- Tooltip: `LinkedIn: 20 apps → 6 interviews (30% rate)`

#### Chart 3: Pipeline Funnel (Funnel Chart)
- Wishlist → Applied → Viewed → Interview → Technical Test → Final Interview → Offer → Accepted
- Each stage shows count and drop-off percentage from previous stage
- Helps identify where you're losing momentum (e.g. "60% of interviews don't lead to technical tests")

#### Chart 4: Application Age Distribution (Bar Chart)
- Buckets: 0-7 days, 8-14 days, 15-30 days, 30+ days
- Shows how old your pending applications are
- Helps identify stale applications that need follow-up

#### Chart 5: Location Breakdown (Pie/Donut Chart)
- Slices: KL, Johor, Remote, Penang, Overseas, Other
- % and count per location

#### Chart 6: Resume Version Performance (Table + Sparkline)
- Same data as resume tracker but visualized as a bar chart
- Resume versions sorted by interview conversion rate

#### Summary Insights Section (text, bottom of page)
Auto-generated text insights based on data:
```
📊 Your best source is LinkedIn (30% interview rate vs 8% on Jobstreet).
📊 You've applied to 128 jobs in 3 months — averaging 43/month.
📊 Your average time to first response is 8 days.
📊 resume-v3 outperforms your other resume versions by 3×.
```
These are computed, not AI-generated. Simple conditional logic.

#### Date Range Filter
At top of analytics page: Last 30 days / Last 3 months / Last 6 months / All time.
All charts respond to this filter.

---

### 6.8 Multi-User / Namespace System

#### Namespace Switcher
- Top-left of nav bar: current namespace name + color dot
- Click → dropdown shows all namespaces + "Create new"
- Switching namespaces requires re-authentication if target namespace has a PIN

#### Viewing Other Namespaces (Read-Only)
- If `isPublic: true` on a namespace, any logged-in user can visit `/view/[slug]`
- Shows: stats cards, pipeline (read-only, no drag), recent activity
- No editing. No adding. A banner says `Viewing [Alvis]'s board — read only`

#### Leaderboard (Optional — can be toggled off)
- Route: `/leaderboard`
- Shows all public namespaces side by side:

| Name | Total Apps | Interviews | Offers | Interview Rate |
|---|---|---|---|---|
| Jaf | 128 | 14 | 2 | 10.9% |
| Alvis | 75 | 9 | 1 | 12% |
| Tivenesh | 42 | 5 | 0 | 11.9% |

- Namespaces with `isPublic: false` show as `[Private]` with no stats
- Toggle visibility from namespace settings

#### Shared Wishlist
Covered in 6.4. The `wishlist` table is unscoped — every namespace reads from and writes to it.

#### Namespace Stats Comparison
On the leaderboard page, you can select 2 namespaces (both must be public) and view side-by-side:
- Stats cards comparison
- Source performance comparison
- Applications per month on same chart

---

### 6.9 Settings & Utility

**Route:** `/settings`

#### Namespace Settings
- Change display name
- Change/set/remove PIN
- Toggle `isPublic`
- Set accent color (for namespace tag in shared lists)
- Set weekly application goal (number)
- Delete namespace (hard delete, requires PIN + confirmation text "DELETE [slug]")

#### Export Data
- Button: `Export to CSV`
- Exports ALL applications for the current namespace as a CSV
- Columns: all application fields
- Filename: `huntboard-[slug]-[date].csv`

#### Import from CSV
- Button: `Import from CSV`
- Upload a CSV → map columns to application fields via a column mapper UI
- Preview first 5 rows before importing
- Duplicate detection: warn if `(company + role)` already exists

#### Custom Status Labels (Advanced)
- Rename pipeline stages (e.g. rename "Technical Test" to "Online Assessment")
- Stored as namespace-level config in a JSON column on the namespace row
- Renames propagate everywhere (kanban headers, status badges, filters)

#### Custom Source Labels
- Add custom sources beyond the defaults (e.g. "Company Career Fair", "UTM Portal")
- Stored as namespace-level config

#### Danger Zone
- Clear all applications (keeps namespace, deletes all application records)
- Delete namespace

---

## 7. UI/UX Specifications

### Design Direction
- **Dark mode first.** Background: `#0f0f0f` (near-black, not pure black). Cards: `#1a1a1a`. Borders: `#2a2a2a`.
- **Light mode** also supported, toggle in settings. Light bg: `#f8f9fa`.
- **Accent color:** Indigo (`#6366f1`) as global default. Each namespace has its own accent color for their tag/badge.
- **Typography:** `Inter` (body/UI), `JetBrains Mono` (version names, IDs, numbers/stats)
- **Spacing:** Generous padding. Cards have `p-4` minimum. Dashboard feels airy, not cramped.
- **Status badges:** Pill-shaped, colored per status (see 6.2 for color mapping)
- **No gradients on functional elements.** Gradients only acceptable on the home/landing namespace picker page.

### Nav Structure
```
[HuntBoard]    Dashboard  Pipeline  Wishlist  Follow-Ups  Analytics  Resume
                                                                      [Jaf ▾]  [⚙]
```
- Sidebar on desktop (collapsible, icon-only mode)
- Bottom tab bar on mobile (5 most important routes: Dashboard, Pipeline, Applications, Wishlist, More)

### Empty States
Every page needs a designed empty state. Not just "No data". Examples:
- Applications list empty: `No applications yet. Start tracking your first one. [+ Add Application]`
- Follow-ups empty: `Nothing to follow up on. You're on top of it. 🎯`
- Kanban empty: columns show placeholder cards with dashed border

### Loading States
- Stats cards: skeleton loaders (not spinners)
- Kanban: skeleton cards in each column
- Charts: skeleton bars/shapes

### Error States
- API errors: toast notification (bottom right), brief, actionable
- Form errors: inline under the field, specific (not "Something went wrong")

### Toasts
Use `sonner` (shadcn/ui's recommended toast library).
- Success: `Application added.` or `Status updated to Interview.`
- Error: `Failed to save. Try again.`
- Info: `Duplicate detected — see warning above.`

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px – 1024px
- Desktop: > 1024px

On mobile:
- Kanban board: horizontal scroll
- Stats cards: 2 columns
- Table view: simplified (fewer columns visible, tap to expand)
- FAB stays fixed bottom-right for quick add

---

## 8. Page & Route Structure

```
app/
├── (auth)/
│   └── page.tsx                    # / — Namespace picker / home
│
├── (app)/
│   ├── layout.tsx                  # App shell with nav, session check
│   ├── dashboard/
│   │   └── page.tsx                # /dashboard
│   ├── applications/
│   │   ├── page.tsx                # /applications (table view)
│   │   └── [id]/
│   │       └── page.tsx            # /applications/[id] (detail — optional, may use slide-over instead)
│   ├── pipeline/
│   │   └── page.tsx                # /pipeline (kanban)
│   ├── wishlist/
│   │   └── page.tsx                # /wishlist
│   ├── follow-ups/
│   │   └── page.tsx                # /follow-ups
│   ├── resume-tracker/
│   │   └── page.tsx                # /resume-tracker
│   ├── analytics/
│   │   └── page.tsx                # /analytics
│   ├── leaderboard/
│   │   └── page.tsx                # /leaderboard
│   ├── settings/
│   │   └── page.tsx                # /settings
│   └── view/
│       └── [slug]/
│           └── page.tsx            # /view/[slug] — read-only namespace view
│
└── api/
    ├── auth/
    │   ├── login/route.ts          # POST — set session
    │   └── logout/route.ts         # POST — clear session
    ├── namespaces/
    │   ├── route.ts                # GET (list all), POST (create)
    │   └── [id]/route.ts           # GET, PATCH, DELETE
    ├── applications/
    │   ├── route.ts                # GET (list, paginated, filtered), POST (create)
    │   └── [id]/
    │       ├── route.ts            # GET, PATCH, DELETE
    │       └── status/route.ts     # PATCH — status change + writes history
    ├── wishlist/
    │   ├── route.ts                # GET (shared list), POST (add)
    │   └── [id]/
    │       ├── route.ts            # PATCH, DELETE
    │       └── claim/route.ts      # POST — mark as claimed by current namespace
    ├── resume-versions/
    │   ├── route.ts                # GET, POST
    │   └── [id]/route.ts           # PATCH, DELETE
    ├── cover-letter-versions/
    │   ├── route.ts                # GET, POST
    │   └── [id]/route.ts           # PATCH, DELETE
    ├── analytics/
    │   └── route.ts                # GET — returns all analytics data as one payload
    └── export/
        └── route.ts                # GET — returns CSV as blob
```

---

## 9. API Routes

All routes return JSON. Auth middleware checks `iron-session` cookie. If no session, return `401`.

### Auth

**POST /api/auth/login**
```typescript
// Request
{ slug: string; pin?: string; }

// Response 200
{ success: true; namespace: { id, slug, displayName, color } }

// Response 401
{ error: "Invalid PIN" }

// Response 404
{ error: "Namespace not found" }
```

**POST /api/auth/logout**
```typescript
// Response 200
{ success: true }
```

---

### Applications

**GET /api/applications**
Query params: `status`, `source`, `isArchived`, `search`, `page`, `limit`, `sortBy`, `sortDir`
```typescript
// Response 200
{
  data: Application[];
  total: number;
  page: number;
  limit: number;
}
```

**POST /api/applications**
```typescript
// Request body: Omit<Application, 'id' | 'namespaceId' | 'createdAt' | 'updatedAt'>
// Response 201
{ data: Application }
```

**PATCH /api/applications/[id]**
```typescript
// Request: partial Application fields
// Response 200
{ data: Application }
```

**PATCH /api/applications/[id]/status**
```typescript
// Request
{ status: ApplicationStatus; note?: string; }

// Response 200
{ data: Application; historyEntry: StatusHistory }
```
This route does two things: updates the application status AND writes a row to `status_history`.

**DELETE /api/applications/[id]**
```typescript
// Response 200
{ success: true }
```

---

### Analytics

**GET /api/analytics**
Query params: `from` (ISO date), `to` (ISO date)

Returns a single payload with all charts data (avoids waterfall requests):
```typescript
{
  applicationsByMonth: { month: string; applied: number; interviews: number; offers: number }[];
  sourcePerformance: { source: string; applications: number; interviews: number; offers: number }[];
  statusFunnel: { status: string; count: number }[];
  ageDistribution: { bucket: string; count: number }[];
  locationBreakdown: { location: string; count: number }[];
  resumePerformance: { version: string; applications: number; interviews: number; rate: number }[];
  insights: string[]; // pre-computed text insights
}
```

---

### Wishlist

**GET /api/wishlist**
Returns shared wishlist (all namespaces combined). No auth filter — shared data.
Query: `priority`, `addedBy` (namespace slug), `claimed` (boolean), `search`

**POST /api/wishlist**
Adds to shared wishlist. `addedByNamespaceId` taken from session.

**POST /api/wishlist/[id]/claim**
Marks current namespace as having claimed this entry. Creates an application in current namespace with pre-filled data from wishlist entry. Returns the new application.

---

### Export

**GET /api/export**
Returns CSV file. Headers: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="..."`.
All fields for the namespace's applications.

---

## 10. Component Structure

```
src/
├── components/
│   ├── ui/                          # shadcn/ui components (auto-generated)
│   ├── layout/
│   │   ├── AppShell.tsx             # nav + sidebar wrapper
│   │   ├── Sidebar.tsx
│   │   ├── MobileBottomNav.tsx
│   │   └── PageHeader.tsx           # page title + actions slot
│   │
│   ├── dashboard/
│   │   ├── StatsCards.tsx
│   │   ├── TodaySummaryBar.tsx
│   │   ├── GoalTracker.tsx
│   │   ├── ActivityFeed.tsx
│   │   └── FollowUpBanner.tsx
│   │
│   ├── applications/
│   │   ├── ApplicationTable.tsx     # sortable/filterable table
│   │   ├── ApplicationTableRow.tsx
│   │   ├── ApplicationFilters.tsx   # filter bar above table
│   │   ├── ApplicationDetail.tsx    # slide-over panel
│   │   ├── ApplicationForm.tsx      # create/edit form
│   │   ├── QuickAddForm.tsx         # minimal 3-field form
│   │   ├── StatusBadge.tsx
│   │   ├── StatusTimeline.tsx       # history in detail view
│   │   └── DuplicateWarning.tsx
│   │
│   ├── kanban/
│   │   ├── KanbanBoard.tsx          # DragDropContext wrapper
│   │   ├── KanbanColumn.tsx         # Droppable column
│   │   ├── KanbanCard.tsx           # Draggable card
│   │   └── KanbanColumnHeader.tsx
│   │
│   ├── wishlist/
│   │   ├── MyWishlist.tsx
│   │   ├── SharedWishlist.tsx
│   │   ├── WishlistCard.tsx
│   │   └── AddToWishlistForm.tsx
│   │
│   ├── follow-ups/
│   │   ├── FollowUpSection.tsx      # reusable for overdue/today/upcoming
│   │   ├── FollowUpRow.tsx
│   │   └── AutoSurfacedSection.tsx
│   │
│   ├── resume/
│   │   ├── ResumeVersionTable.tsx
│   │   ├── CoverLetterVersionTable.tsx
│   │   ├── InsightBanner.tsx
│   │   └── VersionForm.tsx
│   │
│   ├── analytics/
│   │   ├── ApplicationsOverTimeChart.tsx
│   │   ├── SourcePerformanceChart.tsx
│   │   ├── PipelineFunnelChart.tsx
│   │   ├── AgeDistributionChart.tsx
│   │   ├── LocationBreakdownChart.tsx
│   │   ├── ResumePerformanceChart.tsx
│   │   ├── InsightsList.tsx
│   │   └── DateRangeFilter.tsx
│   │
│   ├── namespace/
│   │   ├── NamespacePicker.tsx      # home page
│   │   ├── NamespaceCard.tsx
│   │   ├── CreateNamespaceForm.tsx
│   │   ├── PinEntry.tsx
│   │   └── NamespaceSwitcher.tsx    # nav dropdown
│   │
│   └── shared/
│       ├── SlideOver.tsx            # reusable drawer panel
│       ├── ConfirmDialog.tsx
│       ├── EmptyState.tsx
│       ├── SkeletonCard.tsx
│       └── CsvImporter.tsx
│
├── hooks/
│   ├── useApplications.ts           # SWR hook for applications list
│   ├── useApplication.ts            # single application
│   ├── useAnalytics.ts
│   ├── useFollowUps.ts
│   ├── useWishlist.ts
│   ├── useResumeVersions.ts
│   └── useNamespace.ts              # current session namespace
│
├── lib/
│   ├── db/
│   │   ├── index.ts                 # Drizzle client
│   │   └── schema.ts                # all table definitions
│   ├── session.ts                   # iron-session config
│   ├── auth.ts                      # withSession middleware helper
│   ├── validations.ts               # Zod schemas for all forms
│   └── utils.ts                     # cn(), formatDate(), formatCurrency(), etc.
│
└── types/
    └── index.ts                     # all shared TypeScript types
```

---

## 11. Data Models (TypeScript)

```typescript
// types/index.ts

export type ApplicationStatus =
  | 'wishlist' | 'applied' | 'viewed' | 'interview'
  | 'technical_test' | 'final_interview' | 'offer'
  | 'accepted' | 'rejected' | 'ghosted' | 'withdrawn';

export type Source =
  | 'jobstreet' | 'linkedin' | 'indeed' | 'company_website'
  | 'referral' | 'cold_email' | 'recruitment_agency' | 'other';

export type Priority = 'low' | 'medium' | 'high';

export interface Namespace {
  id: string;
  slug: string;
  displayName: string;
  color: string;
  isPublic: boolean;
  weeklyGoal?: number;
  customStatuses?: Record<ApplicationStatus, string>; // label overrides
  customSources?: string[];
  createdAt: string;
}

export interface Application {
  id: string;
  namespaceId: string;
  company: string;
  role: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  status: ApplicationStatus;
  source?: Source;
  appliedDate?: string;
  contactPerson?: string;
  contactEmail?: string;
  jobUrl?: string;
  resumeVersion?: string;
  coverLetterVersion?: string;
  notes?: string;
  jobDescription?: string;
  nextAction?: string;
  followUpDate?: string;
  kanbanOrder: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistory {
  id: string;
  applicationId: string;
  fromStatus?: ApplicationStatus;
  toStatus: ApplicationStatus;
  note?: string;
  changedAt: string;
}

export interface WishlistEntry {
  id: string;
  addedByNamespaceId: string;
  addedByNamespace?: Pick<Namespace, 'slug' | 'displayName' | 'color'>; // joined
  company: string;
  role?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  jobUrl?: string;
  notes?: string;
  priority: Priority;
  claimedByNamespaceSlugs: string[];
  createdAt: string;
}

export interface ResumeVersion {
  id: string;
  namespaceId: string;
  name: string;
  notes?: string;
  createdAt: string;
  // Computed (from join)
  applicationCount?: number;
  interviewCount?: number;
  conversionRate?: number;
}

export interface CoverLetterVersion {
  id: string;
  namespaceId: string;
  name: string;
  notes?: string;
  createdAt: string;
  applicationCount?: number;
  interviewCount?: number;
  conversionRate?: number;
}

export interface DashboardStats {
  totalApplications: number;
  interviews: number;
  offers: number;
  rejections: number;
  ghosted: number;
  pending: number;
  interviewRate: number;
  offerRate: number;
  followUpsDueToday: number;
  interviewsThisWeek: number;
  applicationsThisWeek: number;
  daysSinceLastApplication: number;
  weeklyGoalProgress: { current: number; goal: number };
}

export interface ActivityEntry {
  applicationId: string;
  company: string;
  role: string;
  fromStatus?: ApplicationStatus;
  toStatus: ApplicationStatus;
  note?: string;
  changedAt: string;
}

export interface SessionData {
  namespaceId: string;
  namespaceSlug: string;
  isLoggedIn: boolean;
}
```

---

## 12. Environment & Deployment

### Environment Variables
```bash
# .env.local
POSTGRES_URL="postgres://..."               # Vercel Postgres connection string
POSTGRES_PRISMA_URL="postgres://..."       # For Drizzle pooled connection
SESSION_SECRET="at-least-32-chars-random"  # iron-session encryption key
```

### Vercel Setup Steps
1. Create new Next.js project on Vercel
2. Go to Storage → Create Postgres database → attach to project
3. Vercel auto-injects `POSTGRES_URL` etc. into environment
4. Set `SESSION_SECRET` manually in Vercel environment variables
5. Push code → auto-deploys

### DB Migrations
Use Drizzle Kit:
```bash
npm run db:generate   # generates migration SQL
npm run db:migrate    # runs migrations against Vercel Postgres
npm run db:studio     # opens Drizzle Studio (visual DB browser)
```

`package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Dependencies
```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "typescript": "5.x",
    "@vercel/postgres": "latest",
    "drizzle-orm": "latest",
    "iron-session": "^8",
    "bcryptjs": "^2",
    "@hello-pangea/dnd": "latest",
    "recharts": "latest",
    "date-fns": "latest",
    "react-hook-form": "latest",
    "zod": "latest",
    "@hookform/resolvers": "latest",
    "sonner": "latest",
    "tailwindcss": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "drizzle-kit": "latest",
    "@types/bcryptjs": "latest"
  }
}
```

---

## 13. Implementation Order

Build in this order. Each phase is independently deployable.

### Phase 1 — Foundation (Days 1–2)
1. Next.js project setup with TypeScript + Tailwind + shadcn/ui
2. Vercel Postgres connection via Drizzle
3. DB schema + first migration
4. `iron-session` setup
5. Namespace picker home page (`/`)
6. Login / session API routes
7. App shell (sidebar layout, nav)

**Deliverable:** Can create a namespace, log in, and see an empty dashboard.

### Phase 2 — Applications Core (Days 3–5)
1. Application CRUD API routes
2. Application list page (table view) with filters
3. Quick Add form (FAB)
4. Full application detail slide-over
5. Status history write on status change
6. Duplicate detection

**Deliverable:** Can add, view, edit, archive applications.

### Phase 3 — Kanban (Days 6–7)
1. Kanban board layout with `@hello-pangea/dnd`
2. Drag & drop → PATCH status API
3. Kanban card design
4. View toggle (table ↔ kanban) with localStorage persistence

**Deliverable:** Full pipeline board with drag & drop.

### Phase 4 — Dashboard & Follow-Ups (Days 8–9)
1. Stats cards with computed values
2. Today's summary bar
3. Goal tracker
4. Activity feed
5. Follow-up alerts page
6. Auto-surface logic for stale applications

**Deliverable:** Dashboard is useful and follow-ups surfaced.

### Phase 5 — Wishlist (Day 10)
1. Shared wishlist API (GET, POST, PATCH, DELETE)
2. Claim endpoint
3. Wishlist page (both sections)
4. Move wishlist → applied flow

**Deliverable:** Shared group wishlist working.

### Phase 6 — Resume Tracker (Day 11)
1. Resume/cover letter version CRUD
2. Resume tracker page with performance table
3. Insight banner logic

**Deliverable:** Resume version tracking with conversion rates.

### Phase 7 — Analytics (Days 12–13)
1. Analytics API endpoint (single payload)
2. All 6 charts with Recharts
3. Date range filter
4. Text insights logic

**Deliverable:** Full analytics dashboard.

### Phase 8 — Multi-User & Settings (Days 14–15)
1. Namespace switcher in nav
2. Cross-namespace read-only view
3. Leaderboard page
4. Settings page (rename, PIN change, color, export, import)
5. CSV export/import

**Deliverable:** Multi-user fully working, settings complete.

---

## 14. Acceptance Criteria

### Auth / Namespace
- [ ] Can create a namespace with just a slug and display name
- [ ] Can set a 4-digit PIN and it is required on next login
- [ ] Switching namespaces logs out of current namespace
- [ ] Cannot access any app route without a session (redirects to `/`)

### Applications
- [ ] Can add an application with only company + role + status
- [ ] Can add an application with all optional fields
- [ ] Status change writes a row to status_history
- [ ] Duplicate warning fires when same company + role already exists in namespace
- [ ] Archive hides application from table and kanban
- [ ] Archived applications excluded from all stats
- [ ] Bulk status change works on 5+ applications simultaneously

### Kanban
- [ ] Drag card from Applied to Interview → status updates in DB
- [ ] Drag within a column → kanbanOrder persists across page refresh
- [ ] If API fails on drag, card snaps back to original column
- [ ] Kanban renders without horizontal overflow on 1280px+ screens

### Follow-Ups
- [ ] Overdue follow-ups (date < today) appear in red section
- [ ] Snooze pushes date by 3 days
- [ ] Mark Done clears followUpDate from application
- [ ] Auto-surface shows applications with status=applied, appliedDate > 7 days ago, no status change in 7 days

### Wishlist
- [ ] Any namespace can add to shared wishlist
- [ ] Claiming a wishlist entry creates an application in the claiming namespace
- [ ] Cannot edit or delete another namespace's wishlist entry
- [ ] Claimed status shows which namespaces have claimed each entry

### Analytics
- [ ] All charts respond to date range filter
- [ ] Source performance chart sorted by interview conversion rate
- [ ] Resume performance shows correct conversion rate (interviews / applications)
- [ ] Insights section shows correct banner when one resume version is 2× average

### Multi-User
- [ ] Namespace with `isPublic: false` does not appear on leaderboard with stats
- [ ] Read-only view shows no edit controls
- [ ] PIN change takes effect immediately on next login

### Export / Import
- [ ] CSV export downloads all fields for current namespace
- [ ] CSV import with column mapper correctly maps and imports 10+ rows
- [ ] Import shows duplicate warnings before committing

### Performance
- [ ] Dashboard stats load in < 1 second (single SQL query with aggregation)
- [ ] Analytics endpoint returns in < 2 seconds for up to 500 applications
- [ ] Kanban with 50 cards renders without jank

---

*End of PRD — HuntBoard v1.0*