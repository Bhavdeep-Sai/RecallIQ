# RecallIQ Quick Start: Everything You Need to Know

## What is RecallIQ?

A **sales intelligence platform** that automatically:
- Captures conversations (calls, emails, meetings, Slack)
- Extracts key insights (pricing concerns, timelines, stakeholders)
- Remembers customer context for future interactions
- Recommends next steps for the sales team

**Real Example:**
```
Customer: "We need 99.95% uptime guaranteed"
    ↓
System extracts: "Timeline: SLA requirement"
    ↓
Memory saves: "Must have 99.95% uptime SLA"
    ↓
Next call: "Hi, I have the 99.95% SLA document ready for you"
```

---

## The Three Layers of Data

### Layer 1: Events (What Happened)
- **Conversations** — Call with Nadia at 2pm
- **Messages** — "We need SLAs" + "I'll send the plan"

### Layer 2: Intelligence (What We Learned)
- **Memory** — "Customer requires phased rollout with SLAs"
- **Follow-Ups** — "Action: Send rollout plan to Nadia"

### Layer 3: Profile (Who They Are)
- **Customer Health** — 91/100 (engaged)
- **Pricing Risk** — Medium (some concerns)
- **Stage** — Proposal → Negotiation

---

## Current Status: What Works & What Doesn't

### ✅ You Can Do Now:

1. **View Demo Customers**
   - Go to `/customers`
   - See: Northstar Labs, Apex Logistics
   - See their health, risk, stage

2. **Add New Customers**
   - Click "+ Add account"
   - Fill: Name, Company, Email
   - Saved to database ✅

3. **View Demo Conversations**
   - Go to `/conversations`
   - See: "Q2 Rollout", "Pricing Call"
   - See who participated, tone, next step

4. **View Generated Follow-Ups**
   - Go to `/follow-ups`
   - See: "Send rollout plan", "Prepare ROI proof"

5. **View Extracted Memory**
   - Go to `/ai-memory`
   - See: What we learned about each customer

---

### ❌ You Can't Do Yet:

1. **Add Conversations from UI** — No form/button exists
2. **Sync CRM Data** — "Sync transcripts" is mocked
3. **Record Messages** — No message input UI
4. **Edit Conversations** — Can't modify after creating

---

## How to Add Conversations Right Now

### Option A: Use Supabase Dashboard (Easiest)

1. Go to `https://supabase.com` → your project
2. Open SQL Editor
3. Run query to add conversation:

```sql
INSERT INTO conversations (
  organization_id,
  customer_id,
  channel,
  summary,
  tone,
  status
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '41111111-1111-1111-1111-111111111111',
  'call',
  'Customer discussed Q3 expansion',
  'positive',
  'open'
);
```

4. Refresh your app — conversation appears!

### Option B: Build the Feature

See `ADDING_CONVERSATIONS_GUIDE.md` for:
- Complete API endpoint code
- UI form component
- Step-by-step instructions

---

## Understanding the Database

### 6 Main Tables You Need to Know:

```
ORGANIZATIONS
├─ Your workspace ("RecallIQ")
│
├─ TEAM_MEMBERS
│  ├─ Ava Chen (owner)
│  └─ Noah Patel (manager)
│
├─ CUSTOMERS
│  ├─ Northstar Labs (you added "Test User" here ✓)
│  └─ Apex Logistics
│  
├─ CONVERSATIONS
│  ├─ "Q2 Rollout Planning" (meeting)
│  └─ "Pricing Objection" (call)
│  
├─ MESSAGES
│  ├─ "We need SLAs" (customer)
│  └─ "I'll send a plan" (Ava Chen)
│
├─ AI_FOLLOW_UPS
│  ├─ "Send rollout plan" (priority: 2)
│  └─ "Prepare ROI proof" (priority: 1)
│
└─ AI_MEMORY_ENTRIES
   ├─ "Needs phased rollout with SLAs" (timeline)
   └─ "Prefers hard savings" (pricing)
```

---

## Key Concepts Explained

### Tone
How the customer sounded during the conversation:
- `positive` — Happy, engaged
- `price_sensitive` — Worried about cost
- `guarded` — Cautious, holding back
- `urgent` — Time-critical issue
- `neutral` — No strong emotion

### Channel
How the conversation happened:
- `call` — Phone call
- `email` — Email exchange
- `meeting` — In-person or video meeting
- `slack` — Slack message

### Status
State of the conversation:
- `open` — Ongoing, not resolved
- `pending_follow_up` — Needs action
- `closed` — Completed
- `archived` — Old, no longer active

### Health Score (0-100)
How engaged/happy is the customer:
- 80-100 = ✅ Very healthy
- 50-79 = ⚠️ Moderate
- 0-49 = 🔴 At risk

### Pricing Risk
Likelihood they'll push back on price:
- `low` = Happy with pricing
- `medium` = Some concerns
- `high` = Major price objection

---

## The Flow: From Conversation to Action

```
Step 1: Rep talks to customer
        "We need SLAs for production"
        └─ Happens at 2 PM

Step 2: Rep logs conversation
        Channel: call
        Tone: guarded
        Summary: "SLA requirements"
        └─ Data saved to DB

Step 3: System extracts intelligence
        AI: "This customer needs SLAs"
        └─ Memory entry created

Step 4: System recommends action
        Task: "Send SLA documentation"
        Priority: HIGH
        └─ Follow-up generated

Step 5: Dashboard shows everything
        Conversations page: Shows this call
        Memory page: Shows SLA requirement
        Follow-ups page: Shows task
        └─ Rep sees context for next interaction

Step 6: Next interaction
        Rep: "Hi, I have the SLA docs..."
        AI: *Shows from memory* "They need 99.95% uptime"
        └─ Closes the loop!
```

