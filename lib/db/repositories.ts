import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { withRequestScope } from "@/lib/db/context";
import {
  aiFollowUps,
  aiMemoryEntries,
  aiPerformanceAnalytics,
  budgetLimits,
  conversations,
  costTrackingEntries,
  customers,
  escalationEvents,
  messages,
  modelRoutingLogs,
  organizations,
  runtimeIntelligenceLogs,
  teamMembers,
  tokenUsageLogs,
  userPreferences,
} from "@/lib/db/schema";
import type {
  AiFollowUpInsert,
  AiMemoryEntryInsert,
  AiPerformanceAnalyticsInsert,
  BudgetLimitInsert,
  ConversationInsert,
  CostTrackingEntryInsert,
  CustomerInsert,
  EscalationEventInsert,
  MessageInsert,
  ModelRoutingLogInsert,
  OrganizationInsert,
  RuntimeIntelligenceLogInsert,
  TeamMemberInsert,
  TokenUsageLogInsert,
  UserPreferenceInsert,
} from "@/lib/db/types";

export const organizationRepository = {
  async create(data: OrganizationInsert) {
    const db = getDb();
    const [row] = await db.insert(organizations).values(data).returning();
    return row ?? null;
  },
  async findBySlug(slug: string, organizationId?: string) {
    const db = getDb();
    const rows = await db
      .select()
      .from(organizations)
      .where(
        and(
          eq(organizations.slug, slug),
          isNull(organizations.deletedAt),
          organizationId ? eq(organizations.id, organizationId) : sql`true`,
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  },
  async listForUser(userId: string) {
    const db = getDb();
    return db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        plan: organizations.plan,
        billingStatus: organizations.billingStatus,
        timezone: organizations.timezone,
      })
      .from(organizations)
      .innerJoin(teamMembers, eq(teamMembers.organizationId, organizations.id))
      .where(
        and(
          eq(teamMembers.clerkUserId, userId),
          isNull(teamMembers.deletedAt),
          isNull(organizations.deletedAt),
        ),
      )
      .orderBy(desc(organizations.updatedAt));
  },
};

