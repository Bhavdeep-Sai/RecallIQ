import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db/client";
import { aiMemoryEntries } from "@/lib/db/schema";
import { generateEmbedding } from "./embeddings";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Memory extraction schema
const memorySchema = z.object({
  memories: z.array(
    z.object({
      kind: z.enum([
        "objection",
        "tone",
        "pricing",
        "stakeholder",
        "security",
        "timeline",
        "preference",
        "summary",
        "strategy",
      ]),
      key: z.string().describe("Short descriptive key for this memory, e.g., 'budget_constraint'"),
      value: z.string().describe("The actual content or value of the memory"),
      summary: z.string().describe("A concise 1-sentence summary of this memory"),
      importance: z.number().min(1).max(100).describe("Importance score from 1 to 100"),
      tags: z.array(z.string()).describe("List of relevant tags"),
    })
  ),
});

/**
 * Retain Flow: Analyzes a conversation and extracts long-term semantic memories.
 */
export async function ingestMemory(
  organizationId: string,
  customerId: string,
  conversationId: string,
  messageId: string,
  messageContent: string
) {
  // Use Groq model to extract insights
  const { object } = await generateObject({
    model: groq("llama3-8b-8192"),
    schema: memorySchema,
    prompt: `Analyze the following customer message and extract any long-term memories or insights that a sales assistant should remember for future interactions.
Message: "${messageContent}"`,
  });

  const insertedMemories: Record<string, unknown>[] = [];

  const supabase = getSupabaseAdmin();

  for (const memory of object.memories) {
    // Generate embedding for the semantic summary
    const embedding = await generateEmbedding(memory.summary);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error } = await (supabase as any)
      .from("ai_memory_entries")
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        conversation_id: conversationId,
        message_id: messageId,
        entry_kind: memory.kind,
        memory_key: memory.key,
        memory_value: memory.value,
        summary: memory.summary,
        importance: memory.importance,
        tags: memory.tags,
        embedding,
        confidence: 0.9,
      })
      .select();

    if (error) {
      // Log but continue
      // eslint-disable-next-line no-console
      console.error("ingestMemory supabase insert error:", error);
      continue;
    }

    insertedMemories.push(...(inserted ?? []));
  }

  return insertedMemories;
}

/**
 * Recall Flow: Semantically search past memories based on the current context.
 */
