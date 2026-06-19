CREATE TABLE IF NOT EXISTS goals (
  id             uuid        PRIMARY KEY,
  "userId"       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  emoji          text,
  quarter        text        NOT NULL,
  description    text,
  version        integer     NOT NULL DEFAULT 1,
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now(),
  "deletedAt"    timestamptz
);

CREATE INDEX IF NOT EXISTS goals_userId_idx ON goals ("userId");

CREATE TABLE IF NOT EXISTS tasks (
  id             uuid        PRIMARY KEY,
  "userId"       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sprint         text,
  "goalId"       uuid        REFERENCES goals(id) ON DELETE SET NULL,
  name           text        NOT NULL,
  emoji          text,
  status         integer     NOT NULL DEFAULT 0,
  "eventDate"    timestamptz,
  snooze         text,
  description    text,
  "sourceUrl"    text,
  duration       integer,
  version        integer     NOT NULL DEFAULT 1,
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now(),
  "deletedAt"    timestamptz
);

CREATE INDEX IF NOT EXISTS tasks_userId_idx    ON tasks ("userId");
CREATE INDEX IF NOT EXISTS tasks_sprint_idx    ON tasks (sprint);
CREATE INDEX IF NOT EXISTS tasks_goalId_idx    ON tasks ("goalId");
CREATE INDEX IF NOT EXISTS tasks_status_idx    ON tasks (status);
CREATE INDEX IF NOT EXISTS tasks_createdAt_idx ON tasks ("createdAt");
