CREATE TYPE "public"."analytics_granularity" AS ENUM('hour', 'day', 'week', 'month');--> statement-breakpoint
CREATE TYPE "public"."budget_scope" AS ENUM('organization', 'workspace', 'member', 'model', 'channel');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('open', 'pending_follow_up', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."customer_stage" AS ENUM('lead', 'qualified', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost');--> statement-breakpoint
CREATE TYPE "public"."escalation_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."escalation_status" AS ENUM('open', 'investigating', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."follow_up_status" AS ENUM('draft', 'queued', 'sent', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'manager', 'rep', 'analyst', 'member');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('invited', 'active', 'suspended', 'removed');--> statement-breakpoint
CREATE TYPE "public"."memory_entry_kind" AS ENUM('objection', 'tone', 'pricing', 'stakeholder', 'security', 'timeline', 'preference', 'summary', 'strategy');--> statement-breakpoint
CREATE TYPE "public"."message_format" AS ENUM('plain_text', 'markdown', 'email_html', 'json');--> statement-breakpoint
CREATE TYPE "public"."message_sender_type" AS ENUM('user', 'customer', 'ai', 'system', 'integration');--> statement-breakpoint
CREATE TYPE "public"."runtime_log_level" AS ENUM('debug', 'info', 'warn', 'error');--> statement-breakpoint
CREATE TABLE "ai_follow_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"message_id" uuid,
	"created_by_member_id" uuid,
	"assigned_member_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"rationale" text,
	"priority" integer DEFAULT 3 NOT NULL,
	"status" "follow_up_status" DEFAULT 'draft' NOT NULL,
	"confidence" numeric(5, 4) DEFAULT 0.8 NOT NULL,
	"model_name" text,
	"due_at" timestamp with time zone,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ai_memory_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid,
	"conversation_id" uuid,
	"message_id" uuid,
	"entry_kind" "memory_entry_kind" NOT NULL,
	"memory_key" text NOT NULL,
	"memory_value" text,
	"summary" text NOT NULL,
	"embedding" vector(384),
	"confidence" numeric(5, 4) DEFAULT 0.8 NOT NULL,
	"importance" integer DEFAULT 50 NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"source_refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_to" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ai_performance_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"granularity" "analytics_granularity" NOT NULL,
	"bucket_start" timestamp with time zone NOT NULL,
	"bucket_end" timestamp with time zone NOT NULL,
	"model_name" text,
	"routing_strategy" text,
	"conversations_processed" integer DEFAULT 0 NOT NULL,
	"messages_processed" integer DEFAULT 0 NOT NULL,
	"follow_ups_generated" integer DEFAULT 0 NOT NULL,
	"memory_entries_created" integer DEFAULT 0 NOT NULL,
	"avg_latency_ms" numeric(12, 2) DEFAULT 0 NOT NULL,
	"p95_latency_ms" numeric(12, 2) DEFAULT 0 NOT NULL,
	"avg_tokens" numeric(12, 2) DEFAULT 0 NOT NULL,
	"total_tokens" bigint DEFAULT 0 NOT NULL,
	"total_cost_cents" bigint DEFAULT 0 NOT NULL,
	"success_rate" numeric(5, 4) DEFAULT 0 NOT NULL,
	"escalation_rate" numeric(5, 4) DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "budget_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"scope" "budget_scope" DEFAULT 'organization' NOT NULL,
	"scope_key" text,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"hard_limit_cents" bigint NOT NULL,
	"soft_limit_cents" bigint,
	"warn_threshold" numeric(5, 4) DEFAULT 0.8 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"assigned_member_id" uuid,
	"created_by_member_id" uuid,
	"channel" text NOT NULL,
	"subject" text,
	"status" "conversation_status" DEFAULT 'open' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"summary" text,
	"tone" text,
	"outcome" text,
	"source" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cost_tracking_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"token_usage_log_id" uuid,
	"budget_limit_id" uuid,
	"cost_type" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"cost_cents" bigint DEFAULT 0 NOT NULL,
	"forecast_cents" bigint DEFAULT 0 NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"owner_member_id" uuid,
	"external_id" text,
	"external_source" text,
	"display_name" text NOT NULL,
	"company_name" text NOT NULL,
	"email" text,
	"phone" text,
	"website" text,
	"lifecycle_stage" "customer_stage" DEFAULT 'lead' NOT NULL,
	"lifecycle_score" integer DEFAULT 0 NOT NULL,
	"health_score" integer DEFAULT 0 NOT NULL,
	"sentiment" text,
	"pricing_risk" text,
	"annual_contract_value_cents" bigint DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "escalation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid,
	"conversation_id" uuid,
	"message_id" uuid,
	"follow_up_id" uuid,
	"triggered_by_member_id" uuid,
	"assigned_to_member_id" uuid,
	"severity" "escalation_severity" NOT NULL,
	"status" "escalation_status" DEFAULT 'open' NOT NULL,
	"reason" text NOT NULL,
	"summary" text NOT NULL,
	"resolution" text,
	"acknowledged_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"customer_id" uuid,
	"sender_type" "message_sender_type" NOT NULL,
	"sender_member_id" uuid,
	"sender_name" text,
	"content" text NOT NULL,
	"content_format" "message_format" DEFAULT 'plain_text' NOT NULL,
	"sentiment" text,
	"model_name" text,
	"token_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "model_routing_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"conversation_id" uuid,
	"message_id" uuid,
	"follow_up_id" uuid,
	"request_id" text NOT NULL,
	"provider" text NOT NULL,
	"selected_model" text NOT NULL,
	"fallback_model" text,
	"routing_strategy" text NOT NULL,
	"route_reason" text,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"confidence" numeric(5, 4) DEFAULT 0.8 NOT NULL,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"budget_remaining_cents" bigint,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"plan" text DEFAULT 'growth' NOT NULL,
	"billing_status" text DEFAULT 'trialing' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "runtime_intelligence_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"conversation_id" uuid,
	"message_id" uuid,
	"follow_up_id" uuid,
	"request_id" text NOT NULL,
	"log_level" "runtime_log_level" DEFAULT 'info' NOT NULL,
	"event_name" text NOT NULL,
	"component" text NOT NULL,
	"message" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text,
	"full_name" text,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"status" "member_status" DEFAULT 'invited' NOT NULL,
	"title" text,
	"avatar_url" text,
	"invited_at" timestamp with time zone,
	"joined_at" timestamp with time zone,
	"last_active_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "token_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"conversation_id" uuid,
	"message_id" uuid,
	"follow_up_id" uuid,
	"routing_log_id" uuid,
	"provider" text NOT NULL,
	"model_name" text NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"cached_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"request_latency_ms" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"preferred_theme" text DEFAULT 'dark' NOT NULL,
	"locale" text DEFAULT 'en-US' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"notification_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dashboard_layout" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ai_follow_ups" ADD CONSTRAINT "ai_follow_ups_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_follow_ups" ADD CONSTRAINT "ai_follow_ups_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_follow_ups" ADD CONSTRAINT "ai_follow_ups_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_follow_ups" ADD CONSTRAINT "ai_follow_ups_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_follow_ups" ADD CONSTRAINT "ai_follow_ups_created_by_member_id_team_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_follow_ups" ADD CONSTRAINT "ai_follow_ups_assigned_member_id_team_members_id_fk" FOREIGN KEY ("assigned_member_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_memory_entries" ADD CONSTRAINT "ai_memory_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_memory_entries" ADD CONSTRAINT "ai_memory_entries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_memory_entries" ADD CONSTRAINT "ai_memory_entries_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_memory_entries" ADD CONSTRAINT "ai_memory_entries_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_performance_analytics" ADD CONSTRAINT "ai_performance_analytics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_limits" ADD CONSTRAINT "budget_limits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_member_id_team_members_id_fk" FOREIGN KEY ("assigned_member_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_member_id_team_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_tracking_entries" ADD CONSTRAINT "cost_tracking_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_tracking_entries" ADD CONSTRAINT "cost_tracking_entries_token_usage_log_id_token_usage_logs_id_fk" FOREIGN KEY ("token_usage_log_id") REFERENCES "public"."token_usage_logs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_tracking_entries" ADD CONSTRAINT "cost_tracking_entries_budget_limit_id_budget_limits_id_fk" FOREIGN KEY ("budget_limit_id") REFERENCES "public"."budget_limits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_owner_member_id_team_members_id_fk" FOREIGN KEY ("owner_member_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_events" ADD CONSTRAINT "escalation_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_events" ADD CONSTRAINT "escalation_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_events" ADD CONSTRAINT "escalation_events_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_events" ADD CONSTRAINT "escalation_events_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_events" ADD CONSTRAINT "escalation_events_follow_up_id_ai_follow_ups_id_fk" FOREIGN KEY ("follow_up_id") REFERENCES "public"."ai_follow_ups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_events" ADD CONSTRAINT "escalation_events_triggered_by_member_id_team_members_id_fk" FOREIGN KEY ("triggered_by_member_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_events" ADD CONSTRAINT "escalation_events_assigned_to_member_id_team_members_id_fk" FOREIGN KEY ("assigned_to_member_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_member_id_team_members_id_fk" FOREIGN KEY ("sender_member_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_routing_logs" ADD CONSTRAINT "model_routing_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_routing_logs" ADD CONSTRAINT "model_routing_logs_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_routing_logs" ADD CONSTRAINT "model_routing_logs_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_routing_logs" ADD CONSTRAINT "model_routing_logs_follow_up_id_ai_follow_ups_id_fk" FOREIGN KEY ("follow_up_id") REFERENCES "public"."ai_follow_ups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_intelligence_logs" ADD CONSTRAINT "runtime_intelligence_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_intelligence_logs" ADD CONSTRAINT "runtime_intelligence_logs_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_intelligence_logs" ADD CONSTRAINT "runtime_intelligence_logs_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_intelligence_logs" ADD CONSTRAINT "runtime_intelligence_logs_follow_up_id_ai_follow_ups_id_fk" FOREIGN KEY ("follow_up_id") REFERENCES "public"."ai_follow_ups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD CONSTRAINT "token_usage_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD CONSTRAINT "token_usage_logs_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD CONSTRAINT "token_usage_logs_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD CONSTRAINT "token_usage_logs_follow_up_id_ai_follow_ups_id_fk" FOREIGN KEY ("follow_up_id") REFERENCES "public"."ai_follow_ups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage_logs" ADD CONSTRAINT "token_usage_logs_routing_log_id_model_routing_logs_id_fk" FOREIGN KEY ("routing_log_id") REFERENCES "public"."model_routing_logs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_member_id_team_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_performance_analytics_unique_bucket" ON "ai_performance_analytics" USING btree ("organization_id","granularity","bucket_start","model_name","routing_strategy");--> statement-breakpoint
CREATE UNIQUE INDEX "budget_limits_unique_window" ON "budget_limits" USING btree ("organization_id","name","period_start","scope","scope_key");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_org_external_unique" ON "customers" USING btree ("organization_id","external_source","external_id");--> statement-breakpoint
CREATE INDEX "customers_org_stage_hint" ON "customers" USING btree ("organization_id","lifecycle_stage","id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_org_clerk_unique" ON "team_members" USING btree ("organization_id","clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_org_email_unique" ON "team_members" USING btree ("organization_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "user_preferences_member_unique" ON "user_preferences" USING btree ("member_id");