export async function retrieveContext(organizationId: string, customerId: string, contextPrompt: string, limit = 5) {
  const supabase = getSupabaseAdmin();

  // If we can't compute an embedding, return empty
  const queryEmbedding = await generateEmbedding(contextPrompt).catch(() => null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("ai_memory_entries")
    .select("id, entry_kind, summary, importance, embedding")
    .eq("organization_id", organizationId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("retrieveContext supabase fetch error:", error);
    return [];
  }

  const rows = (data ?? []) as Array<{ id: string; entry_kind: string; summary: string | null; importance: number | null; embedding?: any }>;

  if (!queryEmbedding) {
    // Return top important memories if embedding generation failed
    return rows
      .sort((a, b) => (Number(b.importance ?? 0) - Number(a.importance ?? 0)))
      .slice(0, limit)
      .map((r) => ({ id: r.id, kind: r.entry_kind, summary: r.summary, importance: r.importance, similarity: null }));
  }

  // Helper: compute cosine similarity
  const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
  const norm = (a: number[]) => Math.sqrt(a.reduce((s, v) => s + v * v, 0));

  const scored = rows.map((r) => {
    let emb: number[] | null = null;
    if (Array.isArray(r.embedding)) emb = r.embedding as number[];
    else if (typeof r.embedding === "string") {
      try { emb = JSON.parse(r.embedding); } catch { emb = null; }
    }

    let similarity: number | null = null;
    if (emb && emb.length === queryEmbedding.length) {
      const d = dot(queryEmbedding, emb);
      const s = norm(queryEmbedding) * norm(emb);
      similarity = s === 0 ? 0 : d / s;
    }

    return { id: r.id, kind: r.entry_kind, summary: r.summary, importance: r.importance, similarity };
  });

  const sorted = scored
    .filter((s) => s.similarity != null)
    .sort((a, b) => (b.similarity! - a.similarity!))
    .slice(0, limit);

  // If no similarity scores, fall back to importance
  if (sorted.length === 0) {
    return rows
      .sort((a, b) => (Number(b.importance ?? 0) - Number(a.importance ?? 0)))
      .slice(0, limit)
      .map((r) => ({ id: r.id, kind: r.entry_kind, summary: r.summary, importance: r.importance, similarity: null }));
  }

  return sorted;
}

/**
 * Context Injection System: Formats retrieved memories for the system prompt.
 */
export async function injectMemory(organizationId: string, customerId: string, currentMessage: string) {
  const relevantMemories = await retrieveContext(organizationId, customerId, currentMessage);

  if (relevantMemories.length === 0) return "";

  const memoryBulletPoints = relevantMemories
    .map((m) => `- [${m.kind.toUpperCase()}] ${m.summary}`)
    .join("\n");

  return `\n\n### RECALLED MEMORY CONTEXT ###\nThe following insights were retrieved from past interactions with this customer. Use them to adapt your tone, address objections preemptively, and personalize your response:\n${memoryBulletPoints}\n`;
}

/**
 * Reflection Flow: Consolidates redundant memories for a customer into strategic summaries.
 */
export async function reflectAndConsolidate(organizationId: string, customerId: string) {
  const supabase = getSupabaseAdmin();
  type MemoryRow = {
    id: string;
    entry_kind: string;
    summary: string | null;
    importance: number | null;
  };

  const fetchMemories = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("ai_memory_entries")
      .select("id, entry_kind, summary, importance, created_at")
      .eq("organization_id", organizationId)
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load memories: ${error.message}`);
    }

    return (data ?? []) as MemoryRow[];
  };

  const memories = await fetchMemories();

  if (memories.length < 5) return { status: "skipped", reason: "not enough memories" };

  const consolidateHeuristically = async () => {
    const groupedMemories = new Map<string, typeof memories>();

    for (const memory of memories) {
      const normalizedSummary = String(memory.summary ?? "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
      const groupKey = `${memory.entry_kind}:${normalizedSummary}`;
      const group = groupedMemories.get(groupKey) ?? [];
      group.push(memory);
      groupedMemories.set(groupKey, group);
    }

    const duplicateGroups = Array.from(groupedMemories.values()).filter((group) => group.length > 1);

    if (duplicateGroups.length === 0) {
      return { status: "skipped", reason: "no redundant memories found" };
    }

    let consolidatedCount = 0;

    for (const group of duplicateGroups) {
      const sourceMemoryIds = group.map((memory) => memory.id);
      const uniqueSummaries = [...new Set(group.map((memory) => String(memory.summary ?? "").trim()).filter(Boolean))];
      const summary = uniqueSummaries.join(" / ");
      const mostImportant = Math.max(...group.map((memory) => Number(memory.importance ?? 50)));
      const embedding = await generateEmbedding(summary);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from("ai_memory_entries")
        .insert({
          organization_id: organizationId,
          customer_id: customerId,
          entry_kind: group[0].entry_kind,
          memory_key: `consolidated_${group[0].entry_kind}_${consolidatedCount + 1}`,
          summary,
          importance: mostImportant,
          tags: ["consolidated", "heuristic"],
          embedding,
          confidence: 0.8,
        });

      if (insertError) {
        throw new Error(`Failed to insert consolidated memory: ${insertError.message}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any)
        .from("ai_memory_entries")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", sourceMemoryIds);

      if (deleteError) {
        throw new Error(`Failed to mark memories as deleted: ${deleteError.message}`);
      }

      consolidatedCount++;
    }

    return { status: "success", consolidatedCount, mode: "heuristic" };
  };

  if (!process.env.GROQ_API_KEY) {
    return consolidateHeuristically();
  }

  const memoryText = memories.map((m) => `ID: ${m.id} | Kind: ${m.entry_kind} | Summary: ${m.summary ?? ""}`).join("\n");

  try {
    const { object } = await generateObject({
      model: groq("llama3-8b-8192"),
      schema: z.object({
        consolidatedInsights: z.array(
          z.object({
            summary: z.string(),
            key: z.string(),
            kind: z.enum([
              "objection",
              "tone",
              "pricing",
              "stakeholder",
              "security",
              "timeline",
              "preference",
              "summary",
              "strategy",
            ]),
            sourceMemoryIds: z.array(z.string()),
          })
        ),
      }),
      prompt: `Review the following customer memories and identify overlapping or redundant information. Create consolidated strategic insights that replace the redundant ones.\n\nMemories:\n${memoryText}`,
    });

    if (!object?.consolidatedInsights?.length) {
      return consolidateHeuristically();
    }

    let consolidatedCount = 0;

    for (const insight of object.consolidatedInsights) {
      if (insight.sourceMemoryIds.length > 1) {
        const embedding = await generateEmbedding(insight.summary);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from("ai_memory_entries")
          .insert({
            organization_id: organizationId,
            customer_id: customerId,
            entry_kind: insight.kind,
            memory_key: insight.key,
            summary: insight.summary,
            importance: 90,
            tags: ["consolidated", "strategic"],
            embedding,
            confidence: 0.95,
          });

        if (insertError) {
          throw new Error(`Failed to insert consolidated insight: ${insertError.message}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: deleteError } = await (supabase as any)
          .from("ai_memory_entries")
          .update({ deleted_at: new Date().toISOString() })
          .in("id", insight.sourceMemoryIds);

        if (deleteError) {
          throw new Error(`Failed to delete source memories: ${deleteError.message}`);
        }
        consolidatedCount++;
      }
    }

    return { status: "success", consolidatedCount, mode: "groq" };
  } catch {
    return consolidateHeuristically();
  }
}