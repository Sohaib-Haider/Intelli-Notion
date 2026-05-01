-- Migration: add assignee_ids column to tasks table
-- Run this SQL against your Supabase database (via supabase db push or SQL editor)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS assignee_ids uuid[] DEFAULT array[]::uuid[];
