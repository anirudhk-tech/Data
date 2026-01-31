// Pipeline Types
export interface Pipeline {
  id: string;
  name: string;
  description: string;
  created_at: string;
  last_run_at: string | null;
  last_run_status: 'success' | 'failed' | null;
}

export interface PipelineVersion {
  id: string;
  pipeline_id: string;
  version: number;
  spec: PipelineSpec;
  created_at: string;
}

export interface PipelineSpec {
  nodes: PipelineNode[];
}

export interface PipelineNode {
  id: string;
  op: string;
  config: Record<string, unknown>;
  inputs?: string[];
}

// Run Types
export interface Run {
  id: string;
  pipeline_id: string;
  pipeline_version_id: string;
  status: 'pending' | 'validating' | 'running' | 'success' | 'failed';
  input_rows: number;
  output_rows: number;
  fix_iterations: number;
  eval_score: number | null;
  constraint_pass: boolean | null;
  keywords_trace_id: string | null;
  created_at: string;
  output_base64: string | null;
  logs: LogEntry[] | null;
}

// Execution Log Types
export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug';
export type LogSource = 'system' | 'keywords' | 'wasm' | 'validator' | 'executor';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
  details?: Record<string, unknown>;
  duration_ms?: number;
}

// Live Builder Types
export type AgentPhase = 
  | 'analyzing' 
  | 'generating' 
  | 'validating' 
  | 'executing' 
  | 'evaluating' 
  | 'complete' 
  | 'failed';

export interface LiveBuilderState {
  runId: string;
  phase: AgentPhase;
  currentIteration: number;
  maxIterations: number;
  currentSpec: PipelineSpec | null;
  validationErrors: ValidationError[];
  isComplete: boolean;
  finalStatus: 'success' | 'failed' | null;
}

export interface ValidationError {
  iteration: number;
  errors: string[];
  timestamp: string;
  fixed: boolean;
}

export interface LiveBuilderEvent {
  type: 'phase_change' | 'spec_update' | 'validation_result' | 'complete';
  payload: Partial<LiveBuilderState>;
  timestamp: string;
}

// API Request/Response Types
export interface CreatePipelineRequest {
  prompt: string;
  data: {
    format: 'csv';
    content_base64: string;
  };
  options?: {
    output_format?: 'csv';
    max_fix_iters?: number;
  };
}

export interface CreatePipelineResponse {
  pipeline_id: string;
  pipeline_version_id: string;
  run_id: string;
  output: {
    format: 'csv';
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

// CSV Data Types
export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}
