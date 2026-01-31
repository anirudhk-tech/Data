// ============================================
// Database Types (matching Supabase schema)
// ============================================

export interface DbPipeline {
  id: string;
  name: string;
  description: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPipelineVersion {
  id: string;
  pipeline_id: string;
  version: number;
  spec_json: PipelineSpec | null;
  source_prompt: string;
  created_by: string | null;
  created_at: string;
}

export interface DbRun {
  id: string;
  pipeline_id: string;
  pipeline_version_id: string;
  status: RunStatus;
  input_format: string;
  input_bytes: number | null;
  input_hash: string | null;
  input_rows: number | null;
  output_rows: number | null;
  output_base64: string | null;
  fix_iterations: number;
  exec_time_ms: number | null;
  metrics_json: RunMetrics | null;
  eval_json: RunEval | null;
  validation_errors_json: string[] | null;
  keywords_trace_id: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface DbArtifact {
  id: string;
  run_id: string | null;
  kind: "output" | "export" | "log" | "other";
  storage_path: string | null;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

// ============================================
// Pipeline Spec Types
// ============================================

export interface PipelineSpec {
  nodes: PipelineNode[];
}

export interface PipelineNode {
  id: string;
  op: PipelineOp;
  config: Record<string, unknown>;
  inputs?: string[];
}

export type PipelineOp =
  | "parse_csv"
  | "filter"
  | "select_columns"
  | "dedupe"
  | "rename_columns"
  | "transform"
  | "validate_email"
  | "fix_dates"
  | "output_csv";

// ============================================
// Run Types
// ============================================

export type RunStatus = "pending" | "validating" | "running" | "success" | "failed";

export interface RunMetrics {
  input_rows: number;
  output_rows: number;
  null_rate?: number;
  exec_time_ms: number;
}

export interface RunEval {
  schema_match: boolean;
  constraint_pass: boolean;
  exec_success: boolean;
  score: number;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreatePipelineRequest {
  prompt: string;
  data: {
    format: "csv";
    content_base64: string;
  };
  options?: {
    output_format?: "csv";
    max_fix_iters?: number;
    strict?: boolean;
  };
}

export interface CreatePipelineResponse {
  pipeline_id: string;
  pipeline_version_id: string;
  run_id: string;
  output: {
    format: "csv";
    content_base64: string;
  };
  report: {
    pipeline_spec: PipelineSpec;
    validation_errors: string[];
    fix_iterations: number;
    metrics: {
      input_rows: number;
      output_rows: number;
    };
    eval: {
      constraint_pass: boolean;
      score: number;
    };
    keywords_trace_id: string;
  };
}

export interface PipelineListItem {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  latest_version: number | null;
  last_run: {
    run_id: string;
    status: RunStatus;
    created_at: string;
  } | null;
}

export interface PipelineDetailResponse {
  pipeline_id: string;
  name: string;
  description: string | null;
  created_at: string;
  versions: {
    pipeline_version_id: string;
    version: number;
    created_at: string;
    source_prompt: string;
    spec_json: PipelineSpec | null;
  }[];
}

export interface RunDetailResponse {
  id: string;
  pipeline_id: string;
  pipeline_version_id: string;
  status: RunStatus;
  input_rows: number | null;
  output_rows: number | null;
  fix_iterations: number;
  eval_score: number | null;
  constraint_pass: boolean | null;
  keywords_trace_id: string | null;
  created_at: string;
  finished_at: string | null;
  output_base64: string | null;
  validation_errors: string[] | null;
  metrics: RunMetrics | null;
}

export interface RerunPipelineRequest {
  pipeline_version_id: string;
  data: {
    format: "csv";
    content_base64: string;
  };
  options?: {
    output_format?: "csv";
  };
}

export interface RerunPipelineResponse {
  run_id: string;
  output: {
    format: "csv";
    content_base64: string;
  };
  report: {
    metrics: {
      input_rows: number;
      output_rows: number;
    };
    eval: {
      constraint_pass: boolean;
      score: number;
    };
  };
}

export interface ExportDockerRequest {
  pipeline_version_id: string;
}

export interface ExportDockerResponse {
  download_url: string;
}

// ============================================
// Keywords AI Types
// ============================================

export interface KeywordsMetadata {
  run_id: string;
  pipeline_id: string;
  pipeline_version_id: string;
  stage: "spec_generate" | "spec_repair";
  iteration: number;
}

// ============================================
// Validation Types
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================
// CSV Types
// ============================================

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}
