-- Migration: Create ideas table
-- Feature: PROJ-2 Idea Feed
-- Run this in your Supabase project: Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS ideas (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description   TEXT        NOT NULL CHECK (char_length(description) >= 1),
  status        TEXT        NOT NULL DEFAULT 'Planned'
                            CHECK (status IN ('Planned', 'In Progress', 'Done')),
  vote_count    INTEGER     NOT NULL DEFAULT 0 CHECK (vote_count >= 0),
  comment_count INTEGER     NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
  author_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Anyone (including visitors without an account) can read all ideas
CREATE POLICY "Ideas are publicly readable"
  ON ideas
  FOR SELECT
  USING (true);

-- Only authenticated users can submit ideas (author_id must match their own user id)
-- Full submission UI comes in PROJ-3; this policy is already in place
CREATE POLICY "Authenticated users can submit ideas"
  ON ideas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Authors can update only their own ideas (e.g. edit title/description)
-- Admin status management via PROJ-6 uses a separate admin policy
CREATE POLICY "Authors can update their own ideas"
  ON ideas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Only service_role (admin actions via PROJ-6) can delete ideas
-- No DELETE policy for authenticated users → ideas are not deletable by regular users

-- Performance indexes
-- Feed sorted by votes (default "Top" view)
CREATE INDEX IF NOT EXISTS idx_ideas_vote_count  ON ideas (vote_count DESC, created_at DESC);
-- Feed sorted by date ("Neu" view)
CREATE INDEX IF NOT EXISTS idx_ideas_created_at  ON ideas (created_at DESC);
-- Status filter
CREATE INDEX IF NOT EXISTS idx_ideas_status      ON ideas (status);
-- Author lookup (needed for PROJ-3 / PROJ-6)
CREATE INDEX IF NOT EXISTS idx_ideas_author_id   ON ideas (author_id);
