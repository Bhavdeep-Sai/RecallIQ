import { sql } from "drizzle-orm";

export const exampleQueries = {
  customerOverview: sql`
    select
      c.id,
      c.display_name,
      c.company_name,
      c.lifecycle_stage,
      c.health_score,
      coalesce(conv.summary, 'No conversation yet') as latest_conversation_summary,
      coalesce(mem.summary, 'No memory yet') as latest_memory_summary
    from public.customers c
    left join lateral (
      select summary
      from public.conversations conv
      where conv.customer_id = c.id and conv.deleted_at is null
      order by conv.started_at desc
      limit 1
    ) conv on true
    left join lateral (
      select summary
      from public.ai_memory_entries mem
      where mem.customer_id = c.id and mem.deleted_at is null
      order by mem.created_at desc
      limit 1
    ) mem on true
    where c.deleted_at is null
    order by c.updated_at desc;
  `,
  budgetConsumption: sql`
    select
      bl.name,
      bl.hard_limit_cents,
      bl.soft_limit_cents,
      coalesce(sum(ct.cost_cents), 0) as consumed_cents,
      greatest(bl.hard_limit_cents - coalesce(sum(ct.cost_cents), 0), 0) as remaining_cents
    from public.budget_limits bl
    left join public.cost_tracking_entries ct
      on ct.budget_limit_id = bl.id
     and ct.deleted_at is null
    where bl.deleted_at is null
    group by bl.id, bl.name, bl.hard_limit_cents, bl.soft_limit_cents;
  `,
  routingPerformance: sql`
    select
      model_name,
      count(*) as request_count,
      avg(latency_ms) as avg_latency_ms,
      sum(total_tokens) as total_tokens,
      sum(cost_cents) as total_cost_cents
    from public.model_routing_logs
    where deleted_at is null
    group by model_name
    order by total_cost_cents desc;
  `,
  escalationQueue: sql`
    select
      e.id,
      e.severity,
      e.status,
      c.display_name as customer,
      e.reason,
      e.summary,
      e.created_at
    from public.escalation_events e
    left join public.customers c on c.id = e.customer_id
    where e.deleted_at is null and e.status in ('open', 'investigating')
    order by e.severity desc, e.created_at asc;
  `,
};
