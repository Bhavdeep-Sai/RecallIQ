insert into public.organizations (id, slug, name, plan, billing_status, timezone, metadata, created_by_user_id)
values
  ('11111111-1111-1111-1111-111111111111', 'recalliq', 'RecallIQ', 'growth', 'trialing', 'UTC', '{"industry":"sales-intelligence"}', 'user_001')
on conflict (id) do nothing;

insert into public.team_members (id, organization_id, clerk_user_id, email, full_name, role, status, title, invited_at, joined_at, last_active_at, metadata)
values
  ('21111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'user_001', 'founder@recalliq.ai', 'Ava Chen', 'owner', 'active', 'Founder', now() - interval '30 days', now() - interval '29 days', now() - interval '3 minutes', '{"timezone":"UTC"}'),
  ('21111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'user_002', 'sales@recalliq.ai', 'Noah Patel', 'manager', 'active', 'Sales Director', now() - interval '30 days', now() - interval '29 days', now() - interval '8 minutes', '{"timezone":"UTC"}')
on conflict (organization_id, clerk_user_id) do nothing;

insert into public.budget_limits (id, organization_id, name, scope, scope_key, period_start, period_end, currency, hard_limit_cents, soft_limit_cents, warn_threshold, active, metadata)
values
  ('31111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Monthly AI spend', 'organization', null, date_trunc('month', now())::date, (date_trunc('month', now()) + interval '1 month - 1 day')::date, 'USD', 1800000, 1500000, 0.8000, true, '{"policy":"default"}')
on conflict (id) do nothing;

insert into public.customers (id, organization_id, owner_member_id, external_id, external_source, display_name, company_name, email, phone, website, lifecycle_stage, lifecycle_score, health_score, sentiment, pricing_risk, annual_contract_value_cents, metadata)
values
  ('41111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '21111111-1111-1111-1111-111111111111', 'crm_cust_001', 'hubspot', 'Nadia Stone', 'Northstar Labs', 'nadia@northstar.example', '+1-212-555-0148', 'https://northstar.example', 'proposal', 91, 91, 'Positive and engaged', 'medium', 12800000, '{"segment":"enterprise"}'),
  ('41111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', '21111111-1111-1111-1111-111111111112', 'crm_cust_002', 'hubspot', 'Marcus Lee', 'Apex Logistics', 'marcus@apex.example', '+1-646-555-0199', 'https://apex.example', 'negotiation', 74, 74, 'Concerned about pricing', 'high', 8600000, '{"segment":"mid-market"}')
on conflict (id) do nothing;

insert into public.conversations (id, organization_id, customer_id, assigned_member_id, created_by_member_id, channel, subject, status, started_at, ended_at, summary, tone, outcome, source, metadata)
values
  ('51111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '41111111-1111-1111-1111-111111111111', '21111111-1111-1111-1111-111111111111', '21111111-1111-1111-1111-111111111111', 'meeting', 'Q2 rollout planning', 'open', now() - interval '2 days', null, 'Rollout plan confirmed with support SLA requirements.', 'positive', 'Implementation path approved', 'salesforce', '{"meeting_type":"executive"}'),
  ('51111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', '41111111-1111-1111-1111-111111111112', '21111111-1111-1111-1111-111111111112', '21111111-1111-1111-1111-111111111112', 'call', 'Pricing objection handling', 'pending_follow_up', now() - interval '1 day', null, 'Pricing objection raised again; requested ROI framing.', 'price_sensitive', 'Awaiting finance review', 'gmail', '{"call_recording":true}')
on conflict (id) do nothing;

insert into public.messages (id, organization_id, conversation_id, customer_id, sender_type, sender_member_id, sender_name, content, content_format, sentiment, model_name, token_count, metadata, occurred_at)
values
  ('61111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '51111111-1111-1111-1111-111111111111', '41111111-1111-1111-1111-111111111111', 'customer', null, 'Nadia Stone', 'We need the support SLAs documented before procurement signs off.', 'plain_text', 'guarded', null, 21, '{"channel":"meeting"}', now() - interval '2 days' + interval '5 minutes'),
  ('61111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', '51111111-1111-1111-1111-111111111111', '41111111-1111-1111-1111-111111111111', 'user', '21111111-1111-1111-1111-111111111111', 'Ava Chen', 'Absolutely. I will send a phased rollout plan and shared success criteria.', 'plain_text', 'positive', 'gpt-4.1-mini', 26, '{"channel":"meeting"}', now() - interval '2 days' + interval '7 minutes'),
  ('61111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', '51111111-1111-1111-1111-111111111112', '41111111-1111-1111-1111-111111111112', 'customer', null, 'Marcus Lee', 'Can you justify the enterprise price with hard savings?', 'plain_text', 'price_sensitive', null, 18, '{"channel":"call"}', now() - interval '1 day' + interval '12 minutes')
on conflict (id) do nothing;

insert into public.ai_follow_ups (id, organization_id, conversation_id, customer_id, message_id, created_by_member_id, assigned_member_id, title, body, rationale, priority, status, confidence, model_name, due_at, generated_at, metadata)
values
  ('71111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '51111111-1111-1111-1111-111111111111', '41111111-1111-1111-1111-111111111111', '61111111-1111-1111-1111-111111111112', '21111111-1111-1111-1111-111111111111', '21111111-1111-1111-1111-111111111111', 'Send rollout plan', 'Share a phased rollout plan with support SLAs and success criteria.', 'Matches the customer’s implementation concern and keeps momentum high.', 2, 'queued', 0.9420, 'gpt-4.1-mini', now() + interval '1 day', now() - interval '1 hour', '{"source":"meeting"}'),
  ('71111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', '51111111-1111-1111-1111-111111111112', '41111111-1111-1111-1111-111111111112', '61111111-1111-1111-1111-111111111113', '21111111-1111-1111-1111-111111111112', '21111111-1111-1111-1111-111111111112', 'Prepare ROI proof', 'Build an ROI analysis with comparable savings benchmarks and payment-term options.', 'Directly addresses price sensitivity and keeps the negotiation alive.', 1, 'queued', 0.9010, 'claude-3.7-sonnet', now() + interval '12 hours', now() - interval '45 minutes', '{"source":"call"}')
on conflict (id) do nothing;

insert into public.ai_memory_entries (id, organization_id, customer_id, conversation_id, message_id, entry_kind, memory_key, memory_value, summary, confidence, importance, tags, source_refs, valid_from, metadata)
values
  ('81111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '41111111-1111-1111-1111-111111111111', '51111111-1111-1111-1111-111111111111', '61111111-1111-1111-1111-111111111111', 'timeline', 'northstar_rollout', 'Requires phased rollout with support SLAs.', 'Customer wants a phased rollout plan before procurement', 0.9600, 90, '{"implementation","timeline"}', '[{"source":"message","id":"61111111-1111-1111-1111-111111111111"}]'::jsonb, now() - interval '2 days', '{"origin":"conversation"}'),
  ('81111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', '41111111-1111-1111-1111-111111111112', '51111111-1111-1111-1111-111111111112', '61111111-1111-1111-1111-111111111113', 'pricing', 'apex_pricing', 'Prefers hard savings and payment-term flexibility.', 'Price sensitivity is the dominant objection', 0.9300, 95, '{"pricing","roi"}', '[{"source":"message","id":"61111111-1111-1111-1111-111111111113"}]'::jsonb, now() - interval '1 day', '{"origin":"conversation"}')
on conflict (id) do nothing;

insert into public.model_routing_logs (id, organization_id, conversation_id, message_id, follow_up_id, request_id, provider, selected_model, fallback_model, routing_strategy, route_reason, input_tokens, output_tokens, total_tokens, latency_ms, confidence, cost_cents, budget_remaining_cents, metadata)
values
  ('91111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '51111111-1111-1111-1111-111111111111', '61111111-1111-1111-1111-111111111112', '71111111-1111-1111-1111-111111111111', 'req_001', 'openai', 'gpt-4.1-mini', 'gpt-4.1', 'memory_aware_route', 'Low-risk follow-up routed to fast model', 402, 128, 530, 214, 0.9420, 18, 1782000, '{"budget_guard":"soft"}'),
  ('91111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', '51111111-1111-1111-1111-111111111112', '61111111-1111-1111-1111-111111111113', '71111111-1111-1111-1111-111111111112', 'req_002', 'anthropic', 'claude-3.7-sonnet', 'claude-3.5-haiku', 'pricing_objection_route', 'Cost-sensitive negotiation escalated to higher quality model', 512, 221, 733, 284, 0.9010, 34, 1768000, '{"budget_guard":"soft"}')
on conflict (id) do nothing;

insert into public.token_usage_logs (id, organization_id, conversation_id, message_id, follow_up_id, routing_log_id, provider, model_name, prompt_tokens, completion_tokens, cached_tokens, total_tokens, cost_cents, request_latency_ms)
values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '51111111-1111-1111-1111-111111111111', '61111111-1111-1111-1111-111111111112', '71111111-1111-1111-1111-111111111111', '91111111-1111-1111-1111-111111111111', 'openai', 'gpt-4.1-mini', 402, 128, 32, 530, 18, 214),
  ('a1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', '51111111-1111-1111-1111-111111111112', '61111111-1111-1111-1111-111111111113', '71111111-1111-1111-1111-111111111112', '91111111-1111-1111-1111-111111111112', 'anthropic', 'claude-3.7-sonnet', 512, 221, 44, 733, 34, 284)
on conflict (id) do nothing;

insert into public.cost_tracking_entries (id, organization_id, token_usage_log_id, budget_limit_id, cost_type, currency, cost_cents, forecast_cents, period_start, period_end, metadata)
values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '31111111-1111-1111-1111-111111111111', 'inference', 'USD', 18, 19, date_trunc('month', now())::date, (date_trunc('month', now()) + interval '1 month - 1 day')::date, '{"category":"sales_follow_up"}'),
  ('b1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111112', '31111111-1111-1111-1111-111111111111', 'inference', 'USD', 34, 37, date_trunc('month', now())::date, (date_trunc('month', now()) + interval '1 month - 1 day')::date, '{"category":"pricing_analysis"}')
on conflict (id) do nothing;

insert into public.ai_performance_analytics (id, organization_id, granularity, bucket_start, bucket_end, model_name, routing_strategy, conversations_processed, messages_processed, follow_ups_generated, memory_entries_created, avg_latency_ms, p95_latency_ms, avg_tokens, total_tokens, total_cost_cents, success_rate, escalation_rate, metadata)
values
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'day', date_trunc('day', now()), date_trunc('day', now()) + interval '1 day', 'gpt-4.1-mini', 'memory_aware_route', 18, 24, 8, 5, 214, 312, 540, 9720, 98, 0.9720, 0.0180, '{"window":"24h"}'),
  ('c1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'day', date_trunc('day', now()), date_trunc('day', now()) + interval '1 day', 'claude-3.7-sonnet', 'pricing_objection_route', 11, 15, 4, 2, 284, 392, 731, 8041, 132, 0.9480, 0.0220, '{"window":"24h"}')
on conflict (id) do nothing;

insert into public.user_preferences (id, organization_id, member_id, preferred_theme, locale, timezone, notification_settings, ai_settings, dashboard_layout)
values
  ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '21111111-1111-1111-1111-111111111111', 'dark', 'en-US', 'UTC', '{"email":true,"push":true}', '{"memoryRetention":"365d","routing":"adaptive"}', '{"density":"comfortable"}'),
  ('d1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', '21111111-1111-1111-1111-111111111112', 'dark', 'en-US', 'UTC', '{"email":true,"push":false}', '{"memoryRetention":"180d","routing":"efficient"}', '{"density":"compact"}')
on conflict (member_id) do nothing;

insert into public.escalation_events (id, organization_id, customer_id, conversation_id, message_id, follow_up_id, triggered_by_member_id, assigned_to_member_id, severity, status, reason, summary, resolution, acknowledged_at, resolved_at, metadata)
values
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '41111111-1111-1111-1111-111111111112', '51111111-1111-1111-111111111112', '61111111-1111-1111-1111-111111111113', '71111111-1111-1111-1111-111111111112', '21111111-1111-1111-1111-111111111112', '21111111-1111-1111-1111-111111111112', 'high', 'open', 'Pricing objection stalled the deal', 'Escalate to finance stakeholder with ROI model', null, now() - interval '30 minutes', null, '{"trigger":"pricing","route":"manual_review"}')
on conflict (id) do nothing;
