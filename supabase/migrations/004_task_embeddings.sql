CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS embedding vector(384);

CREATE INDEX IF NOT EXISTS tasks_embedding_idx ON tasks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
