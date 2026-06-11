# HuntBoard — Product Analysis, Gap Analysis & Feature Expansion
**Version:** 2.0  
**Based on:** PRD v1.0 + Live UI Screenshots + AI Product Audit Prompt  
**Date:** 2026-06-11  
**Status:** Master Reference Document

---

## Table of Contents

1. [Product Analysis](#1-product-analysis)
2. [User Journey Map](#2-user-journey-map)
3. [Gap Analysis](#3-gap-analysis)
4. [Feature Audit (A/B/C/D Classification)](#4-feature-audit)
5. [Beyond a Job Tracker](#5-beyond-a-job-tracker)
6. [Recruiter Lens](#6-recruiter-lens)
7. [ATS Expert Lens](#7-ats-expert-lens)
8. [SaaS Founder Lens](#8-saas-founder-lens)
9. [50 New Feature Ideas](#9-50-new-feature-ideas)
10. [Master Roadmap](#10-master-roadmap)
11. [PRD Addendum — New Specs](#11-prd-addendum--new-specs)

---

## 1. Product Analysis

### What HuntBoard Is

HuntBoard is a personal job-search CRM — a structured system for tracking every opportunity from first discovery to final decision. It is built as a private, multi-user namespace app on Next.js + Vercel Postgres. The core thesis is that job hunting is a sales pipeline, and you need the same tools a salesperson uses: a CRM, a funnel view, follow-up reminders, and source performance analytics.

It is not a job board. It does not scrape. It does not auto-apply. It is the **operating layer on top of job boards** — the place where you bring everything you find and manage it intelligently.

### Who It Serves

**Primary:** Final-year CS/engineering students in Malaysia (UTM, UTP, MMU, etc.) doing their final-semester job hunt. They are applying to 30–100+ companies simultaneously, using 3–5 platforms (Jobstreet, LinkedIn, Indeed, company sites), and have no system beyond a Google Sheet or Notes app.

**Secondary:** Fresh graduates in the first 12 months post-graduation, still actively hunting. Same behavior, higher desperation, more sophisticated.

**Tertiary (if productized):** Any knowledge worker doing an active job hunt. The core pain is universal.

**Shared use case:** Small friend groups hunting simultaneously who want visibility into each other's pipelines, share leads, and not duplicate effort on the same openings.

### Core Workflows (Existing)

1. **Capture** — Add a role to Wishlist or directly to Applied
2. **Track** — Move cards through the pipeline (Wishlist → Applied → Viewed → Interview → Offer)
3. **Measure** — Analytics: funnel, source performance, age distribution, resume performance
4. **Version** — Track which resume version was sent to which role
5. **Share** — Shared wishlist board where friends contribute leads

### Existing Strengths

- **Pipeline clarity.** Kanban-style view is strictly better than a spreadsheet. The 8-stage pipeline is well-designed and covers the full arc from wishlist to accepted.
- **Multi-user namespace model.** Clever. Zero auth friction. Friends can share leads and see each other's boards without building a full user management system.
- **Resume version tracking.** This is rare. Most trackers don't do this. The insight that "Resume V2 gets 5× the interviews of Resume V1" is genuinely high-leverage.
- **Analytics with funnel view.** The pipeline funnel visualization is the most important chart in the product. Seeing 86% drop at "Viewed" is a data point that should trigger action.
- **Source performance tracking.** Knowing LinkedIn outperforms Jobstreet is actionable and rare in personal trackers.
- **Shared wishlist with claims.** The "Shared By / Claims" column in the board table is a genuinely novel social mechanic.

### Existing Weaknesses

#### Critical Weaknesses (blocking interview outcomes)

1. **Passive data collection, no active guidance.** The system tells you *what* happened but never tells you *what to do next*. 29 applications, 0 interviews is a data point — not an intervention. The product should be screaming at the user by now.

2. **No resume-to-JD matching.** You can track which resume version you sent, but you cannot measure *how well that resume matched the job description*. This is the single biggest lever for getting interviews. The entire ATS filtration happens here.

3. **No follow-up intelligence.** There is a follow-up date field in the PRD but no system that understands *when* to follow up, *how* to follow up, or *which applications are worth following up on*.

4. **No quality signal on applications.** You track quantity (29 applied) but not quality. Was the JD a 40% match or 90% match? Was it a reach role or a target role? This matters enormously.

5. **No outreach tracking.** Cold emails, LinkedIn DMs, referral requests — these are the highest-ROI activities in a job hunt and they are completely absent from the system.

6. **No interview preparation module.** Once you get an interview (the most valuable event in the entire pipeline), HuntBoard has nothing to offer. No STAR story tracking, no company research notes, no question bank.

#### Secondary Weaknesses

7. **Analytics is retrospective, not predictive.** Charts show what happened. Nothing suggests what you should do tomorrow to change the trend.

8. **No contact/recruiter tracking.** Who did you email? Who responded? Who is the hiring manager at Company X? This is CRM 101.

9. **No application quality score.** The 86% drop at "Viewed" likely reflects low-quality bulk applications. The system should help users apply to fewer, better-matched roles.

10. **No response rate by company size/type.** Applying to MNCs vs startups vs government-linked companies in Malaysia has very different response dynamics. This is not captured.

### Hidden Opportunities

1. **The friend-group mechanic is underexplored.** Right now it's "share leads." It could be "collective intelligence" — if Alvis gets interviews at companies you applied to and got ghosted, that's a signal about *you vs the role*, not the market.

2. **Resume performance is the product's killer feature** — but it's currently just a table. The insight that one resume version has 3× conversion should be the loudest thing on the screen.

3. **The funnel drop-off is a coaching opportunity.** 86% drop at Viewed means recruiter opens the application but doesn't advance it. This is almost always a resume/portfolio problem. The product should diagnose this specifically.

4. **Malaysian market specificity.** Jobstreet dominates Malaysian hiring. LinkedIn is secondary. MyFutureJobs (government portal) exists. Understanding the Malaysian job market's specific behavior (Bumiputera requirements, expected salary norms, bilingual JDs) is a moat no Western tracker will build.

5. **Network/referral tracking.** In Malaysia (and everywhere), referrals have dramatically higher success rates. If you got a role through a UTM senior, that should be tracked and celebrated.

### Missing Workflows

- Resume tailoring workflow (before applying)
- Post-application follow-up workflow
- Interview prep workflow
- Offer evaluation/negotiation workflow
- Network building workflow
- Cold outreach workflow
- Rejection reflection workflow ("why did this fail?")

### Product Positioning

**Current positioning (implicit):** "A better spreadsheet for job tracking."

**Should be:** "The job search operating system that tells you why you're not getting interviews — and what to do about it."

The product has all the tracking infrastructure. What it lacks is the *intelligence layer* that converts data into action.

---

## 2. User Journey Map

```
STAGE             HuntBoard Today          What Users Actually Need
─────────────────────────────────────────────────────────────────────

1. DISCOVERY
   Find jobs on Jobstreet,
   LinkedIn, company sites     ✅ Add to Wishlist          🔴 Browser extension to
                                                              capture jobs directly
                                                           🔴 Batch import from CSV
                                                           🔴 "Roles like this" signal

2. RESEARCH
   Read JD, check company,
   assess fit                  🔴 No support               🔴 Company notes field
                                                           🔴 JD storage + analysis
                                                           🔴 Fit score (manual or auto)
                                                           🔴 Glassdoor/salary data

3. RESUME TAILORING
   Customize resume for
   the specific role            ⚠️ Track version sent       🔴 JD keyword extraction
                               (no tailoring guidance)     🔴 Resume-JD match score
                                                           🔴 Missing keywords alert
                                                           🔴 Tailoring checklist

4. APPLICATION
   Submit via platform          ✅ Log application          🔴 Application quality score
                               ✅ Track source              🔴 Time-to-apply tracking
                               ✅ Track resume version      🔴 Cover letter version
                                                           🔴 Salary expectation field

5. WAITING PERIOD
   0–14 days post-apply        ⚠️ Application age shown     🔴 "Time to follow up" alert
                               (passive display only)      🔴 Follow-up templates
                                                           🔴 Auto-surface stale apps
                                                           🔴 Response probability signal

6. FOLLOW-UP
   Send a follow-up email
   or LinkedIn message         🔴 No support               🔴 Follow-up log per app
                                                           🔴 Follow-up templates
                                                           🔴 Contact tracking (who,
                                                              email, LinkedIn URL)
                                                           🔴 Follow-up status tracking

7. RECRUITER CONTACT
   HR emails / calls for
   phone screen                🔴 No dedicated flow        🔴 Contact log
                                                           🔴 Response time tracking
                                                           🔴 Recruiter name/contact
                                                           🔴 Move to Interview trigger

8. INTERVIEW
   Phone screen, technical,
   final round                 🔴 Nothing after Interview   🔴 Interview prep notes
                               stage exists beyond         🔴 STAR story bank
                               pipeline card               🔴 Question tracker
                                                           🔴 Post-interview notes
                                                           🔴 Interview timeline
                                                              (how many rounds, dates)

9. OFFER
   Receive and evaluate
   an offer                    🔴 Just an "Offer" card      🔴 Offer details capture
                                                              (salary, benefits, start date)
                                                           🔴 Offer comparison
                                                           🔴 Negotiation notes
                                                           🔴 Deadline tracker

10. DECISION
    Accept or reject            🔴 "Accepted" card only     🔴 Decline reason logging
                                                           🔴 Lessons learned
                                                           🔴 Hunt summary / stats
```

**Verdict:** HuntBoard currently covers stages 1, 4, and partially 2. Stages 3, 5, 6, 7, 8, 9, 10 are either completely absent or passively acknowledged with no workflow support.

---

## 3. Gap Analysis

### 3.1 Missing Functionalities

#### F1: Interview Preparation Module
The most valuable event in the pipeline — the interview — has zero tooling in HuntBoard. No STAR story bank, no question tracking, no company-specific prep notes, no round-by-round logging.

#### F2: Follow-Up Workflow
There is a `followUpDate` field but no follow-up templates, no log of follow-ups sent, no tracking of whether a follow-up got a response, and no intelligence about *whether* to follow up at all.

#### F3: Contact / Recruiter CRM
No way to store recruiter names, HR emails, LinkedIn profiles, or hiring manager details per application. This is basic CRM functionality that is entirely absent.

#### F4: Outreach Tracking
Cold emails to founders, LinkedIn connection requests, referral asks — the highest-ROI job-search activities are invisible to HuntBoard. No log, no template, no response tracking.

#### F5: Offer Details & Comparison
When an offer arrives, there is nowhere to record salary, benefits, start date, bond period, equity, allowances, or any of the information needed to evaluate it. Two offers cannot be compared side-by-side.

#### F6: Application Quality Scoring
Every application looks identical in the board. There is no signal for whether it was a strong match (90% JD alignment, referral, tailored resume) or a spray-and-pray (60% match, generic resume, high volume day).

#### F7: Rejection Tagging / Reason Logging
When an application moves to Rejected, there is no prompt to log why (ATS filtered, no response, post-interview rejection, overqualified, etc.). This data is invaluable for pattern recognition.

#### F8: Hunt Session / Batch Context
No concept of "I spent 3 hours applying today and sent 8 applications." Sessions matter because batch-applying without tailoring is a known anti-pattern. Knowing your apply-per-session count would surface this.

#### F9: Salary Intelligence
No salary expectation field per application, no salary range from JD, no offer salary recording. You cannot compute "my expected salary range" vs "what companies offered."

#### F10: Company Research Notes
A structured research section per company: Glassdoor rating, tech stack, culture notes, interview format (from Glassdoor/LeetCode), team size, funding stage, why you want to work there.

---

### 3.2 Missing Data

| Data Point | Why It Matters |
|------------|---------------|
| JD full text (stored per application) | Enable keyword analysis, ATS scoring, tailoring guidance |
| Salary range from JD | Compare your expectation to market |
| Salary expectation you submitted | Track negotiation room |
| Actual offer salary | Compute offer vs expectation delta |
| Application method (Easy Apply vs full form) | Easy Apply has lower success rates — this matters |
| Time spent on application (minutes) | Quality proxy |
| Number of follow-ups sent | Measure follow-up ROI |
| Days to first response | Benchmark against market average |
| Days to each pipeline stage change | Identify slow pipelines vs active ones |
| Interview format (phone/video/onsite/panel) | Prep context |
| Number of interview rounds | Planning |
| Interviewer names/roles | Prep context |
| Company size / funding stage | Success rate varies by company type |
| Role seniority level | Junior vs mid vs senior vs lead |
| Reject reason | Pattern recognition |
| Portfolio/GitHub submitted (Y/N + URL) | Success rate with vs without portfolio |
| Referral source (who referred you) | Referral success rate tracking |
| ATS platform used (Workday, Greenhouse, Lever) | ATS-specific behavior patterns |
| Response time from company | Recruiter engagement signal |

---

### 3.3 Missing Automations

| Automation | Trigger | Action |
|------------|---------|--------|
| Follow-up reminder | 7 days since Applied, no status change | Surface in follow-up dashboard |
| Stale application alert | 14 days since Applied, still Applied | Amber warning on card |
| Ghost alert | 21 days since Applied, no response | Move suggestion to Ghosted |
| Interview prep reminder | Status changed to Interview | "Don't forget to prep" banner |
| Weekly digest | Every Monday | "Last week: 8 apps, 0 responses. Your best source: LinkedIn (20% rate)." |
| Resume performance insight | After 10+ apps on a version with 0 interviews | "Consider switching resume versions" |
| Offer deadline alert | Offer followUpDate approaching | Countdown banner |
| Monthly hunt summary | 1st of every month | Stats recap: apps sent, response rate, best source |

---

### 3.4 Missing Intelligence

These are decisions the system currently cannot help with:

| Decision | What's Needed |
|----------|--------------|
| "Should I apply to this role?" | JD match score against resume |
| "Which resume should I use?" | Resume-JD keyword overlap analysis |
| "Should I follow up on this?" | Response probability based on company size, source, age |
| "Why am I not getting interviews?" | Diagnosis: resume quality, application volume, role mismatch, location filter |
| "Which companies are worth more effort?" | Company scoring: response rate by type, JD quality, salary range |
| "What questions should I prep?" | Role-specific question patterns |
| "Is this offer fair?" | Market salary comparison (Malaysia-specific) |
| "Where should I focus next week?" | Priority scoring based on pipeline stage and follow-up dates |

---

### 3.5 Missing Recruiter Insights

From a recruiter's perspective, HuntBoard's data would show almost nothing useful about candidate quality. Missing:

- Portfolio URL per application (did you include it?)
- GitHub profile
- LinkedIn profile URL (tracked per application — did you have it updated before applying?)
- Cover letter presence (Y/N, not just version)
- Application completeness score (did you fill all fields in the application form?)
- Referral tracking (who in the company referred you, if anyone)
- Response to screening questions (many JDs have knockout questions)
- Company-specific prep notes (shows seriousness)

---

## 4. Feature Audit

### Category A — Must Build Immediately

These are blocking interview outcomes. Build before anything else.

---

**A1: Job Description Storage**
- Every application should store the full JD text (paste or URL)
- Why: Every other high-value feature depends on having the JD. Resume matching, keyword analysis, interview prep, rejection analysis — all need the JD.
- Complexity: Low. Just a large text field.
- Without this, you cannot build A2, A3, or half of B features.

**A2: Follow-Up Log Per Application**
- Log of every follow-up action: date sent, method (email/LinkedIn/phone), content/template used, response received (Y/N)
- Why: 29 applications, 0 interviews is likely partly a follow-up problem. No follow-up = no data on whether following up works for you.
- Complexity: Low. New table, simple form.

**A3: Recruiter/Contact Tracking Per Application**
- Store: recruiter name, recruiter email, recruiter LinkedIn, hiring manager name
- Why: CRM 101. You cannot follow up effectively without knowing who to contact. This data also feeds outreach tracking.
- Complexity: Low. Additional fields on application.

**A4: Rejection Reason Tagging**
- When status moves to Rejected or Ghosted, prompt: "Why? [ATS Filtered] [No Response] [Post-Interview] [Overqualified] [Underqualified] [Role Cancelled] [Salary Mismatch] [Other]"
- Why: Pattern recognition. If 80% of rejections are ATS-filtered, you have a resume problem, not a volume problem.
- Complexity: Low. Enum field + modal trigger.

**A5: Role Fit Score (Manual)**
- Before applying, user rates the fit: "How well does this role match you? [Reach] [Target] [Safe]" or a 1–5 stars score
- Why: Tracking this reveals whether you're applying to roles outside your zone. 29 applications with 0 interviews often means too many reach applications.
- Complexity: Low. Single field, select input.
- Also add: "Did you tailor your resume?" Y/N checkbox per application.

**A6: Weekly Focus Summary (Dashboard Widget)**
- A dashboard widget that gives you one actionable recommendation based on your data
- Logic:
  - 0 interviews after 20+ apps → "Your resume may be the issue. Try tailoring it to specific JDs."
  - 86% drop at Viewed → "Recruiters are opening but not advancing you. Resume and portfolio are likely the bottleneck."
  - 5+ overdue follow-ups → "You have 5 unclosed follow-ups. Address these before adding more applications."
  - No applications this week → "You haven't applied this week. Your goal was 10. Add 5 today."
- Complexity: Low. Conditional logic on existing data.
- This is the feature that turns a passive tracker into an active coach.

---

### Category B — High Value

**B1: Interview Preparation Module**
- Per-application interview tab: round tracker (Round 1 / Round 2 / Final), round notes, question log, STAR stories assigned to rounds, outcome per round
- Sub-feature: Global STAR story bank (write your stories once, tag to applications)
- Why: Getting the interview is hard. Blowing the interview because you weren't prepped is unforgivable.
- Complexity: Medium

**B2: Outreach Tracker**
- Log cold emails, LinkedIn DMs, referral requests per application or per company
- Fields: type (cold email / LinkedIn DM / referral ask / referral received), date, contact name, outcome (no response / positive / negative)
- Why: The highest-ROI job hunt activity is leveraging your network. HuntBoard doesn't acknowledge it exists.
- Complexity: Low–Medium

**B3: Offer Details Module**
- When status = Offer, expand the card to capture: base salary, bonuses, benefits, equity, start date, bond period, response deadline
- Offer comparison view: side-by-side if multiple offers
- Why: You might have two offers. You need to evaluate them. Google Sheets is not the right tool.
- Complexity: Medium

**B4: Resume-JD Keyword Analysis** (requires A1 and stored resume text)
- Paste your resume text once. Paste the JD. Get a list of keywords in the JD that are missing from your resume.
- This is ATS optimization in practical form.
- No AI needed: simple tokenization and keyword frequency analysis in JS
- Complexity: Medium
- Impact: Very high. This is the feature that directly addresses the 86% drop at Viewed.

**B5: Application Quality Score**
- Computed from: Fit score set, JD stored, resume tailored (Y/N), cover letter used (Y/N), contact stored, portfolio included (Y/N)
- Display as a quality bar (red/amber/green) on each kanban card
- Why: Forces you to see which applications were sent with care vs sprayed
- Complexity: Low (computed field, no new data collection beyond A-tier fields)

**B6: Hunt Health Score**
- A single 0–100 score on the dashboard
- Computed from: application quality average, follow-up rate, response rate, interview rate, activity recency
- Why: A single number that represents how well you're hunting. Drops when you ghost your own follow-ups. Rises when you get interviews.
- Complexity: Medium (formula design is the hard part, not the code)

**B7: Daily Hunt Log / Journal**
- A simple daily text field: "What did I do for my job hunt today?"
- Optional: structured mode with checkboxes (Applied X roles, Followed up on X, Prepped for X)
- Why: Accountability. Journaling the hunt reveals patterns. Active hunters get jobs faster.
- Complexity: Low

**B8: Source ROI Calculator**
- Enhancement to existing source analytics
- Show: time invested estimate per source (user inputs "I spend X hours/week on LinkedIn") vs interviews generated
- Display as ROI: "LinkedIn: 2 hrs/week → 3 interviews. Jobstreet: 3 hrs/week → 0 interviews."
- Complexity: Low (one extra input field per source in settings, then formula)

**B9: Application Pacing Tracker**
- Track applications per day/week with a calendar heatmap (like GitHub contribution graph)
- Why: Visual accountability. You can see you stopped applying for 2 weeks.
- Complexity: Low–Medium

---

### Category C — Nice to Have

**C1: Leaderboard** — who's applied the most this week among friends
**C2: Interview Question Bank** — global question list tagged by company/role type
**C3: Salary Intelligence Dashboard** — market salary data per role (requires manual data entry or scraping, complex to do right)
**C4: Company Research Template** — structured notes: tech stack, culture, funding, Glassdoor rating, why you want to work there
**C5: Mobile Push Notifications** — follow-up reminders (requires PWA setup or separate service)
**C6: Custom Pipeline Stages** — rename stages (e.g. "Online Assessment" instead of "Technical Test")
**C7: Hunt Summary Report** — auto-generated PDF/Markdown summary of the entire hunt at the end
**C8: Duplicate Company Alert** — warn when you try to apply to same company twice within 6 months
**C9: Calendar Integration** — sync interview dates to Google Calendar (complex, requires OAuth)
**C10: Browser Extension** — capture jobs from Jobstreet/LinkedIn without leaving the tab (high complexity, separate product surface)

---

### Category D — Do Not Build

**D1: AI resume writer** — Feature bloat. Out of scope. Users should write their own resumes.
**D2: Auto-apply** — Destroys application quality. Antithetical to the product's philosophy.
**D3: Job board aggregation / scraping** — Legal risk, massive complexity, not the product's job.
**D4: Email integration (read inbox for responses)** — Privacy nightmare, OAuth complexity, fragile.
**D5: Recruiter-facing profile** — Different product entirely. HuntBoard is private by design.
**D6: Social feed / public sharing** — Feature bloat. This is a private tool, not LinkedIn.
**D7: Team/company accounts** — Out of scope. This is a personal tool.
**D8: Payment/monetization features** — This is a personal project, not a SaaS.

---

## 5. Beyond a Job Tracker

### As a Career CRM
HuntBoard already has the bones of a CRM (pipeline, contacts, notes, follow-ups). To complete it:
- Add a **Contacts database** separate from applications. Store every recruiter, hiring manager, senior you met at a career fair, UTM alumni at a company — regardless of whether you have an open application with them.
- Add **interaction log** per contact: "Met at UTM career fair May 2026", "Sent LinkedIn request, connected", "Had informational interview Jun 2026"
- This turns the post-hunt period useful. Even after you accept an offer, your network data stays.

### As a Job Search OS
The OS framing means HuntBoard is the **single source of truth** for everything job-hunt related. This means:
- Every document version lives here (resume versions, cover letter versions, portfolio URLs)
- Every contact lives here
- Every opportunity, at every stage, lives here
- Your schedule (interview dates, follow-up dates) is visible here
- Your goals (weekly application target) are tracked here
- Your performance (interview rate, offer rate, source ROI) is measured here

### As an Interview Intelligence Platform
The interview is the highest-stakes, most underprepared moment in the job hunt. HuntBoard can own this:
- STAR story bank: write your stories once, retrieve them before any interview
- Company-specific prep: pull the JD, generate a checklist of topics to prepare
- Round tracker: log questions asked per round, what you answered, what you'd improve
- Post-interview debrief: forced reflection after every interview (what went well, what didn't, what you'd change)
- Pattern analysis: across all interviews, which question types come up most? Where do you consistently struggle?

### As an Application Optimization Engine
The funnel drop at "Viewed → Interview" is almost always a resume/portfolio problem. HuntBoard can diagnose and fix this:
- JD keyword analysis (B4) tells you what you're missing
- Resume version performance (existing) tells you which version works
- Application quality score (B5) tells you if you're cutting corners
- Tailoring checklist per application forces deliberate customization

### What Would Make Users Unable to Live Without HuntBoard
1. **The STAR story bank.** Write 10 stories once. Pull them before every interview. This single feature is irreplaceable.
2. **Resume performance data.** Nowhere else can you see "Resume V3 has 40% interview rate, Resume V1 has 0%." This data only exists if you tracked it here.
3. **Historical contact database.** Every recruiter you ever spoke to, every hiring manager, every referral — this is the professional network graph you built during the hunt. Irreplaceable.
4. **Full application history.** 3 years from now, when you're hunting again, you will want to know what worked last time, which companies you applied to, and what interview questions you faced. This data lives in HuntBoard only.
5. **The friend group mechanic.** Alvis got an interview at a company you got ghosted at. That's a signal. The collective intelligence of a small friend group is more valuable than individual tracking.

---

## 6. Recruiter Lens

*Acting as a recruiter reviewing a candidate who uses HuntBoard:*

### What I Would Want to See
- Portfolio URL confirmed and current (not a dead link)
- Resume version used (so I can match it to what's in the ATS)
- Application completeness (did they answer all screening questions?)
- Time of application (applications at 2am vs 9am have different quality signals)
- Whether they followed up (shows genuine interest)
- Referral source (a referral from an existing employee = 10× higher consideration)

### Signals Recruiter Would Value
- **Application-to-role fit score** — does this person understand what we're asking for?
- **Response to customization** — did they tailor their resume, or is it clearly generic?
- **Persistence (follow-up)** — one polite follow-up is a positive signal in most Malaysian companies
- **Portfolio/GitHub presence** — for tech roles, a GitHub link is the single most predictive signal
- **Interview prep signals** — candidates who ask good questions in a screening call are clearly prepared

### What HuntBoard Should Capture for Recruiter Context
Add to each application:
- `portfolioUrl` — URL submitted with application
- `githubUrl` — GitHub profile URL (static, from user profile)
- `linkedinUrl` — LinkedIn URL used
- `appliedVia` — Easy Apply vs full form vs email vs referral
- `screeningQuestionsAnswered` — Y/N (many JDs have knockout questions)
- `referredBy` — contact name if referral

---

## 7. ATS Expert Lens

### How ATS Systems Actually Work (That Job Seekers Don't Understand)

1. **ATS parses your resume and scores it against the JD.** Greenhouse, Workday, Lever all do this. Your resume is not read by a human first. The score determines whether you reach a human.

2. **Keywords must match exactly.** "ReactJS" and "React.js" are different tokens in some systems. "JavaScript" and "JS" are different. Abbreviations matter.

3. **Formatting kills parsing.** Tables, columns, text boxes, headers/footers, and logos confuse ATS parsers. They turn "Software Engineer at Mattel (2024–2026)" into garbage.

4. **The apply-to-view gap is mostly ATS.** HuntBoard shows 86% drop at Viewed. This likely means ~80% of applications never reached a human. They were filtered by ATS.

### ATS Optimization Features for HuntBoard

**JD Keyword Extraction**
- Store JD text per application (A1 above)
- Extract the most frequent meaningful keywords (nouns, skills, tools, methodologies)
- Compare against stored resume text
- Show: "These keywords appear in the JD but not your resume: [NestJS] [Agile] [REST API] [PostgreSQL]"
- No AI required. TF-IDF or simple frequency counting in JS.

**ATS Compatibility Checklist**
- Per application, a checklist:
  - [ ] Single-column resume used (not multi-column)
  - [ ] No tables or text boxes
  - [ ] Standard fonts (Arial, Calibri, Times)
  - [ ] No images or logos
  - [ ] Contact info in body, not header
  - [ ] All dates in standard format
- This is manual but surfaces the issues.

**Resume Version ATS Score**
- After JD keyword matching, compute a % overlap: "Your resume matches 62% of the key terms in this JD"
- Track this per application
- Analytics: average JD match % by resume version → correlate with interview rate

**Keyword Gap Analysis Over Time**
- Across all applications where you were rejected/ghosted, what keywords appeared most frequently in the JDs?
- These are your skills gaps. Study this list.

**Role Leveling Detection**
- Analyze JD text for seniority signals: "3–5 years", "senior", "lead", "junior", "fresh graduate", "entry level"
- Tag the application with detected seniority: Entry / Junior / Mid / Senior / Lead
- Track your success rate by role level
- If you're 0-for-15 on mid-level roles but have 40% interview rate on entry-level, that's critical data.

---

## 8. SaaS Founder Lens

*If HuntBoard were launched publicly as a product:*

### Competitive Moat Features
1. **Resume version performance tracking** — nobody else does this with real data. This is the moat.
2. **JD keyword analysis without AI** — practical, fast, private. AI-based tools require sending your resume to their servers.
3. **Friend-group collaborative wishlist** — social layer that no other tracker has
4. **Malaysian market specificity** — Jobstreet integration, MyFutureJobs, local salary benchmarks, bilingual JD support (BM/EN)
5. **Longitudinal career data** — after your first job hunt, the data stays. When you hunt again in 3 years, you have a baseline.

### Commodity Features (everyone has these, not differentiating)
- Kanban pipeline board
- Application table
- Basic analytics
- Follow-up reminders

### Retention Features
- STAR story bank (data is irreplaceable, you won't rebuild it elsewhere)
- Full application history (years of data)
- Resume performance data (only exists if you've used HuntBoard consistently)
- Contacts database

### Daily Usage Features
- Weekly goal tracker with streak
- Daily hunt log / journal
- Follow-up dashboard (need to check it every day during active hunt)
- Dashboard health score (one number that makes you want to improve it)

### Virality Features
- Shared wishlist + claims (invite friends to contribute leads)
- Leaderboard (competitive pressure within friend group)
- Hunt summary shareable card ("I applied to 128 companies and got 2 offers in 4 months")
- Resume performance comparison (show that Resume V3 outperforms by 3× — shareable insight)

---

## 9. 50 New Feature Ideas

| # | Name | Problem Solved | User Benefit | Complexity | Impact | Priority |
|---|------|---------------|--------------|------------|--------|----------|
| 1 | JD Storage | No reference after applying | Can prep for interview, do keyword analysis | Low | Very High | 10 |
| 2 | Rejection Reason Tagging | No pattern on why apps fail | Identify systemic issues (ATS vs ghosting vs interview failure) | Low | High | 10 |
| 3 | Follow-Up Log | No record of outreach actions taken | Know when/how you followed up, response rate | Low | High | 10 |
| 4 | Recruiter Contact Per App | Can't follow up without knowing who | Enables effective follow-up | Low | High | 10 |
| 5 | Role Fit Score (Manual) | All apps look equal | Distinguish quality apps from spray-and-pray | Low | High | 10 |
| 6 | Weekly Action Recommendation | Passive tracker, no guidance | Tells you the one thing to do differently | Low | Very High | 10 |
| 7 | Application Quality Score | No quality signal on pipeline cards | Forces deliberate applications | Low | High | 9 |
| 8 | JD Keyword Extractor | ATS filtration is invisible | See what keywords you're missing | Medium | Very High | 9 |
| 9 | Resume-JD Match % | Don't know how well resume matches JD | Optimize before applying | Medium | Very High | 9 |
| 10 | Hunt Health Score | No single signal of hunt performance | One number to improve daily | Medium | High | 9 |
| 11 | STAR Story Bank | Stories written on a napkin before interviews | Reusable stories across all interviews | Medium | Very High | 9 |
| 12 | Interview Round Tracker | No log of what happened in each interview | Track rounds, dates, interviewers, outcomes | Medium | High | 9 |
| 13 | Tailoring Checklist Per App | Generic resumes get filtered | Forces deliberate customization | Low | High | 9 |
| 14 | ATS Compatibility Checklist | Resume formatting breaks ATS | Surface formatting issues before applying | Low | High | 8 |
| 15 | Application Pacing Heatmap | Don't see weekly/monthly activity pattern | GitHub-style heatmap of applications | Low | Medium | 8 |
| 16 | Offer Details Module | Offer data not captured | Record and compare offers | Medium | High | 8 |
| 17 | Outreach/Cold DM Tracker | Cold outreach not tracked | Measure ROI of networking efforts | Low | High | 8 |
| 18 | Post-Interview Debrief | No reflection after interviews | Identify patterns in interview performance | Low | High | 8 |
| 19 | Days-to-Response Tracking | Don't know how long companies take | Calibrate follow-up timing | Low | Medium | 8 |
| 20 | Portfolio URL Per Application | Don't track if portfolio was included | Measure portfolio's impact on conversion | Low | Medium | 8 |
| 21 | Contacts Database | Contacts only live inside applications | Build persistent professional network | Medium | High | 8 |
| 22 | Keyword Gap Report | Don't know skills to develop | Show most-requested missing keywords | Medium | High | 8 |
| 23 | Source ROI (Time-Weighted) | Don't know which source is worth time investment | Add time estimate to source performance | Low | Medium | 7 |
| 24 | Daily Hunt Journal | No accountability mechanism | Log what you did each day | Low | Medium | 7 |
| 25 | Role Level Detection | Don't know what seniority you're targeting | Auto-tag seniority from JD text | Medium | Medium | 7 |
| 26 | Company Size Tagging | Success rate varies by company size | Track MNC vs startup vs SME performance | Low | Medium | 7 |
| 27 | Offer Comparison Table | Hard to evaluate competing offers | Side-by-side offer comparison | Medium | High | 7 |
| 28 | Referral Tracking | Referrals tracked as just another source | Track who referred you, their company, outcome | Low | Medium | 7 |
| 29 | Hunt Phase Tracker | Don't know if current phase is active enough | Track phases: cold start / active / winding down | Low | Low | 6 |
| 30 | Application Streak Counter | No streak/gamification | Track consecutive days with at least 1 application | Low | Low | 6 |
| 31 | Response Rate Benchmark | Don't know if your rate is good or bad | Show "average job seeker: 15% response rate" as baseline | Low | Medium | 6 |
| 32 | Company Industry Tagging | No industry breakdown | Track success rate by industry (fintech, ecommerce, etc.) | Low | Medium | 6 |
| 33 | Resume Format Reminder | Forget to check ATS compatibility | "Did you check ATS formatting?" before marking Applied | Low | Medium | 6 |
| 34 | Interview Stage Win Rate | Don't know where you lose in interviews | Track: Round 1 pass rate, Round 2 pass rate | Low | High | 7 |
| 35 | Monthly Hunt Recap | No periodic summary | Auto-summary: "In May: 30 apps, 3 interviews, 0 offers. Best source: LinkedIn" | Low | Medium | 6 |
| 36 | Company Research Notes | Prep notes scattered in Notion/Notes | Structured research per company within HuntBoard | Low | Medium | 6 |
| 37 | Offer Deadline Countdown | Offer decisions have deadlines | Prominent countdown on offer cards | Low | High | 7 |
| 38 | Application Speed Distribution | Don't know if rushing hurts quality | Track time from wishlist → applied | Low | Low | 5 |
| 39 | Negotiation Log | No record of negotiation attempts | Track ask, counter, final outcome | Low | Medium | 6 |
| 40 | Interest Level Tagging | All applications treated equally | Tag role interest: Dream / Good / Acceptable / Backup | Low | Medium | 6 |
| 41 | Hunt Archive | Old hunts get messy | Archive entire hunt by date range, start fresh | Low | Medium | 5 |
| 42 | Cover Letter Template Library | Write cover letters from scratch each time | Store and reuse cover letter components | Low | Low | 5 |
| 43 | Feedback From Interviews | Interview feedback rarely captured | Free-text field for any feedback received | Low | High | 7 |
| 44 | LinkedIn Profile Version Tracking | LinkedIn may be outdated when applying | Tag "LinkedIn version at time of apply" | Low | Low | 4 |
| 45 | Ghost Rate by Source | Don't know which sources ghost most | Show ghost rate per source in analytics | Low | Medium | 6 |
| 46 | Duplicate Company Blocker | Apply to same company twice | Warn before adding duplicate company+role | Low | Medium | 6 |
| 47 | Interview-to-Offer Conversion | Know your close rate | Track: X interviews → Y offers (close rate %) | Low | Medium | 6 |
| 48 | Screening Question Logger | Forget what questions were asked | Log pre-application screening questions and your answers | Low | Medium | 5 |
| 49 | "Why I Want This Role" Field | Can't recall why you applied | Short text field, pre-application, feeds interview prep | Low | Medium | 5 |
| 50 | Hunt Cost Tracker | No idea how much job hunting costs | Log: transport, printing, interview attire costs | Low | Low | 3 |

---

## 10. Master Roadmap

### Phase 1 — Critical (Fix the Interview Gap)
*Goal: Get from 0 interviews to first interview*
*Timeline: Build alongside PRD v1.0 features*

**New additions to Phase 1:**

1. **JD Storage field** — Large text area on every application (paste the full JD). Non-negotiable. Every downstream feature depends on this.
2. **Rejection Reason Tagging** — Enum selector when moving to Rejected/Ghosted. 5 minutes to build, extremely valuable data.
3. **Role Fit Score (Manual)** — Reach / Target / Safe + "Did you tailor resume?" Y/N checkbox. Per application.
4. **Follow-Up Log** — Simple table per application: date, method, outcome. Separate from the followUpDate field.
5. **Recruiter Contact Fields** — Name, email, LinkedIn URL. Additional fields on existing application form.
6. **Application Quality Score** — Computed field: JD stored + fit scored + resume tailored + contact stored + portfolio URL = quality %. Display as colored bar on kanban card.
7. **Weekly Action Recommendation Widget** — Dashboard widget with one actionable recommendation. Conditional logic only.
8. **Tailoring Checklist** — 5-item checklist per application shown before marking as Applied.

**These 8 additions directly address why 29 applications generated 0 interviews.**

---

### Phase 2 — Important (Win the Interview)
*Goal: Convert first interview to offer*
*Timeline: After Phase 1 is stable*

1. **STAR Story Bank** — Global repository of behavioral stories tagged by competency
2. **Interview Round Tracker** — Log rounds, dates, interviewers, questions asked, outcome per round
3. **Post-Interview Debrief Form** — Structured reflection after every interview round
4. **JD Keyword Extractor** — Show JD keywords missing from resume text
5. **Resume-JD Match %** — Computed overlap, tracked per application, correlated to outcomes in analytics
6. **Outreach/Cold DM Tracker** — Log cold emails and LinkedIn DMs
7. **Contacts Database** — Persistent contact CRM separate from applications
8. **Hunt Health Score** — Single dashboard score
9. **Application Pacing Heatmap** — GitHub-style activity tracker
10. **Company Research Notes** — Structured notes per company

---

### Phase 3 — Advanced (Optimize the System)
*Goal: Maximize offer rate, negotiate well*
*Timeline: After Phase 2 is stable*

1. **Offer Details Module** — Salary, benefits, start date, bond, deadline
2. **Offer Comparison Table** — Side-by-side if multiple offers
3. **Offer Deadline Countdown** — Prominent on dashboard
4. **Negotiation Log** — Record ask, counter, final
5. **Keyword Gap Report** — Across all rejections, most common missing keywords
6. **Role Level Detection** — ATS-style seniority tagging from JD text
7. **Monthly Hunt Recap** — Auto-generated summary, first of each month
8. **Interview Stage Win Rate** — Track pass rate per interview round
9. **Interview Feedback Capture** — Any feedback received logged
10. **Source ROI (Time-Weighted)** — Time estimate per source × outcomes

---

### Phase 4 — Future Vision (Career OS)
*Goal: Make HuntBoard the permanent career operating layer, not just an active-hunt tool*
*Timeline: After securing a job, build for the next hunt*

1. **Contacts Database (full CRM)** — Every recruiter, hiring manager, peer ever met
2. **Hunt Archive** — Archive this hunt, start a new one. Historical comparison.
3. **Longitudinal Resume Performance** — Resume evolution across multiple hunt cycles
4. **Career Milestone Tracker** — First offer accepted, first promotion, next hunt triggered
5. **Malaysian Salary Intelligence** — Crowdsourced (from your friend group's offer data) salary benchmarks by role/location/company
6. **Company Alumni Network** — Tag which companies your UTM seniors are at (referral opportunities)
7. **Hunt Summary Report** — Auto-generated PDF at hunt close: total apps, timeline, outcome
8. **Browser Extension** — Capture jobs from Jobstreet/LinkedIn without leaving the page

---

## 11. PRD Addendum — New Specs

These are concrete additions to the existing PRD v1.0. Each section below maps to a new section or modification in the PRD.

---

### 11.1 New Database Tables

```typescript
// Follow-up log per application
export const followUpLogs = pgTable('follow_up_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  method: text('method').notNull(), // 'email' | 'linkedin' | 'phone' | 'other'
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  content: text('content'), // what you said (optional)
  responseReceived: boolean('response_received').notNull().default(false),
  responseNote: text('response_note'),
});

// Contacts CRM
export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  namespaceId: uuid('namespace_id').notNull().references(() => namespaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role'),
  company: text('company'),
  email: text('email'),
  linkedinUrl: text('linkedin_url'),
  phone: text('phone'),
  notes: text('notes'),
  source: text('source'), // 'career_fair' | 'linkedin' | 'referral' | 'interview' | 'other'
  metAt: timestamp('met_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// STAR story bank
export const starStories = pgTable('star_stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  namespaceId: uuid('namespace_id').notNull().references(() => namespaces.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),           // e.g. "Led migration at Mattel"
  competency: text('competency').notNull(), // e.g. "Leadership" | "Problem Solving" | "Teamwork"
  situation: text('situation').notNull(),
  task: text('task').notNull(),
  action: text('action').notNull(),
  result: text('result').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Interview rounds
export const interviewRounds = pgTable('interview_rounds', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  roundNumber: integer('round_number').notNull(),
  roundType: text('round_type').notNull(), // 'phone_screen' | 'technical' | 'behavioral' | 'panel' | 'final' | 'offer_call'
  scheduledAt: timestamp('scheduled_at'),
  completedAt: timestamp('completed_at'),
  interviewerName: text('interviewer_name'),
  interviewerRole: text('interviewer_role'),
  format: text('format'), // 'video' | 'phone' | 'onsite'
  questionsAsked: text('questions_asked'), // freetext, line-separated
  notes: text('notes'),
  outcome: text('outcome'), // 'passed' | 'failed' | 'pending' | 'cancelled'
  feedbackReceived: text('feedback_received'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Offer details (extends the application when status = offer)
export const offerDetails = pgTable('offer_details', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }).unique(),
  baseSalaryMonthly: integer('base_salary_monthly'),  // in RM
  bonus: text('bonus'),                               // e.g. "3 months annual" (freetext)
  benefits: text('benefits'),                         // freetext
  equity: text('equity'),                             // freetext
  startDate: timestamp('start_date'),
  bondPeriod: text('bond_period'),                    // e.g. "2 years"
  responseDeadline: timestamp('response_deadline'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

---

### 11.2 New Application Fields (additions to existing `applications` table)

```typescript
// Add to applications table:
jobDescriptionRaw: text('job_description_raw'),      // full JD text (renamed from jobDescription)
fitScore: text('fit_score'),                          // 'reach' | 'target' | 'safe'
interestLevel: text('interest_level'),                // 'dream' | 'good' | 'acceptable' | 'backup'
resumeTailored: boolean('resume_tailored').default(false),
coverLetterUsed: boolean('cover_letter_used').default(false),
portfolioUrl: text('portfolio_url'),
githubUrl: text('github_url'),
appliedVia: text('applied_via'),                      // 'easy_apply' | 'full_form' | 'email' | 'referral'
referredBy: text('referred_by'),                      // contact name
companySize: text('company_size'),                    // 'startup' | 'sme' | 'mnc' | 'glc' | 'government'
industry: text('industry'),                           // 'fintech' | 'ecommerce' | 'logistics' | etc
roleLevel: text('role_level'),                        // 'entry' | 'junior' | 'mid' | 'senior' | 'lead'
rejectionReason: text('rejection_reason'),            // 'ats_filtered' | 'no_response' | 'post_interview' | 'overqualified' | 'undqalified' | 'role_cancelled' | 'salary_mismatch' | 'other'
salaryExpectation: integer('salary_expectation'),     // what you submitted as expected salary (RM/month)
screeningAnswered: boolean('screening_answered'),     // did you fill all screening questions
whyThisRole: text('why_this_role'),                   // short "why I want this" field (feeds interview prep)
companyResearchNotes: text('company_research_notes'), // glassdoor, tech stack, culture
```

---

### 11.3 New Pages / Routes

```
app/
├── interview-prep/
│   └── page.tsx                    # /interview-prep — STAR story bank + interview round tracker
├── contacts/
│   └── page.tsx                    # /contacts — recruiter/contact CRM
├── offers/
│   └── page.tsx                    # /offers — offer details + comparison
└── journal/
    └── page.tsx                    # /journal — daily hunt log
```

---

### 11.4 New Dashboard Widgets

**Widget: Hunt Health Score**
```
HUNT HEALTH
━━━━━━━━━━━━━━━━━━━━━━━
72 / 100
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░

↓ from 78 last week

Weaknesses:
• Follow-up rate: 20%  (target: 60%)
• Application quality: 55%  (target: 80%)
```

Formula (100 pts):
- Response rate × 20 (max 20 pts)
- Interview rate × 20 (max 20 pts)
- Follow-up rate × 20 (max 20 pts; follow-up rate = apps followed up / apps with no response after 7 days)
- Average application quality score × 20 (max 20 pts)
- Activity recency × 20 (max 20 pts; 20 pts if applied this week, decays daily)

**Widget: Weekly Action Recommendation**
```
THIS WEEK'S FOCUS
━━━━━━━━━━━━━━━━━━━━━━━
⚠️  86% of recruiters who opened 
    your applications didn't advance you.

This is almost always a resume issue.

→ Try tailoring your resume to the 
  specific JD for your next 5 applications.

→ Store the JD text in HuntBoard and 
  compare keywords.
```

Logic tree (evaluated in order, first match wins):
1. If interviewRate = 0 AND totalApplications ≥ 20 → resume/tailoring advice
2. If followUpsDueToday ≥ 3 → "You have X overdue follow-ups. Do these before applying more."
3. If avgQualityScore < 60% → "Your average application quality is low. Slow down and tailor."
4. If applicationsThisWeek = 0 → "No applications this week. Your goal was X. Apply today."
5. If interviews > 0 AND interviewRoundsLogged = 0 → "Log your interview notes before you forget."
6. If offer exists AND offerDetails empty → "You have an offer. Record the details and deadline."
7. Default → "You're on track. Keep your follow-up rate up."

---

### 11.5 Updated Application Detail Form (new sections)

The application detail slide-over/page gains two new collapsible sections:

**Section: Application Quality**
```
Application Quality                           Score: 72%  [████████░░]
─────────────────────────────────────────────────────────────────
[✓] JD Stored
[✓] Fit Score Set (Target)
[✓] Resume Tailored
[ ] Portfolio URL Added       ← missing
[✓] Contact/Recruiter Stored
[ ] Why This Role Written     ← missing
```

**Section: Interview Prep** (visible once status ≥ Interview)
```
Interview Prep
─────────────────────────────────────────────────────────────────
Why I Want This Role:
  "NestJS stack matches my PDMS project work..."

Company Research:
  [text area]

Interview Rounds:
  Round 1 — Phone Screen — Jun 14 — HR Sarah — Passed ✓
  Round 2 — Technical   — Jun 18 — Pending
  [+ Add Round]

STAR Stories Assigned:
  [Leadership — Led migration at Mattel]
  [+ Assign Story]
```

---

### 11.6 Analytics Additions

**New Chart: Application Quality Distribution**
- Stacked bar: % of applications with quality score 0–40% (red) / 40–70% (amber) / 70–100% (green)
- Over time (by month)
- Goal: see if quality is improving

**New Chart: Rejection Reason Breakdown**
- Pie chart: ATS Filtered / No Response / Post-Interview / Other
- Helps distinguish "resume problem" from "follow-up problem" from "interview problem"

**New Chart: Interview Stage Conversion**
- Of applications that reached Interview stage:
  - X% passed Round 1
  - Y% passed Round 2
  - Z% received offers
- Separate from pipeline funnel (which shows application → interview conversion)

**New Metric: Average Days to Response**
- Computed: average of `(firstStatusChangeFromApplied.changedAt - appliedDate)` in days
- Show on analytics page and dashboard stats row

**New Metric: Follow-Up Response Rate**
- Of follow-ups logged, what % received a response?
- If > 20%, show: "Following up works for you. Keep doing it."

---

### 11.7 Kanban Card Enhancement

Kanban cards gain two visual indicators:

**Application Quality Dot (left edge of card)**
- Green dot: quality score ≥ 70%
- Amber dot: quality score 40–69%
- Red dot: quality score < 40%
- No dot: quality not yet scored

**Rejection Reason Tag (on Rejected/Ghosted cards only)**
- Small tag: "ATS" / "Ghost" / "Post-Int" / "Salary"
- Helps pattern recognition at a glance

---

*End of HuntBoard Product Analysis v2.0*
*Total new features specified: 50 ideas, 8 Category A, 10 Category B, 10 Category C, 8 Category D*
*New DB tables: 5 (follow_up_logs, contacts, star_stories, interview_rounds, offer_details)*
*New application fields: 14*
*New pages: 4 (interview-prep, contacts, offers, journal)*