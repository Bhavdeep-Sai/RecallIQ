create extension if not exists vector;
alter table public.ai_memory_entries add column if not exists embedding vector(384);
create index if not exists ai_memory_entries_embedding_idx on public.ai_memory_entries using hnsw (embedding vector_cosine_ops);
