import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  integer,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  customType,
} from "drizzle-orm/pg-core";

const vector = customType<{ data: number[]; driverData: string; config: { dimensions: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 384})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

const auditColumns = () => ({
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
});

export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "manager",
  "rep",
  "analyst",
  "member",
]);

export const memberStatusEnum = pgEnum("member_status", ["invited", "active", "suspended", "removed"]);
export const customerStageEnum = pgEnum("customer_stage", [
  "lead",
  "qualified",
  "discovery",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
]);
export const conversationStatusEnum = pgEnum("conversation_status", [
  "open",
  "pending_follow_up",
  "closed",
  "archived",
]);
export const messageSenderTypeEnum = pgEnum("message_sender_type", [
  "user",
  "customer",
  "ai",
  "system",
  "integration",
]);
export const messageFormatEnum = pgEnum("message_format", [
  "plain_text",
  "markdown",
  "email_html",
  "json",
]);
export const followUpStatusEnum = pgEnum("follow_up_status", [
  "draft",
  "queued",
  "sent",
  "completed",
  "cancelled",
]);
export const memoryEntryKindEnum = pgEnum("memory_entry_kind", [
  "objection",
  "tone",
  "pricing",
  "stakeholder",
  "security",
  "timeline",
  "preference",
  "summary",
  "strategy",
]);
export const runtimeLogLevelEnum = pgEnum("runtime_log_level", ["debug", "info", "warn", "error"]);
export const escalationSeverityEnum = pgEnum("escalation_severity", ["low", "medium", "high", "critical"]);
export const escalationStatusEnum = pgEnum("escalation_status", ["open", "investigating", "resolved", "dismissed"]);
export const budgetScopeEnum = pgEnum("budget_scope", ["organization", "workspace", "member", "model", "channel"]);
export const analyticsGranularityEnum = pgEnum("analytics_granularity", ["hour", "day", "week", "month"]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("growth"),
  billingStatus: text("billing_status").notNull().default("trialing"),
  timezone: text("timezone").notNull().default("UTC"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdByUserId: text("created_by_user_id"),
  ...auditColumns(),
});

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email"),
    fullName: text("full_name"),
    role: memberRoleEnum("role").notNull().default("member"),
    status: memberStatusEnum("status").notNull().default("invited"),
    title: text("title"),
    avatarUrl: text("avatar_url"),
    invitedAt: timestamp("invited_at", { withTimezone: true, mode: "date" }),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" }),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true, mode: "date" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ...auditColumns(),
  },
  (table) => ({
    organizationMemberUnique: uniqueIndex("team_members_org_clerk_unique").on(table.organizationId, table.clerkUserId),
    organizationEmailUnique: uniqueIndex("team_members_org_email_unique").on(table.organizationId, table.email),
  }),
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    ownerMemberId: uuid("owner_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
    externalId: text("external_id"),
    externalSource: text("external_source"),
    displayName: text("display_name").notNull(),
    companyName: text("company_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    website: text("website"),
    lifecycleStage: customerStageEnum("lifecycle_stage").notNull().default("lead"),
    lifecycleScore: integer("lifecycle_score").notNull().default(0),
    healthScore: integer("health_score").notNull().default(0),
    sentiment: text("sentiment"),
    pricingRisk: text("pricing_risk"),
    annualContractValueCents: bigint("annual_contract_value_cents", { mode: "number" }).notNull().default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ...auditColumns(),
  },
  (table) => ({
    externalLookup: uniqueIndex("customers_org_external_unique").on(table.organizationId, table.externalSource, table.externalId),
    organizationStageIdx: index("customers_org_stage_hint").on(table.organizationId, table.lifecycleStage, table.id),
  }),
);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  assignedMemberId: uuid("assigned_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
  createdByMemberId: uuid("created_by_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
  channel: text("channel").notNull(),
  subject: text("subject"),
  status: conversationStatusEnum("status").notNull().default("open"),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true, mode: "date" }),
  summary: text("summary"),
  tone: text("tone"),
  outcome: text("outcome"),
  source: text("source"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  ...auditColumns(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    senderType: messageSenderTypeEnum("sender_type").notNull(),
    senderMemberId: uuid("sender_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
    senderName: text("sender_name"),
    content: text("content").notNull(),
    contentFormat: messageFormatEnum("content_format").notNull().default("plain_text"),
    sentiment: text("sentiment"),
    modelName: text("model_name"),
    tokenCount: integer("token_count").notNull().default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    ...auditColumns(),
  },
);

export const aiFollowUps = pgTable(
  "ai_follow_ups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
    createdByMemberId: uuid("created_by_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
    assignedMemberId: uuid("assigned_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    rationale: text("rationale"),
    priority: integer("priority").notNull().default(3),
    status: followUpStatusEnum("status").notNull().default("draft"),
    confidence: numeric("confidence", { precision: 5, scale: 4, mode: "number" }).notNull().default(0.8),
    modelName: text("model_name"),
    dueAt: timestamp("due_at", { withTimezone: true, mode: "date" }),
    generatedAt: timestamp("generated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ...auditColumns(),
  },
);

export const aiMemoryEntries = pgTable(
  "ai_memory_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
    messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
    entryKind: memoryEntryKindEnum("entry_kind").notNull(),
    memoryKey: text("memory_key").notNull(),
    memoryValue: text("memory_value"),
    summary: text("summary").notNull(),
    embedding: vector("embedding", { dimensions: 384 }),
    confidence: numeric("confidence", { precision: 5, scale: 4, mode: "number" }).notNull().default(0.8),
    importance: integer("importance").notNull().default(50),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    sourceRefs: jsonb("source_refs").$type<Array<Record<string, unknown>>>().notNull().default(sql`'[]'::jsonb`),
    validFrom: timestamp("valid_from", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    validTo: timestamp("valid_to", { withTimezone: true, mode: "date" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ...auditColumns(),
  },
);

export const runtimeIntelligenceLogs = pgTable("runtime_intelligence_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
  followUpId: uuid("follow_up_id").references(() => aiFollowUps.id, { onDelete: "set null" }),
  requestId: text("request_id").notNull(),
  logLevel: runtimeLogLevelEnum("log_level").notNull().default("info"),
  eventName: text("event_name").notNull(),
  component: text("component").notNull(),
  message: text("message"),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
});

export const modelRoutingLogs = pgTable("model_routing_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
  followUpId: uuid("follow_up_id").references(() => aiFollowUps.id, { onDelete: "set null" }),
  requestId: text("request_id").notNull(),
  provider: text("provider").notNull(),
  selectedModel: text("selected_model").notNull(),
  fallbackModel: text("fallback_model"),
  routingStrategy: text("routing_strategy").notNull(),
  routeReason: text("route_reason"),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  latencyMs: integer("latency_ms").notNull().default(0),
  confidence: numeric("confidence", { precision: 5, scale: 4, mode: "number" }).notNull().default(0.8),
  costCents: integer("cost_cents").notNull().default(0),
  budgetRemainingCents: bigint("budget_remaining_cents", { mode: "number" }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
});

export const tokenUsageLogs = pgTable("token_usage_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
  followUpId: uuid("follow_up_id").references(() => aiFollowUps.id, { onDelete: "set null" }),
  routingLogId: uuid("routing_log_id").references(() => modelRoutingLogs.id, { onDelete: "set null" }),
  provider: text("provider").notNull(),
  modelName: text("model_name").notNull(),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  cachedTokens: integer("cached_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  costCents: integer("cost_cents").notNull().default(0),
  requestLatencyMs: integer("request_latency_ms").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
});

export const budgetLimits = pgTable("budget_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  scope: budgetScopeEnum("scope").notNull().default("organization"),
  scopeKey: text("scope_key"),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  currency: text("currency").notNull().default("USD"),
  hardLimitCents: bigint("hard_limit_cents", { mode: "number" }).notNull(),
  softLimitCents: bigint("soft_limit_cents", { mode: "number" }),
  warnThreshold: numeric("warn_threshold", { precision: 5, scale: 4, mode: "number" }).notNull().default(0.8),
  active: boolean("active").notNull().default(true),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  ...auditColumns(),
}, (table) => ({
  uniqueBudgetWindow: uniqueIndex("budget_limits_unique_window").on(
    table.organizationId,
    table.name,
    table.periodStart,
    table.scope,
    table.scopeKey,
  ),
}));

export const costTrackingEntries = pgTable("cost_tracking_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  tokenUsageLogId: uuid("token_usage_log_id").references(() => tokenUsageLogs.id, { onDelete: "set null" }),
  budgetLimitId: uuid("budget_limit_id").references(() => budgetLimits.id, { onDelete: "set null" }),
  costType: text("cost_type").notNull(),
  currency: text("currency").notNull().default("USD"),
  costCents: bigint("cost_cents", { mode: "number" }).notNull().default(0),
  forecastCents: bigint("forecast_cents", { mode: "number" }).notNull().default(0),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
});

export const aiPerformanceAnalytics = pgTable(
  "ai_performance_analytics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    granularity: analyticsGranularityEnum("granularity").notNull(),
    bucketStart: timestamp("bucket_start", { withTimezone: true, mode: "date" }).notNull(),
    bucketEnd: timestamp("bucket_end", { withTimezone: true, mode: "date" }).notNull(),
    modelName: text("model_name"),
    routingStrategy: text("routing_strategy"),
    conversationsProcessed: integer("conversations_processed").notNull().default(0),
    messagesProcessed: integer("messages_processed").notNull().default(0),
    followUpsGenerated: integer("follow_ups_generated").notNull().default(0),
    memoryEntriesCreated: integer("memory_entries_created").notNull().default(0),
    avgLatencyMs: numeric("avg_latency_ms", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),
    p95LatencyMs: numeric("p95_latency_ms", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),
    avgTokens: numeric("avg_tokens", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),
    totalTokens: bigint("total_tokens", { mode: "number" }).notNull().default(0),
    totalCostCents: bigint("total_cost_cents", { mode: "number" }).notNull().default(0),
    successRate: numeric("success_rate", { precision: 5, scale: 4, mode: "number" }).notNull().default(0),
    escalationRate: numeric("escalation_rate", { precision: 5, scale: 4, mode: "number" }).notNull().default(0),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    ...auditColumns(),
  },
  (table) => ({
    uniqueBucket: uniqueIndex("ai_performance_analytics_unique_bucket").on(
      table.organizationId,
      table.granularity,
      table.bucketStart,
      table.modelName,
      table.routingStrategy,
    ),
  }),
);

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  memberId: uuid("member_id")
    .notNull()
    .references(() => teamMembers.id, { onDelete: "cascade" }),
  preferredTheme: text("preferred_theme").notNull().default("dark"),
  locale: text("locale").notNull().default("en-US"),
  timezone: text("timezone").notNull().default("UTC"),
  notificationSettings: jsonb("notification_settings").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  aiSettings: jsonb("ai_settings").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  dashboardLayout: jsonb("dashboard_layout").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  ...auditColumns(),
}, (table) => ({
  memberUnique: uniqueIndex("user_preferences_member_unique").on(table.memberId),
}));

