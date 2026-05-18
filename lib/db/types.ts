import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
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

export type OrganizationRow = InferSelectModel<typeof organizations>;
export type OrganizationInsert = InferInsertModel<typeof organizations>;
export type TeamMemberRow = InferSelectModel<typeof teamMembers>;
export type TeamMemberInsert = InferInsertModel<typeof teamMembers>;
export type CustomerRow = InferSelectModel<typeof customers>;
export type CustomerInsert = InferInsertModel<typeof customers>;
export type ConversationRow = InferSelectModel<typeof conversations>;
export type ConversationInsert = InferInsertModel<typeof conversations>;
export type MessageRow = InferSelectModel<typeof messages>;
export type MessageInsert = InferInsertModel<typeof messages>;
export type AiFollowUpRow = InferSelectModel<typeof aiFollowUps>;
export type AiFollowUpInsert = InferInsertModel<typeof aiFollowUps>;
export type AiMemoryEntryRow = InferSelectModel<typeof aiMemoryEntries>;
export type AiMemoryEntryInsert = InferInsertModel<typeof aiMemoryEntries>;
export type RuntimeIntelligenceLogRow = InferSelectModel<typeof runtimeIntelligenceLogs>;
export type RuntimeIntelligenceLogInsert = InferInsertModel<typeof runtimeIntelligenceLogs>;
export type ModelRoutingLogRow = InferSelectModel<typeof modelRoutingLogs>;
export type ModelRoutingLogInsert = InferInsertModel<typeof modelRoutingLogs>;
export type TokenUsageLogRow = InferSelectModel<typeof tokenUsageLogs>;
export type TokenUsageLogInsert = InferInsertModel<typeof tokenUsageLogs>;
export type CostTrackingEntryRow = InferSelectModel<typeof costTrackingEntries>;
export type CostTrackingEntryInsert = InferInsertModel<typeof costTrackingEntries>;
export type BudgetLimitRow = InferSelectModel<typeof budgetLimits>;
export type BudgetLimitInsert = InferInsertModel<typeof budgetLimits>;
export type AiPerformanceAnalyticsRow = InferSelectModel<typeof aiPerformanceAnalytics>;
export type AiPerformanceAnalyticsInsert = InferInsertModel<typeof aiPerformanceAnalytics>;
export type UserPreferenceRow = InferSelectModel<typeof userPreferences>;
export type UserPreferenceInsert = InferInsertModel<typeof userPreferences>;
export type EscalationEventRow = InferSelectModel<typeof escalationEvents>;
export type EscalationEventInsert = InferInsertModel<typeof escalationEvents>;
