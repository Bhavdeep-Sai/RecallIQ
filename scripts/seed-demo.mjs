#!/usr/bin/env node
/**
 * RecallIQ Demo Seed via Supabase REST API
 * Works around the Transaction Pooler SNI requirement by using the
 * Supabase PostgREST REST API with the service role key.
 */
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const SUPA_URL = (env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// Auto-inject project ref into DATABASE_URL if missing (for future direct-connect use)
const projectRef = SUPA_URL ? new URL(SUPA_URL).hostname.split('.')[0] : null;

if (!SUPA_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function restGet(table, filters = '') {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${filters}`, { headers });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function restInsert(table, payload) {
  const rows = Array.isArray(payload) ? payload : [payload];
  const results = [];
  for (const row of rows) {
    const res = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
      method: 'POST', headers,
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      const txt = await res.text();
      // Ignore unique constraint errors
      if (txt.includes('duplicate') || txt.includes('23505') || txt.includes('unique')) {
        continue;
      }
      throw new Error(`INSERT ${table} failed: ${res.status} ${txt}`);
    }
    const json = await res.json();
    if (Array.isArray(json) && json[0]) results.push(json[0]);
    else if (json && json.id) results.push(json);
  }
  return results;
}

function ago(days, hours = 0) {
  return new Date(Date.now() - (days * 86400 + hours * 3600) * 1000).toISOString();
}
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function run() {
  console.log('🌱 Seeding RecallIQ demo data via REST API...');

  // ── Organization ──────────────────────────────────────────────────────────
  let org;
  const existingOrgs = await restGet('organizations', 'slug=eq.demo-recalliq&select=*');
  if (existingOrgs.length) {
    org = existingOrgs[0];
    console.log('✓ Organization exists:', org.id);
  } else {
    const rows = await restInsert('organizations', {
      slug: 'demo-recalliq', name: 'RecallIQ Demo Corp',
      plan: 'growth', billing_status: 'active', timezone: 'America/New_York',
    });
    org = rows[0];
    console.log('✓ Organization created:', org.id);
  }

  // ── Budget limit ──────────────────────────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  await restInsert('budget_limits', {
    organization_id: org.id, name: 'Monthly AI Budget', scope: 'organization',
    period_start: monthStart, period_end: monthEnd,
    hard_limit_cents: 100000, soft_limit_cents: 80000, warn_threshold: 0.8, active: true,
  });
  console.log('✓ Budget limit set');

  // ── Team members ──────────────────────────────────────────────────────────
  let rep1, rep2;
  const existingRep1 = await restGet('team_members', `organization_id=eq.${org.id}&clerk_user_id=eq.demo_rep_1&select=*`);
  if (existingRep1.length) {
    rep1 = existingRep1[0];
  } else {
    const rows = await restInsert('team_members', {
      organization_id: org.id, clerk_user_id: 'demo_rep_1',
      email: 'sarah.chen@demo.recalliq.ai', full_name: 'Sarah Chen',
      role: 'rep', status: 'active', joined_at: ago(90),
    });
    rep1 = rows[0];
  }
  const existingRep2 = await restGet('team_members', `organization_id=eq.${org.id}&clerk_user_id=eq.demo_rep_2&select=*`);
  if (existingRep2.length) {
    rep2 = existingRep2[0];
  } else {
    const rows = await restInsert('team_members', {
      organization_id: org.id, clerk_user_id: 'demo_rep_2',
      email: 'marcus.jones@demo.recalliq.ai', full_name: 'Marcus Jones',
      role: 'manager', status: 'active', joined_at: ago(180),
    });
    rep2 = rows[0];
  }
  console.log('✓ Team members ready');

  // ── 6 Enterprise customers ────────────────────────────────────────────────
  const customerDefs = [
    { company: 'Meridian Health Systems', display: 'David Park', email: 'david.park@meridianhealth.example', stage: 'negotiation', acv: 24000000, health: 78, sentiment: 'Highly engaged, responded well to ROI framing', pricing_risk: 'medium' },
    { company: 'Axiom Financial Group', display: 'Jennifer Walsh', email: 'j.walsh@axiomfg.example', stage: 'proposal', acv: 18000000, health: 62, sentiment: 'Cautious about security compliance — needs SOC 2 docs', pricing_risk: 'high' },
    { company: 'Vertex Robotics', display: 'Arjun Mehta', email: 'arjun@vertexrobotics.example', stage: 'closed_won', acv: 9600000, health: 94, sentiment: 'Champion relationship strong — expanded deal after pilot', pricing_risk: 'low' },
    { company: 'Cascade Retail Partners', display: 'Emma Thompson', email: 'e.thompson@cascaderetail.example', stage: 'discovery', acv: 6000000, health: 45, sentiment: 'Early stage — price sensitive, needs strong use-case proof', pricing_risk: 'high' },
    { company: 'NovaTech Solutions', display: 'Carlos Rivera', email: 'c.rivera@novatech.example', stage: 'qualified', acv: 12000000, health: 71, sentiment: 'Technical champion engaged, procurement still warming up', pricing_risk: 'medium' },
    { company: 'Brightfield Analytics', display: 'Lisa Nguyen', email: 'lisa.n@brightfield.example', stage: 'closed_won', acv: 36000000, health: 97, sentiment: 'Flagship customer — co-marketing agreed, strong reference', pricing_risk: 'low' },
  ];

  const createdCustomers = [];
  for (const c of customerDefs) {
    const existing = await restGet('customers', `organization_id=eq.${org.id}&company_name=eq.${encodeURIComponent(c.company)}&select=id,company_name`);
    if (existing.length) {
      createdCustomers.push({ id: existing[0].id, def: c });
      console.log(`  → Customer exists: ${c.company}`);
      continue;
    }
    const rows = await restInsert('customers', {
      organization_id: org.id, owner_member_id: rep1.id,
      display_name: c.display, company_name: c.company, email: c.email,
      lifecycle_stage: c.stage, lifecycle_score: rand(55, 90), health_score: c.health,
      sentiment: c.sentiment, pricing_risk: c.pricing_risk,
      annual_contract_value_cents: c.acv,
    });
    if (rows[0]) {
      createdCustomers.push({ ...rows[0], def: c });
      console.log(`  ✓ Customer: ${c.company}`);
    }
  }

  // ── Conversations + Messages + Memory + Routing per customer ─────────────
  for (const cust of createdCustomers) {
    const def = cust.def;
    const fname = def.display.split(' ')[0];

    // Check if already has conversations
    const existingConvs = await restGet('conversations', `organization_id=eq.${org.id}&customer_id=eq.${cust.id}&select=id`);
    if (existingConvs.length >= 2) {
      console.log(`  → Skipping conversations for ${def.company} (already seeded)`);
      continue;
    }

    // === CONVERSATION 1: First touch — no memory context ===
    const conv1Rows = await restInsert('conversations', {
      organization_id: org.id, customer_id: cust.id, assigned_member_id: rep1.id,
      channel: 'email', subject: `Initial outreach — ${def.company}`,
      status: 'closed', started_at: ago(30),
      summary: 'First contact. Generic pitch. No memory context.',
      tone: 'neutral',
    });
    const conv1 = conv1Rows[0];
    if (!conv1) continue;

    await restInsert('messages', [
      { organization_id: org.id, conversation_id: conv1.id, customer_id: cust.id, sender_type: 'user', sender_name: 'Sarah Chen', content: `Hi ${fname}, I wanted to introduce RecallIQ — an AI platform that helps sales teams retain customer context. Would you be open to a quick call?`, occurred_at: ago(30) },
      { organization_id: org.id, conversation_id: conv1.id, customer_id: cust.id, sender_type: 'customer', sender_name: def.display, content: 'Thanks for reaching out. We have concerns about pricing and how this integrates with our existing stack. Also, is this SOC 2 certified?', occurred_at: ago(30, -2) },
    ]);

    await restInsert('ai_memory_entries', [
      { organization_id: org.id, customer_id: cust.id, conversation_id: conv1.id, entry_kind: 'objection', memory_key: 'pricing_concern', summary: 'Customer raised pricing concern in first contact — budget sensitivity not yet quantified', confidence: 0.45, importance: 35, tags: ['pricing', 'early'], valid_from: ago(30) },
      { organization_id: org.id, customer_id: cust.id, conversation_id: conv1.id, entry_kind: 'objection', memory_key: 'security_compliance', summary: 'Asked about SOC 2 certification — security posture is a decision factor', confidence: 0.55, importance: 50, tags: ['security', 'compliance'], valid_from: ago(30) },
    ]);

    await restInsert('model_routing_logs', {
      organization_id: org.id, conversation_id: conv1.id,
      request_id: `req-1a-${cust.id.slice(0, 8)}`, provider: 'groq',
      selected_model: 'mixtral-8x7b-32768', routing_strategy: 'premium',
      route_reason: 'No budget data — defaulting to premium for first interaction',
      input_tokens: 2100, output_tokens: 680, total_tokens: 2780,
      latency_ms: 824, confidence: 0.60, cost_cents: 8,
    });
    await restInsert('token_usage_logs', {
      organization_id: org.id, conversation_id: conv1.id,
      provider: 'groq', model_name: 'mixtral-8x7b-32768',
      prompt_tokens: 2100, completion_tokens: 680, total_tokens: 2780,
      cost_cents: 8, request_latency_ms: 824,
    });

    await restInsert('ai_follow_ups', {
      organization_id: org.id, conversation_id: conv1.id, customer_id: cust.id,
      created_by_member_id: rep1.id,
      title: `Following up: RecallIQ for ${def.company}`,
      body: `Hi ${fname},\n\nFollowing up on my earlier message about RecallIQ. We help sales teams maintain context across every customer interaction.\n\nWould a 20-minute demo work this week?\n\nBest,\nSarah`,
      rationale: 'Generic follow-up — no prior memory context available for personalization',
      priority: 3, status: 'sent', confidence: 0.52, model_name: 'mixtral-8x7b-32768',
      generated_at: ago(29),
    });

    // === CONVERSATION 2: Discovery — partial memory active ===
    const conv2Rows = await restInsert('conversations', {
      organization_id: org.id, customer_id: cust.id, assigned_member_id: rep1.id,
      channel: 'call', subject: 'Discovery call — pricing and integration deep dive',
      status: 'closed', started_at: ago(18),
      summary: 'Explored pricing. Customer confirmed $200K budget ceiling. Salesforce integration required.',
      tone: 'positive',
    });
    const conv2 = conv2Rows[0];
    if (!conv2) continue;

    await restInsert('messages', [
      { organization_id: org.id, conversation_id: conv2.id, customer_id: cust.id, sender_type: 'user', sender_name: 'Sarah Chen', content: `Thanks for making time. I saw your question about pricing — let me walk you through our growth plan. Before I do, can you share your typical budget range for tools in this category?`, occurred_at: ago(18) },
      { organization_id: org.id, conversation_id: conv2.id, customer_id: cust.id, sender_type: 'customer', sender_name: def.display, content: 'We are working with a ceiling of around $200K for this fiscal year. We also need this to plug into Salesforce natively. We have been burned by API overhead before.', occurred_at: ago(18, -1) },
    ]);

    await restInsert('ai_memory_entries', [
      { organization_id: org.id, customer_id: cust.id, conversation_id: conv2.id, entry_kind: 'pricing', memory_key: 'budget_ceiling', summary: 'Confirmed $200K budget ceiling for this fiscal year — hard constraint', confidence: 0.88, importance: 80, tags: ['pricing', 'budget', 'confirmed'], valid_from: ago(18) },
      { organization_id: org.id, customer_id: cust.id, conversation_id: conv2.id, entry_kind: 'stakeholder', memory_key: 'salesforce_requirement', summary: 'Salesforce native integration is mandatory — past bad experience with API overhead makes this a deal blocker', confidence: 0.85, importance: 85, tags: ['integration', 'salesforce', 'blocker'], valid_from: ago(18) },
      { organization_id: org.id, customer_id: cust.id, conversation_id: conv2.id, entry_kind: 'tone', memory_key: 'communication_style', summary: 'Prefers direct, data-driven conversations. Responds positively when reps reference prior context.', confidence: 0.78, importance: 70, tags: ['tone', 'preference'], valid_from: ago(18) },
    ]);

    await restInsert('model_routing_logs', {
      organization_id: org.id, conversation_id: conv2.id,
      request_id: `req-2b-${cust.id.slice(0, 8)}`, provider: 'groq',
      selected_model: 'llama3-70b-8192', routing_strategy: 'balanced',
      route_reason: 'Medium complexity with budget data — balanced model selected',
      input_tokens: 840, output_tokens: 290, total_tokens: 1130,
      latency_ms: 412, confidence: 0.82, cost_cents: 1,
    });
    await restInsert('token_usage_logs', {
      organization_id: org.id, conversation_id: conv2.id,
      provider: 'groq', model_name: 'llama3-70b-8192',
      prompt_tokens: 840, completion_tokens: 290, total_tokens: 1130,
      cost_cents: 1, request_latency_ms: 412,
    });

    await restInsert('ai_follow_ups', {
      organization_id: org.id, conversation_id: conv2.id, customer_id: cust.id,
      created_by_member_id: rep1.id,
      title: `RecallIQ Growth Plan — fits your $200K ceiling`,
      body: `Hi ${fname},\n\nGreat speaking today. Based on your $200K ceiling, our Growth plan at $180K annually gives you full memory retention, Salesforce native sync, and priority support — no API overhead.\n\nI'm attaching our Salesforce integration one-pager and SOC 2 Type II certificate.\n\nWhen works for a technical review with your team?\n\nBest,\nSarah`,
      rationale: 'Referenced confirmed budget ceiling and Salesforce requirement from memory — much stronger than generic template',
      priority: 2, status: 'sent', confidence: 0.81, model_name: 'llama3-70b-8192',
      generated_at: ago(17),
    });

    // === CONVERSATION 3: Technical review — full memory active ===
    const conv3Rows = await restInsert('conversations', {
      organization_id: org.id, customer_id: cust.id, assigned_member_id: rep1.id,
      channel: 'meeting', subject: 'Technical review + legal pre-work',
      status: 'pending_follow_up', started_at: ago(5),
      summary: 'Full memory active. SOC 2 addressed directly. Salesforce demo done. Pricing finalized. Moving to legal.',
      tone: 'very_positive', outcome: 'Moved to legal review',
    });
    const conv3 = conv3Rows[0];
    if (!conv3) continue;

    await restInsert('messages', [
      { organization_id: org.id, conversation_id: conv3.id, customer_id: cust.id, sender_type: 'ai', sender_name: 'RecallIQ', content: '[Memory context injected] $200K ceiling confirmed. Salesforce integration is a deal blocker. Direct communication style preferred. SOC 2 is a top concern. Past bad experience with API overhead.', occurred_at: ago(5) },
      { organization_id: org.id, conversation_id: conv3.id, customer_id: cust.id, sender_type: 'user', sender_name: 'Sarah Chen', content: `I want to start by confirming — we have your SOC 2 Type II report ready, and our Salesforce package includes native object sync, no middleware required. Given your $200K ceiling, I also want to walk you through the exact line items so there are no surprises in procurement.`, occurred_at: ago(5) },
      { organization_id: org.id, conversation_id: conv3.id, customer_id: cust.id, sender_type: 'customer', sender_name: def.display, content: 'This is exactly what I needed. The fact that you came in knowing our constraints shows the platform works as advertised. Let us get legal involved this week.', occurred_at: ago(5, -1) },
    ]);

    await restInsert('ai_memory_entries', [
      { organization_id: org.id, customer_id: cust.id, conversation_id: conv3.id, entry_kind: 'strategy', memory_key: 'deal_velocity', summary: 'Deal moving to legal — champion confirmed memory-aware prep built trust. Full context was decisive in closing the technical review.', confidence: 0.96, importance: 95, tags: ['strategy', 'win', 'deal-velocity'], valid_from: ago(5) },
      { organization_id: org.id, customer_id: cust.id, conversation_id: conv3.id, entry_kind: 'preference', memory_key: 'meeting_style', summary: 'Customer explicitly praised memory-aware preparation. Always open with prior context acknowledgment before pitching.', confidence: 0.92, importance: 88, tags: ['preference', 'tone', 'winning-behavior'], valid_from: ago(5) },
    ]);

    await restInsert('model_routing_logs', [
      { organization_id: org.id, conversation_id: conv3.id, request_id: `req-3c-${cust.id.slice(0, 8)}`, provider: 'groq', selected_model: 'llama3-8b-8192', routing_strategy: 'small', route_reason: 'Low complexity memory extraction — small model sufficient', input_tokens: 310, output_tokens: 120, total_tokens: 430, latency_ms: 163, confidence: 0.91, cost_cents: 0 },
      { organization_id: org.id, conversation_id: conv3.id, request_id: `req-3d-${cust.id.slice(0, 8)}`, provider: 'groq', selected_model: 'llama3-70b-8192', routing_strategy: 'balanced', route_reason: 'Medium complexity follow-up generation with full memory context', input_tokens: 620, output_tokens: 240, total_tokens: 860, latency_ms: 398, confidence: 0.88, cost_cents: 1 },
    ]);
    await restInsert('token_usage_logs', [
      { organization_id: org.id, conversation_id: conv3.id, provider: 'groq', model_name: 'llama3-8b-8192', prompt_tokens: 310, completion_tokens: 120, total_tokens: 430, cost_cents: 0, request_latency_ms: 163 },
      { organization_id: org.id, conversation_id: conv3.id, provider: 'groq', model_name: 'llama3-70b-8192', prompt_tokens: 620, completion_tokens: 240, total_tokens: 860, cost_cents: 1, request_latency_ms: 398 },
    ]);

    await restInsert('ai_follow_ups', {
      organization_id: org.id, conversation_id: conv3.id, customer_id: cust.id,
      created_by_member_id: rep1.id,
      title: `Next steps: Legal review package for ${def.company}`,
      body: `Hi ${fname},\n\nThank you for today — your team's feedback means a lot. As discussed:\n\n• SOC 2 Type II certificate attached\n• Salesforce integration architecture doc attached\n• Growth plan order form ($180K, 12-month term)\n• Legal contact: contracts@recalliq.ai\n\nI'll follow up Thursday if I haven't heard from procurement.\n\nLooking forward to welcoming ${def.company} to the RecallIQ family.\n\nSarah`,
      rationale: 'Full memory context used: referenced confirmed budget, Salesforce requirement, SOC 2 concern, and direct communication preference from 3 prior interactions',
      priority: 1, status: 'sent', confidence: 0.96, model_name: 'llama3-70b-8192',
      generated_at: ago(4),
    });

    console.log(`✓ Seeded: ${def.company}`);
  }

  // ── 30-day performance analytics trend ────────────────────────────────────
  console.log('✓ Building 30-day analytics trend...');
  for (let d = 29; d >= 0; d--) {
    const isEarly = d > 20;
    const model = isEarly ? 'mixtral-8x7b-32768' : (d > 10 ? 'llama3-70b-8192' : 'llama3-8b-8192');
    const strategy = isEarly ? 'premium' : (d > 10 ? 'balanced' : 'small');
    const avgLatency = isEarly ? rand(700, 900) : (d > 10 ? rand(350, 500) : rand(140, 220));
    const costCents = isEarly ? rand(400, 800) : (d > 10 ? rand(60, 150) : rand(5, 30));
    await restInsert('ai_performance_analytics', {
      organization_id: org.id, granularity: 'day',
      bucket_start: ago(d + 1), bucket_end: ago(d),
      model_name: model, routing_strategy: strategy,
      conversations_processed: rand(3, 12), messages_processed: rand(8, 30),
      follow_ups_generated: rand(1, 5), memory_entries_created: rand(2, 8),
      avg_latency_ms: avgLatency, p95_latency_ms: Math.round(avgLatency * 2.2),
      avg_tokens: rand(400, 1800), total_tokens: rand(3000, 25000),
      total_cost_cents: costCents,
      success_rate: (rand(88, 100) / 100).toFixed(4),
      escalation_rate: (rand(0, 8) / 100).toFixed(4),
    });
  }

  // ── Escalation events ────────────────────────────────────────────────────
  await restInsert('escalation_events', [
    { organization_id: org.id, severity: 'low', status: 'resolved', reason: 'routing.escalated', summary: 'Request escalated from balanced to premium: high-complexity deal risk analysis for Meridian Health' },
    { organization_id: org.id, severity: 'medium', status: 'resolved', reason: 'budget.soft_breached', summary: 'Monthly AI spend crossed 80% soft limit ($800 of $1,000 budget used)' },
    { organization_id: org.id, severity: 'low', status: 'resolved', reason: 'routing.fallback', summary: 'llama3-70b-8192 returned malformed JSON — fell back to mixtral, retry succeeded' },
    { organization_id: org.id, severity: 'high', status: 'resolved', reason: 'execution.failed', summary: 'Groq rate limit hit during batch memory ingestion — exponential backoff applied, all requests recovered' },
  ]);

  console.log('\n✅ Demo seed complete!');
  console.log('   6 enterprise customers with 3-interaction memory evolution stories');
  console.log('   30-day analytics trend showing routing improvement over time');
  console.log('   Escalation events for runtime intelligence demo');
}

run().catch((e) => {
  console.error('Seeding failed:', e.message || e);
  process.exit(1);
});
