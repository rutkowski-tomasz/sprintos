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

CREATE TABLE IF NOT EXISTS sprints (
  id             uuid        PRIMARY KEY,
  "userId"       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  "startDate"    date        NOT NULL,
  "endDate"      date        NOT NULL,
  version        integer     NOT NULL DEFAULT 1,
  "createdAt"    timestamptz NOT NULL DEFAULT now(),
  "updatedAt"    timestamptz NOT NULL DEFAULT now(),
  "deletedAt"    timestamptz
);

CREATE INDEX IF NOT EXISTS sprints_userId_idx   ON sprints ("userId");
CREATE INDEX IF NOT EXISTS sprints_startDate_idx ON sprints ("startDate");
CREATE INDEX IF NOT EXISTS sprints_endDate_idx   ON sprints ("endDate");

CREATE TABLE IF NOT EXISTS tasks (
  id             uuid        PRIMARY KEY,
  "userId"       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "sprintId"     uuid        REFERENCES sprints(id) ON DELETE SET NULL,
  "goalId"       uuid        REFERENCES goals(id)   ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS tasks_sprintId_idx  ON tasks ("sprintId");
CREATE INDEX IF NOT EXISTS tasks_goalId_idx    ON tasks ("goalId");
CREATE INDEX IF NOT EXISTS tasks_status_idx    ON tasks (status);
CREATE INDEX IF NOT EXISTS tasks_createdAt_idx ON tasks ("createdAt");
