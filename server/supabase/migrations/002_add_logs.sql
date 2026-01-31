-- Add logs_json column to runs table for execution logging
-- Migration: 002_add_logs

ALTER TABLE runs ADD COLUMN IF NOT EXISTS logs_json JSONB;

-- Add comment describing the column
COMMENT ON COLUMN runs.logs_json IS 'Execution logs from pipeline processing (system, keywords, wasm, validator, executor)';
