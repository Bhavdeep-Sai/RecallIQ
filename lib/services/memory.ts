import { generateObject, generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { aiMemoryEntries, memoryEntryKindEnum } from "@/lib/db/schema";
import { generateEmbedding } from "./embeddings";
import { desc, eq, sql } from "drizzle-orm";

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
  const db = getDb();
  // Use Groq model to extract insights
  const { object } = await generateObject({
    model: groq("llama3-8b-8192"),
    schema: memorySchema,
    prompt: `Analyze the following customer message and extract any long-term memories or insights that a sales assistant should remember for future interactions.
Message: "${messageContent}"`,
  });

  const insertedMemories = [];

  for (const memory of object.memories) {
    // Generate embedding for the semantic summary
    const embedding = await generateEmbedding(memory.summary);

    const [inserted] = await db
      .insert(aiMemoryEntries)
      .values({
        organizationId,
        customerId,
        conversationId,
        messageId,
        entryKind: memory.kind,
        memoryKey: memory.key,
        memoryValue: memory.value,
        summary: memory.summary,
        importance: memory.importance,
        tags: memory.tags,
        embedding: embedding,
        confidence: 0.9,
      })
      .returning();

    insertedMemories.push(inserted);
  }

  return insertedMemories;
}

/**
 * Recall Flow: Semantically search past memories based on the current context.
 */
export async function retrieveContext(organizationId: string, customerId: string, contextPrompt: string, limit = 5) {
  const db = getDb();
  const queryEmbedding = await generateEmbedding(contextPrompt);
  const embeddingString = `[${queryEmbedding.join(",")}]`;

  // Use cosine distance `<=>` to find similar memories
  const similarity = sql<number>`1 - (${aiMemoryEntries.embedding} <=> ${embeddingString}::vector)`;

  const memories = await db
    .select({
      id: aiMemoryEntries.id,
      kind: aiMemoryEntries.entryKind,
      summary: aiMemoryEntries.summary,
      importance: aiMemoryEntries.importance,
      similarity,
    })
    .from(aiMemoryEntries)
    .where(
      sql`${aiMemoryEntries.organizationId} = ${organizationId} AND ${aiMemoryEntries.customerId} = ${customerId} AND ${aiMemoryEntries.deletedAt} IS NULL`
    )
    .orderBy(desc(similarity))
    .limit(limit);

  return memories;
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
  const db = getDb();
  // Fetch all active memories for the customer
  const memories = await db
    .select()
    .from(aiMemoryEntries)
    .where(
      sql`${aiMemoryEntries.organizationId} = ${organizationId} AND ${aiMemoryEntries.customerId} = ${customerId} AND ${aiMemoryEntries.deletedAt} IS NULL`
    )
    .orderBy(desc(aiMemoryEntries.createdAt));

  if (memories.length < 5) return { status: "skipped", reason: "not enough memories" };

  const memoryText = memories.map((m) => `ID: ${m.id} | Kind: ${m.entryKind} | Summary: ${m.summary}`).join("\n");

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

  let consolidatedCount = 0;

  for (const insight of object.consolidatedInsights) {
    if (insight.sourceMemoryIds.length > 1) {
      const embedding = await generateEmbedding(insight.summary);

      // Insert new consolidated memory
      await db.insert(aiMemoryEntries).values({
        organizationId,
        customerId,
        entryKind: insight.kind,
        memoryKey: insight.key,
        summary: insight.summary,
        importance: 90,
        tags: ["consolidated", "strategic"],
        embedding,
        confidence: 0.95,
      });

      // Soft delete the old ones
      for (const id of insight.sourceMemoryIds) {
        await db
          .update(aiMemoryEntries)
          .set({ deletedAt: new Date() })
          .where(eq(aiMemoryEntries.id, id));
      }
      consolidatedCount++;
    }
  }

  return { status: "success", consolidatedCount };
}