import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core"

export const namespaces = pgTable("namespaces", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  pinHash: text("pin_hash"),
  weeklyGoal: integer("weekly_goal").notNull().default(10),
  color: text("color").notNull().default("#6366f1"),
  isPublic: boolean("is_public").notNull().default(false),
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

export const wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  addedByNamespaceId: integer("added_by_namespace_id")
    .notNull()
    .references(() => namespaces.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  role: text("role"),
  location: text("location"),
  priority: text("priority").notNull().default("medium"),
  link: text("link"),
  notes: text("notes"),
  category: text("category"),
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
  createdBy: integer("created_by").references(() => namespaces.id),
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
  category: text("category"),
  wishlistId: integer("wishlist_id").references(() => wishlist.id, { onDelete: "set null" }),
  jobDescriptionRaw: text("job_description_raw"),
  fitScore: text("fit_score"),
  resumeTailored: boolean("resume_tailored").notNull().default(false),
  recruiterName: text("recruiter_name"),
  recruiterEmail: text("recruiter_email"),
  recruiterLinkedinUrl: text("recruiter_linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  rejectionReason: text("rejection_reason"),
  screeningAnswered: boolean("screening_answered").notNull().default(false),
  whyThisRole: text("why_this_role"),
  companyResearchNotes: text("company_research_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const followUpLogs = pgTable("follow_up_logs", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  method: text("method").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  content: text("content"),
  responseReceived: boolean("response_received").notNull().default(false),
  responseNote: text("response_note"),
})

// NEW: Shareable invite links
export const shareLinks = pgTable('share_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  boardId: integer('board_id').notNull().references(() => namespaces.id, { onDelete: 'cascade' }),
  createdBy: integer('created_by').notNull().references(() => namespaces.id), // who made the link
  token: text('token').notNull().unique(),        // 32-char random token
  linkName: text('link_name'),                    // optional label
  
  // Permissions
  permission: text('permission').notNull(),       // 'viewer' | 'contributor' | 'editor'
  
  // Expiration
  expiresAt: timestamp('expires_at', { withTimezone: true }),             // optional expiration
  
  // One-time use
  maxUses: integer('max_uses'),                   // optional: null = unlimited, 1 = one-time
  usedCount: integer('used_count').notNull().default(0),
  
  // Activity tracking
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),             // soft delete
  sharedSections: jsonb('shared_sections').$type<string[]>(),
  requireAccount: boolean('require_account').default(false).notNull(),
});

// NEW: Track who has access via link
export const boardCollaborators = pgTable('board_collaborators', {
  id: uuid('id').defaultRandom().primaryKey(),
  boardId: integer('board_id').notNull().references(() => namespaces.id, { onDelete: 'cascade' }),
  collaboratorNamespaceId: integer('collaborator_namespace_id').notNull().references(() => namespaces.id), // the person who joined
  
  accessMethod: text('access_method').notNull(),  // 'pin' | 'link'
  permission: text('permission').notNull(),       // 'viewer' | 'contributor' | 'editor'
  
  // If joined via link
  joinedViaLinkId: uuid('joined_via_link_id').references(() => shareLinks.id),
  
  // Activity
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),             // soft delete
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),  // track active collaborators
  sharedSections: jsonb('shared_sections').$type<string[]>(),
});

// NEW: Activity log
export const shareActivityLog = pgTable('share_activity_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  boardId: integer('board_id').notNull().references(() => namespaces.id, { onDelete: 'cascade' }),
  actorNamespaceId: integer('actor_namespace_id').references(() => namespaces.id), // who did it
  action: text('action').notNull(),               // 'link_created' | 'link_used' | 'link_revoked' | 'collaborator_removed' | 'permission_changed'
  targetLinkId: uuid('target_link_id').references(() => shareLinks.id),
  targetCollaboratorId: uuid('target_collaborator_id').references(() => boardCollaborators.id),
  details: jsonb('details'),                      // details payload
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Namespace = typeof namespaces.$inferSelect
export type Resume = typeof resumes.$inferSelect
export type Application = typeof applications.$inferSelect
export type WishlistItem = typeof wishlist.$inferSelect
export type FollowUpLog = typeof followUpLogs.$inferSelect
export type ShareLink = typeof shareLinks.$inferSelect
export type BoardCollaborator = typeof boardCollaborators.$inferSelect
export type ShareActivityLog = typeof shareActivityLog.$inferSelect

export const APPLICATION_STATUSES = [
  "wishlist",
  "applied",
  "viewed",
  "interviewing",
  "interview",
  "technical_test",
  "final_interview",
  "offer",
  "accepted",
  "rejected",
  "ghosted",
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const PRIORITIES = ["low", "medium", "high"] as const
export type Priority = (typeof PRIORITIES)[number]
