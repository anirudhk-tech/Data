-- Dagger Database Schema
-- Migration: 001_init

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pipelines table
CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID, -- Optional: for multi-tenant support
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipeline versions table
CREATE TABLE pipeline_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  spec_json JSONB, -- Can be null during generation
  source_prompt TEXT NOT NULL,
  created_by UUID, -- Optional: user who created this version
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(pipeline_id, version)
);

-- Runs table
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  pipeline_version_id UUID NOT NULL REFERENCES pipeline_versions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'running', 'success', 'failed')),
  
  -- Input info
  input_format TEXT NOT NULL DEFAULT 'csv',
  input_bytes INTEGER,
  input_hash TEXT,
  input_rows INTEGER,
  
  -- Output info
  output_rows INTEGER,
  output_base64 TEXT,
  
  -- Execution details
  fix_iterations INTEGER DEFAULT 0,
  exec_time_ms INTEGER,
  
  -- Evaluation results
  metrics_json JSONB,
  eval_json JSONB,
  validation_errors_json JSONB,
  
  -- Keywords AI tracing
  keywords_trace_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_rows CHECK (
    (status IN ('pending', 'validating', 'running')) OR 
    (status = 'success' AND output_rows IS NOT NULL) OR
    (status = 'failed')
  )
);

-- Artifacts table (for large outputs, exports, etc.)
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('output', 'export', 'log', 'other')),
  storage_path TEXT, -- Supabase Storage path
  content_type TEXT,
  size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_pipeline_versions_pipeline_id_version 
  ON pipeline_versions(pipeline_id, version DESC);

CREATE INDEX idx_runs_pipeline_version_id_created 
  ON runs(pipeline_version_id, created_at DESC);

CREATE INDEX idx_runs_pipeline_id_created 
  ON runs(pipeline_id, created_at DESC);

CREATE INDEX idx_runs_keywords_trace_id 
  ON runs(keywords_trace_id) 
  WHERE keywords_trace_id IS NOT NULL;

CREATE INDEX idx_runs_status 
  ON runs(status) 
  WHERE status IN ('pending', 'validating', 'running');

CREATE INDEX idx_artifacts_run_id 
  ON artifacts(run_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to pipelines
CREATE TRIGGER update_pipelines_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - disabled for service role access
-- Enable these and add policies when implementing user auth
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- Service role bypass policies (allows full access with service role key)
CREATE POLICY "Service role full access on pipelines" ON pipelines
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on pipeline_versions" ON pipeline_versions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on runs" ON runs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on artifacts" ON artifacts
  FOR ALL USING (true) WITH CHECK (true);

-- Helper view for pipeline list with latest run info
CREATE VIEW pipeline_list AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.created_at,
  (
    SELECT MAX(pv.version) 
    FROM pipeline_versions pv 
    WHERE pv.pipeline_id = p.id
  ) as latest_version,
  lr.id as last_run_id,
  lr.status as last_run_status,
  lr.created_at as last_run_at
FROM pipelines p
LEFT JOIN LATERAL (
  SELECT r.id, r.status, r.created_at
  FROM runs r
  WHERE r.pipeline_id = p.id
  ORDER BY r.created_at DESC
  LIMIT 1
) lr ON true
ORDER BY p.updated_at DESC;