export const teamMemberRepository = {
  async upsert(data: TeamMemberInsert) {
    const db = getDb();
    const [row] = await db
      .insert(teamMembers)
      .values(data)
      .onConflictDoUpdate({
        target: [teamMembers.organizationId, teamMembers.clerkUserId],
        set: {
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          status: data.status,
          title: data.title,
          avatarUrl: data.avatarUrl,
          invitedAt: data.invitedAt,
          joinedAt: data.joinedAt,
          lastActiveAt: data.lastActiveAt,
          metadata: data.metadata,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row ?? null;
  },
};

export const customerRepository = {
  async list(scope: { organizationId: string; userId?: string }) {
    return withRequestScope(scope, async (db) => {
      return db
        .select()
        .from(customers)
        .where(and(eq(customers.organizationId, scope.organizationId), isNull(customers.deletedAt)))
        .orderBy(desc(customers.updatedAt));
    });
  },
  async getById(scope: { organizationId: string; userId?: string }, customerId: string) {
    return withRequestScope(scope, async (db) => {
      const rows = await db
        .select()
        .from(customers)
        .where(and(eq(customers.organizationId, scope.organizationId), eq(customers.id, customerId), isNull(customers.deletedAt)))
        .limit(1);
      return rows[0] ?? null;
    });
  },
  async upsert(data: CustomerInsert) {
    const db = getDb();
    const [row] = await db
      .insert(customers)
      .values(data)
      .onConflictDoUpdate({
        target: [customers.organizationId, customers.externalSource, customers.externalId],
        set: {
          ownerMemberId: data.ownerMemberId,
          displayName: data.displayName,
          companyName: data.companyName,
          email: data.email,
          phone: data.phone,
          website: data.website,
          lifecycleStage: data.lifecycleStage,
          lifecycleScore: data.lifecycleScore,
          healthScore: data.healthScore,
          sentiment: data.sentiment,
          pricingRisk: data.pricingRisk,
          annualContractValueCents: data.annualContractValueCents,
          metadata: data.metadata,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row ?? null;
  },
  async archive(scope: { organizationId: string; userId?: string }, customerId: string) {
    return withRequestScope(scope, async (db) => {
      const [row] = await db
        .update(customers)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(customers.organizationId, scope.organizationId), eq(customers.id, customerId), isNull(customers.deletedAt)))
        .returning();
      return row ?? null;
    });
  },
};

export const conversationRepository = {
  async listByCustomer(scope: { organizationId: string; userId?: string }, customerId: string) {
    return withRequestScope(scope, async (db) => {
      return db
        .select()
        .from(conversations)
        .where(and(eq(conversations.organizationId, scope.organizationId), eq(conversations.customerId, customerId), isNull(conversations.deletedAt)))
        .orderBy(desc(conversations.startedAt));
    });
  },
  async create(data: ConversationInsert) {
    const db = getDb();
    const [row] = await db.insert(conversations).values(data).returning();
    return row ?? null;
  },
  async addMessage(data: MessageInsert) {
    const db = getDb();
    const [row] = await db.insert(messages).values(data).returning();
    return row ?? null;
  },
  async listMessages(scope: { organizationId: string; userId?: string }, conversationId: string) {
    return withRequestScope(scope, async (db) => {
      return db
        .select()
        .from(messages)
        .where(and(eq(messages.organizationId, scope.organizationId), eq(messages.conversationId, conversationId), isNull(messages.deletedAt)))
        .orderBy(desc(messages.occurredAt));
    });
  },
};

export const intelligenceRepository = {
  async createFollowUp(data: AiFollowUpInsert) {
    const db = getDb();
    const [row] = await db.insert(aiFollowUps).values(data).returning();
    return row ?? null;
  },
  async createMemoryEntry(data: AiMemoryEntryInsert) {
    const db = getDb();
    const [row] = await db.insert(aiMemoryEntries).values(data).returning();
    return row ?? null;
  },
  async recordRuntimeLog(data: RuntimeIntelligenceLogInsert) {
    const db = getDb();
    const [row] = await db.insert(runtimeIntelligenceLogs).values(data).returning();
    return row ?? null;
  },
  async recordRouting(data: ModelRoutingLogInsert) {
    const db = getDb();
    const [row] = await db.insert(modelRoutingLogs).values(data).returning();
    return row ?? null;
  },
  async recordTokenUsage(data: TokenUsageLogInsert) {
    const db = getDb();
    const [row] = await db.insert(tokenUsageLogs).values(data).returning();
    return row ?? null;
  },
  async recordCost(data: CostTrackingEntryInsert) {
    const db = getDb();
    const [row] = await db.insert(costTrackingEntries).values(data).returning();
    return row ?? null;
  },
  async createEscalation(data: EscalationEventInsert) {
    const db = getDb();
    const [row] = await db.insert(escalationEvents).values(data).returning();
    return row ?? null;
  },
  async resolveEscalation(scope: { organizationId: string; userId?: string }, escalationId: string, resolution: string) {
    return withRequestScope(scope, async (db) => {
      const [row] = await db
        .update(escalationEvents)
        .set({
          status: "resolved",
          resolution,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(escalationEvents.organizationId, scope.organizationId), eq(escalationEvents.id, escalationId), isNull(escalationEvents.deletedAt)))
        .returning();
      return row ?? null;
    });
  },
};

export const analyticsRepository = {
  async upsertPerformanceSnapshot(data: AiPerformanceAnalyticsInsert) {
    const db = getDb();
    const [row] = await db
      .insert(aiPerformanceAnalytics)
      .values(data)
      .onConflictDoUpdate({
        target: [
          aiPerformanceAnalytics.organizationId,
          aiPerformanceAnalytics.granularity,
          aiPerformanceAnalytics.bucketStart,
          aiPerformanceAnalytics.modelName,
          aiPerformanceAnalytics.routingStrategy,
        ],
        set: {
          conversationsProcessed: data.conversationsProcessed,
          messagesProcessed: data.messagesProcessed,
          followUpsGenerated: data.followUpsGenerated,
          memoryEntriesCreated: data.memoryEntriesCreated,
          avgLatencyMs: data.avgLatencyMs,
          p95LatencyMs: data.p95LatencyMs,
          avgTokens: data.avgTokens,
          totalTokens: data.totalTokens,
          totalCostCents: data.totalCostCents,
          successRate: data.successRate,
          escalationRate: data.escalationRate,
          metadata: data.metadata,
          bucketEnd: data.bucketEnd,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row ?? null;
  },
  async listPerformanceByDay(scope: { organizationId: string; userId?: string }) {
    return withRequestScope(scope, async (db) => {
      return db
        .select()
        .from(aiPerformanceAnalytics)
        .where(and(eq(aiPerformanceAnalytics.organizationId, scope.organizationId), isNull(aiPerformanceAnalytics.deletedAt)))
        .orderBy(desc(aiPerformanceAnalytics.bucketStart));
    });
  },
  async listBudgetLimits(scope: { organizationId: string; userId?: string }) {
    return withRequestScope(scope, async (db) => {
      return db
        .select()
        .from(budgetLimits)
        .where(and(eq(budgetLimits.organizationId, scope.organizationId), isNull(budgetLimits.deletedAt)))
        .orderBy(desc(budgetLimits.periodStart));
    });
  },
};

export const settingsRepository = {
  async getPreference(scope: { organizationId: string; userId?: string }, memberId: string) {
    return withRequestScope(scope, async (db) => {
      const rows = await db
        .select()
        .from(userPreferences)
        .where(and(eq(userPreferences.organizationId, scope.organizationId), eq(userPreferences.memberId, memberId), isNull(userPreferences.deletedAt)))
        .limit(1);
      return rows[0] ?? null;
    });
  },
  async upsertPreference(data: UserPreferenceInsert) {
    const db = getDb();
    const [row] = await db
      .insert(userPreferences)
      .values(data)
      .onConflictDoUpdate({
        target: [userPreferences.memberId],
        set: {
          preferredTheme: data.preferredTheme,
          locale: data.locale,
          timezone: data.timezone,
          notificationSettings: data.notificationSettings,
          aiSettings: data.aiSettings,
          dashboardLayout: data.dashboardLayout,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row ?? null;
  },
  async upsertBudgetLimit(data: BudgetLimitInsert) {
    const db = getDb();
    const [row] = await db
      .insert(budgetLimits)
      .values(data)
      .onConflictDoUpdate({
        target: [budgetLimits.organizationId, budgetLimits.name, budgetLimits.periodStart, budgetLimits.scope, budgetLimits.scopeKey],
        set: {
          hardLimitCents: data.hardLimitCents,
          softLimitCents: data.softLimitCents,
          warnThreshold: data.warnThreshold,
          active: data.active,
          metadata: data.metadata,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row ?? null;
  },
};

export const repositorySet = {
  organizationRepository,
  teamMemberRepository,
  customerRepository,
  conversationRepository,
  intelligenceRepository,
  analyticsRepository,
  settingsRepository,
};
