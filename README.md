# HuntBoard

HuntBoard is a state-of-the-art SWE Job Application Tracker designed to help candidates organize their applications, resumes, and interview pipelines in one clean, privacy-oriented space.

## Features

- **Pipeline Board & List Views**: Manage your interview stages ("Wishlist", "Applied", "Interviewing", "Offer", "Rejected") in a Trello-like kanban board or a tabular spreadsheet layout.
- **Multiple Resume Tracking**: Keep track of different versions of your resume and see which one was used for which role.
- **Batch JSON Import**: Import dozens of roles simultaneously with a simple JSON copy-paste interface that handles automatic formatting and live client-side schema validation.
- **Stateful Authentication**: Private, secure board access based on simple namespace authentication.

---

## Getting Started

### Development Commands

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Run Dev Server**:
   ```bash
   pnpm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Build for Production**:
   ```bash
   pnpm run build
   ```

---

## Database Management (Drizzle ORM & Neon)

This project uses **Drizzle ORM** with a **Neon PostgreSQL** database.

- **Push Schema changes to Neon**:
   ```bash
   pnpm run db:push
   ```
- **Open Drizzle Studio (DB Viewer)**:
   ```bash
   pnpm run db:studio
   ```

---

## Batch Import via JSON

You can batch import multiple job applications at once using the **Import JSON** dialog on your dashboard.

### Required Fields
- `company` (string, required): The company name.
- `role` (string, required): The job title / role.

### Optional Fields
- `location` (string): Location (e.g. "San Francisco, CA").
- `workMode` (string): e.g. "hybrid", "remote", "onsite".
- `status` (string): Options are `wishlist`, `applied`, `interviewing`, `offer`, `rejected`. Defaults to `wishlist`.
- `priority` (string): Options are `low`, `medium`, `high`. Defaults to `medium`.
- `salaryMin` (number): The minimum salary range (e.g. 100000).
- `salaryMax` (number): The maximum salary range (e.g. 140000).
- `link` (string): URL to the job description page.
- `source` (string): e.g. "LinkedIn", "Referral", "Indeed".
- `notes` (string): Extra details, notes or comments.
- `appliedDate` (string): Format `YYYY-MM-DD`.
- `nextAction` (string): e.g. "Send follow up email".
- `nextActionDate` (string): Format `YYYY-MM-DD`.

### Example Payload
```json
[
  {
    "company": "Google",
    "role": "Software Engineer",
    "location": "Mountain View, CA",
    "workMode": "hybrid",
    "status": "applied",
    "priority": "high",
    "salaryMin": 150000,
    "salaryMax": 200000,
    "link": "https://google.com/jobs",
    "source": "LinkedIn",
    "notes": "Referred by John Doe",
    "appliedDate": "2026-06-10",
    "nextAction": "Follow up",
    "nextActionDate": "2026-06-17"
  },
  {
    "company": "Stripe",
    "role": "Backend Engineer",
    "status": "wishlist",
    "priority": "medium"
  }
]
```

---

## Wishlist Batch Import via JSON

You can batch import jobs directly into your **Wishlist** board by clicking the **Import JSON** button on the Wishlist page.

### Required Fields
- `company` (string, required): The company name. Also accepts `Company` or `company_name`.

### Optional Fields
- `role` (string): Job title / role. Also accepts `Role`, `title`, or `position`.
- `location` (string): Job location. Also accepts `Location`.
- `priority` (string): Options are `"low" | "medium" | "high"`. Defaults to `"medium"`. Also accepts `Priority`.
- `link` (string): URL link to the job post. Also accepts `Link` or `url`.
- `notes` (string): Any comments/notes. Also accepts `Notes`.

### Example Wishlist Payload
```json
[
  {
    "company": "Netflix",
    "role": "Frontend Architect",
    "location": "Los Gatos, CA",
    "priority": "high",
    "link": "https://netflix.com/jobs/123",
    "notes": "Need to brush up on canvas performance optimization."
  },
  {
    "company": "Linear",
    "role": "Product Engineer",
    "priority": "medium"
  }
]
```

