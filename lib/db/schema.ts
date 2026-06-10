import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
} from "drizzle-orm/pg-core"

export const namespaces = pgTable("namespaces", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  pinHash: text("pin_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  namespaceId: integer("namespace_id").notNull(),
  name: text("name").notNull(),
  version: text("version"),
  targetRole: text("target_role"),
  notes: text("notes"),
  link: text("link"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  namespaceId: integer("namespace_id").notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  location: text("location"),
  workMode: text("work_mode"),
  status: text("status").notNull().default("wishlist"),
  priority: text("priority").notNull().default("medium"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  link: text("link"),
  source: text("source"),
  resumeId: integer("resume_id"),
  notes: text("notes"),
  appliedDate: date("applied_date"),
  nextAction: text("next_action"),
  nextActionDate: date("next_action_date"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type Namespace = typeof namespaces.$inferSelect
export type Resume = typeof resumes.$inferSelect
export type Application = typeof applications.$inferSelect

export const APPLICATION_STATUSES = [
  "wishlist",
  "applied",
  "interviewing",
  "offer",
  "rejected",
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const PRIORITIES = ["low", "medium", "high"] as const
export type Priority = (typeof PRIORITIES)[number]
