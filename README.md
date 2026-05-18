# RecallIQ - Enterprise AI Sales Intelligence

**RecallIQ** is an advanced, memory-backed AI sales intelligence platform. It acts as an intelligent co-pilot for sales teams, capturing every detail from customer interactions and utilizing cost-aware AI routing to generate hyper-personalized follow-ups, strategic summaries, and real-time account risk analysis.

---

## 🚨 The Problem Statement

**Sales Productivity & Context Loss**
The #1 problem in B2B sales is context loss between interactions. Account Executives (AEs) manage dozens of accounts simultaneously. Important details—such as subtle pricing concerns, specific integration requirements, stakeholder dynamics, and tone preferences—are often lost in messy CRM notes or forgotten entirely. 

When a salesperson forgets what was discussed in previous meetings, every new conversation feels like starting from scratch. This leads to generic follow-up emails, frustrated prospects, extended sales cycles, and ultimately, lost revenue.

---

## 💡 What is Solved & How It Is Done

**The Solution: Persistent "Hindsight Memory" and "Runtime Intelligence"**
RecallIQ solves context loss by acting as a persistent, structured memory bank for every account. 

**How it works:**
1. **Retain (Ingestion):** After every call, email, or meeting, RecallIQ automatically extracts key signals (objections, tone, pricing concerns, competitor mentions) and stores them as distinct, searchable vectors.
2. **Recall (Semantic Search):** Before generating any AI response or follow-up, the system runs a similarity search (using pgvector) to retrieve the exact context from 3, 5, or 10 interactions ago.
3. **Reflect (Consolidation):** The AI periodically prunes and consolidates duplicate memories into high-level strategic summaries.
4. **Cascadeflow Runtime (Cost-Aware Routing):** Instead of using expensive AI models for everything, RecallIQ uses "Runtime Intelligence" to route tasks based on complexity. Simple extractions go to fast/cheap models (like Llama3-8b), while complex reasoning goes to premium models (like Mixtral). This prevents budget blowouts.

---

## 🚀 Features: What All You Can Use

- **Hindsight Memory Vault:** View a complete, structured history of customer objections, tone preferences, and requirements.
- **Automated Follow-ups:** Generate draft emails that are highly personalized, referencing exact details from prior conversations.
- **Account Intelligence:** View automated health scores, deal risk assessments, and ACV (Annual Contract Value) forecasts.
- **Runtime Intelligence Dashboard:** A dedicated observability panel to monitor AI model routing, track token costs in real-time, and view budget guardrails.
- **Conversation Hub:** Sync and review transcripts across multiple channels (Calls, Emails, Slack, Meetings).
- **Business Analytics:** Monitor platform adoption, runtime AI costs, and revenue lift in one executive view.

---

## 🛠️ What the Application Contains (Tech Stack)

RecallIQ is built as a production-grade, full-stack application using modern web and AI technologies:

| Category | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19 |
| **Authentication** | Clerk (Enterprise SSO ready) |
| **Database** | Supabase (Postgres) |
| **Vector Search** | pgvector (Cosine similarity search) |
| **ORM** | Drizzle ORM + Drizzle Kit |
| **AI Models** | Groq (Llama3-8b, Llama3-70b, Mixtral-8x7b) |
| **State Management** | Zustand (UI State), TanStack Query (Server State) |
| **Styling & UI** | Tailwind CSS 4, Framer Motion (Animations), Recharts |

---

## 📅 How to Use It in Daily Life

**A Day in the Life of a Sales Rep:**
1. **Morning Prep:** Log into RecallIQ and check the **Customers** dashboard to see which accounts have high deal risk or pending next steps.
2. **Pre-Meeting:** Before jumping on a Zoom call, quickly check the customer's **AI Memory** to instantly recall that they were "highly price-sensitive" and concerned about "Salesforce integration" during the last call three weeks ago.
3. **Post-Meeting:** The transcript is synced to the **Conversations** tab. RecallIQ automatically extracts new objections and updates the customer's memory profile.
4. **Follow-Up:** Go to the **Follow-Ups** tab and click "Generate". RecallIQ drafts an email that directly addresses the specific pricing concerns mentioned in the meeting, using a tone tailored to that specific buyer.

---

## 🎯 Who Are the Beneficiaries?

1. **Account Executives (AEs) & Sales Reps:** Saves hours of manual CRM data entry and draft writing. Eliminates the embarrassment of forgetting customer details.
2. **Sales Managers & VP of Sales:** Provides a bird's-eye view of account health, real objections across the pipeline, and revenue at risk.
3. **RevOps / Engineering Teams:** The *Runtime Intelligence* dashboard allows them to deploy AI features at scale without worrying about unpredictable OpenAI/LLM bills, thanks to intelligent model routing and budget enforcement.
4. **The Customers:** Buyers receive highly personalized, relevant communication instead of generic, spammy sales follow-ups.

---

## ⚙️ Local Setup Instructions

### Prerequisites
- Node.js 20+
- Supabase project (Postgres + `vector` extension enabled)
- Clerk application keys
- Groq API key

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env.local
```

### Environment Variables (.env.local)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
GROQ_API_KEY=gsk_...          
```

### Database Initialization
```bash
# 1. Apply the schema
node migrate.mjs

# 2. Seed the database with demo enterprise customers
node scripts/seed-demo.mjs
```

### Run the Application
```bash
npm run dev
# Open http://localhost:3000
```
