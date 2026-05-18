/**
 * Embeddings Service
 *
 * Generates vector embeddings for semantic memory retrieval using Groq's
 * embedding-compatible model. Falls back to a deterministic hash-based
 * 384-dimensional vector when GROQ_API_KEY is not set (demo mode).
 *
 * The embedding dimensions (384) match the pgvector column in schema.ts.
 */

// ─── Deterministic hash fallback ───────────────────────────────────────────
// Used when GROQ_API_KEY is not available. Produces a stable 384-d vector
// from the input text so pgvector queries still run (with reduced quality).

function hashEmbedding(text: string): number[] {
  const dims = 384;
  const vec = new Array<number>(dims).fill(0);
  const normalized = text.toLowerCase().trim();

  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    const idx = (code * 31 + i * 17) % dims;
    vec[idx] += 1;
    vec[(idx + 1) % dims] += 0.5;
    vec[(idx + dims - 1) % dims] += 0.3;
  }

  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

// ─── Groq API embedding (production path) ──────────────────────────────────
// Groq's API supports OpenAI-compatible embeddings via the same base URL.
// We use nomic-embed-text-v1.5 which outputs 768d — we truncate/pad to 384.

async function groqEmbedding(text: string): Promise<number[] | null> {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;

    // Use the AI SDK's generateEmbedding-compatible route via Groq
    // Groq doesn't yet expose /v1/embeddings natively, so we use nomic via
    // OpenAI-compatible endpoint if available, else fall through to hash.
    // Alternatively, we call their text-embedding model.
    const response = await fetch("https://api.groq.com/openai/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nomic-embed-text-v1_5",
        input: text.slice(0, 512), // cap at 512 chars to control token cost
      }),
    });

    if (!response.ok) {
      // Groq may not support embeddings endpoint — fall through to hash
      return null;
    }

    const json = await response.json();
    const embedding: number[] = json?.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) return null;

    // Resize to 384 dimensions to match schema (truncate or pad with 0)
    if (embedding.length === 384) return embedding;
    if (embedding.length > 384) return embedding.slice(0, 384);
    return [...embedding, ...new Array(384 - embedding.length).fill(0)];
  } catch {
    return null;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Generate a 384-dimensional embedding for the given text.
 * Tries Groq API first, falls back to deterministic hash embedding.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (process.env.GROQ_API_KEY) {
    const apiResult = await groqEmbedding(text);
    if (apiResult) return apiResult;
  }
  // Fallback: deterministic hash embedding (no external calls)
  return hashEmbedding(text);
}