---

## Where to Find Things

| Need | Go To | Status |
|------|-------|--------|
| View customers | `/customers` | ✅ Works |
| Add customer | Click "+ Add account" | ✅ Works |
| View conversations | `/conversations` | ✅ Works |
| Add conversation | ❌ Doesn't exist | ❌ Need to build |
| View follow-ups | `/follow-ups` | ✅ Works |
| View memory | `/ai-memory` | ✅ Works |
| Analytics | `/analytics` | ✅ Works |

---

## Seeded Data Reference

### Customers (Demo Data):
```
1. Northstar Labs
   Contact: Nadia Stone
   Health: 91/100 ✅
   Risk: Medium
   Stage: Proposal
   ACV: $12.8M

2. Apex Logistics
   Contact: Marcus Lee
   Health: 74/100
   Risk: High ⚠️
   Stage: Negotiation
   ACV: $8.6M
```

### Conversations (Demo Data):
```
1. "Q2 Rollout Planning"
   Customer: Northstar Labs
   Channel: Meeting
   Tone: Positive ✅
   Next Step: "Implementation path approved"
   
2. "Pricing Objection Handling"
   Customer: Apex Logistics
   Channel: Call
   Tone: Price-Sensitive 💰
   Next Step: "Awaiting finance review"
```

### Memory (Demo Data):
```
For Northstar Labs:
├─ "Requires phased rollout with SLAs" (Timeline)
└─ "Needs SLA documentation before procurement approval" (Requirement)

For Apex Logistics:
├─ "Prefers hard savings and payment-term flexibility" (Pricing)
└─ "Budget ceiling: $200K" (Budget)
```

---

## Quick Reference: API Endpoints

### Customers
```
GET  /api/customers          ← Get all customers
POST /api/customers          ← Add new customer
```

### Conversations
```
GET  /api/conversations      ← List all (currently shows seeded data)
POST /api/conversations/create  ← Add new (DOESN'T EXIST YET)
```

### Follow-Ups
```
GET  /api/follow-ups         ← Get recommendations
POST /api/follow-ups/generate   ← Generate from messages
```

### Memory
```
POST /api/memory/ingest      ← Import memory
POST /api/memory/reflect     ← Extract from conversation
```

---

## Common Questions

**Q: Why is everything seeded?**
A: The team built with demo data to show what the system looks like when it's working. Your new customers are live, but conversations are only from the seed.

**Q: Can I delete conversations?**
A: Not from UI. You can update `deleted_at` in Supabase.

**Q: Why isn't the CRM sync working?**
A: It's a placeholder. Future: will integrate with HubSpot/Salesforce.

**Q: How is AI-generated?**
A: Prompts go to Groq/Anthropic LLMs. Responses parsed → stored as memory + follow-ups.

**Q: Can I add more than 2 messages?**
A: Yes! Insert multiple rows into `messages` table with same `conversation_id`.

**Q: What if I add a conversation but no memory appears?**
A: Memory auto-generation isn't implemented yet. Future feature.

**Q: How do I know what customer IDs to use?**
A: Query Supabase:
```sql
SELECT id, display_name FROM customers LIMIT 10;
```

---

## Your Next Steps

### Short-term (Today):
1. ✅ Read this document
2. ✅ Explore the seeded customers/conversations
3. ✅ Try adding a new customer
4. ✅ View the follow-ups and memory generated

### Medium-term (This Week):
1. Understand the data structure (see `DATA_FLOW_ARCHITECTURE.md`)
2. Add conversations manually via Supabase
3. Build the "Add Conversation" feature (see `ADDING_CONVERSATIONS_GUIDE.md`)

### Long-term (This Month):
1. Integrate CRM sync (HubSpot/Salesforce)
2. Auto-generate follow-ups from new conversations
3. Build conversation detail page
4. Add conversation search/filtering

---

## Files to Read

- `HOW_RECALLIQ_WORKS.md` — Full architecture explanation
- `DATA_FLOW_ARCHITECTURE.md` — Visual data flow with examples
- `ADDING_CONVERSATIONS_GUIDE.md` — How to add conversations dynamically
- `FINAL_PROJECT_AUDIT.md` — Full feature audit

---

## Important IDs (Seeded)

Keep these handy:

```
Organization ID:  11111111-1111-1111-1111-111111111111
Ava Chen:         21111111-1111-1111-1111-111111111111
Noah Patel:       21111111-1111-1111-1111-111111111112
Northstar Labs:   41111111-1111-1111-1111-111111111111
Apex Logistics:   41111111-1111-1111-1111-111111111112
```

---

## The Big Picture

RecallIQ is building **"sales memory"** — a system that:

1. **Listens** to every conversation (call, email, meeting)
2. **Remembers** key details (what they said, what they need)
3. **Learns** patterns (pricing concerns, timeline pressures)
4. **Recommends** actions (follow-ups, talking points)
5. **Evolves** as more data flows in

Right now:
- ✅ Steps 1-4 work with demo data
- ⏳ Step 5 is manual for new conversations
- 🚀 Future: Fully automated with CRM sync

---

**Status**: App is ~70% built. Core functionality works, UI forms for dynamic data entry need to be completed.

**Your role**: Either use seeded data to understand the system, or start building the missing pieces!

---

Last updated: May 2026
Questions? Check the other guide files!