export const escalationEvents = pgTable("escalation_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
  followUpId: uuid("follow_up_id").references(() => aiFollowUps.id, { onDelete: "set null" }),
  triggeredByMemberId: uuid("triggered_by_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
  assignedToMemberId: uuid("assigned_to_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
  severity: escalationSeverityEnum("severity").notNull(),
  status: escalationStatusEnum("status").notNull().default("open"),
  reason: text("reason").notNull(),
  summary: text("summary").notNull(),
  resolution: text("resolution"),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true, mode: "date" }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "date" }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  ...auditColumns(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(teamMembers),
  customers: many(customers),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
  owner: one(teamMembers, {
    fields: [customers.ownerMemberId],
    references: [teamMembers.id],
  }),
  conversations: many(conversations),
  memoryEntries: many(aiMemoryEntries),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [conversations.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [conversations.customerId],
    references: [customers.id],
  }),
  messages: many(messages),
  followUps: many(aiFollowUps),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [messages.organizationId],
    references: [organizations.id],
  }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  memoryEntries: many(aiMemoryEntries),
  followUpLogs: many(runtimeIntelligenceLogs),
}));

export type Organization = typeof organizations.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type AiFollowUp = typeof aiFollowUps.$inferSelect;
export type AiMemoryEntry = typeof aiMemoryEntries.$inferSelect;
export type RuntimeIntelligenceLog = typeof runtimeIntelligenceLogs.$inferSelect;
export type ModelRoutingLog = typeof modelRoutingLogs.$inferSelect;
export type TokenUsageLog = typeof tokenUsageLogs.$inferSelect;
export type CostTrackingEntry = typeof costTrackingEntries.$inferSelect;
export type BudgetLimit = typeof budgetLimits.$inferSelect;
export type AiPerformanceAnalyticsRow = typeof aiPerformanceAnalytics.$inferSelect;
export type UserPreference = typeof userPreferences.$inferSelect;
export type EscalationEvent = typeof escalationEvents.$inferSelect;
