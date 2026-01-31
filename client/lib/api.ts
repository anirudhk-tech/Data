import type { 
  Pipeline, 
  PipelineVersion, 
  Run, 
  CreatePipelineRequest, 
  CreatePipelineResponse,
  PipelineSpec 
} from "./types";

// Mock Data
export const mockPipelines: Pipeline[] = [
  {
    id: "pipe_1",
    name: "Customer Deduplication",
    description: "Clean and dedupe customer records, keeping email, name, and company columns",
    created_at: "2026-01-28T10:30:00Z",
    last_run_at: "2026-01-30T14:22:00Z",
    last_run_status: "success",
  },
  {
    id: "pipe_2",
    name: "Sales Data Cleanup",
    description: "Standardize sales records, fix date formats, and remove duplicates",
    created_at: "2026-01-25T08:15:00Z",
    last_run_at: "2026-01-29T09:45:00Z",
    last_run_status: "success",
  },
  {
    id: "pipe_3",
    name: "Email List Validation",
    description: "Validate email addresses and remove invalid entries",
    created_at: "2026-01-20T16:00:00Z",
    last_run_at: "2026-01-27T11:30:00Z",
    last_run_status: "failed",
  },
];

export const mockPipelineVersions: Record<string, PipelineVersion[]> = {
  pipe_1: [
    {
      id: "pver_1_1",
      pipeline_id: "pipe_1",
      version: 1,
      spec: {
        nodes: [
          { id: "n1", op: "parse_csv", config: { delimiter: "," }, inputs: [] },
          { id: "n2", op: "dedupe", config: { key_columns: ["email"] }, inputs: ["n1"] },
          { id: "n3", op: "select_columns", config: { columns: ["email", "name", "company"] }, inputs: ["n2"] },
        ],
      },
      created_at: "2026-01-28T10:30:00Z",
    },
  ],
  pipe_2: [
    {
      id: "pver_2_1",
      pipeline_id: "pipe_2",
      version: 1,
      spec: {
        nodes: [
          { id: "n1", op: "parse_csv", config: { delimiter: "," }, inputs: [] },
          { id: "n2", op: "fix_dates", config: { format: "YYYY-MM-DD" }, inputs: ["n1"] },
          { id: "n3", op: "dedupe", config: { key_columns: ["order_id"] }, inputs: ["n2"] },
        ],
      },
      created_at: "2026-01-25T08:15:00Z",
    },
  ],
  pipe_3: [
    {
      id: "pver_3_1",
      pipeline_id: "pipe_3",
      version: 1,
      spec: {
        nodes: [
          { id: "n1", op: "parse_csv", config: { delimiter: "," }, inputs: [] },
          { id: "n2", op: "validate_email", config: { strict: true }, inputs: ["n1"] },
          { id: "n3", op: "filter", config: { condition: "email_valid == true" }, inputs: ["n2"] },
        ],
      },
      created_at: "2026-01-20T16:00:00Z",
    },
  ],
};

export const mockRuns: Record<string, Run[]> = {
  pipe_1: [
    {
      id: "run_1_1",
      pipeline_id: "pipe_1",
      pipeline_version_id: "pver_1_1",
      status: "success",
      input_rows: 1200,
      output_rows: 1133,
      fix_iterations: 1,
      eval_score: 1.0,
      constraint_pass: true,
      keywords_trace_id: "kw_trace_abc123",
      created_at: "2026-01-30T14:22:00Z",
      output_base64: null,
    },
    {
      id: "run_1_2",
      pipeline_id: "pipe_1",
      pipeline_version_id: "pver_1_1",
      status: "success",
      input_rows: 850,
      output_rows: 812,
      fix_iterations: 0,
      eval_score: 1.0,
      constraint_pass: true,
      keywords_trace_id: "kw_trace_def456",
      created_at: "2026-01-29T10:15:00Z",
      output_base64: null,
    },
  ],
  pipe_2: [
    {
      id: "run_2_1",
      pipeline_id: "pipe_2",
      pipeline_version_id: "pver_2_1",
      status: "success",
      input_rows: 5000,
      output_rows: 4823,
      fix_iterations: 2,
      eval_score: 0.98,
      constraint_pass: true,
      keywords_trace_id: "kw_trace_ghi789",
      created_at: "2026-01-29T09:45:00Z",
      output_base64: null,
    },
  ],
  pipe_3: [
    {
      id: "run_3_1",
      pipeline_id: "pipe_3",
      pipeline_version_id: "pver_3_1",
      status: "failed",
      input_rows: 2500,
      output_rows: 0,
      fix_iterations: 3,
      eval_score: null,
      constraint_pass: false,
      keywords_trace_id: "kw_trace_jkl012",
      created_at: "2026-01-27T11:30:00Z",
      output_base64: null,
    },
  ],
};

// Sample output data for preview
export const mockOutputData = {
  headers: ["email", "name", "company"],
  rows: [
    ["john@acme.com", "John Smith", "Acme Corp"],
    ["jane@techco.io", "Jane Doe", "TechCo"],
    ["bob@startup.xyz", "Bob Johnson", "Startup XYZ"],
    ["alice@enterprise.com", "Alice Williams", "Enterprise Inc"],
    ["charlie@agency.net", "Charlie Brown", "Digital Agency"],
    ["diana@consulting.co", "Diana Prince", "Consulting Partners"],
    ["evan@solutions.biz", "Evan Rogers", "Solutions Ltd"],
    ["fiona@global.org", "Fiona Chen", "Global Nonprofit"],
    ["george@retail.shop", "George Miller", "Retail Plus"],
    ["hannah@finance.bank", "Hannah Lee", "Finance Bank"],
  ],
};

// API Client Functions (stubs)
export async function getPipelines(): Promise<Pipeline[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockPipelines;
}

export async function getPipeline(id: string): Promise<{ pipeline: Pipeline; versions: PipelineVersion[]; runs: Run[] } | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const pipeline = mockPipelines.find((p) => p.id === id);
  if (!pipeline) return null;
  
  return {
    pipeline,
    versions: mockPipelineVersions[id] || [],
    runs: mockRuns[id] || [],
  };
}

export async function getRun(id: string): Promise<Run | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  for (const runs of Object.values(mockRuns)) {
    const run = runs.find((r) => r.id === id);
    if (run) return run;
  }
  return null;
}

export async function createAndRunPipeline(
  request: CreatePipelineRequest
): Promise<CreatePipelineResponse> {
  // This would call POST /run in the real implementation
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  const newPipelineId = `pipe_${Date.now()}`;
  const newVersionId = `pver_${Date.now()}`;
  const newRunId = `run_${Date.now()}`;
  
  return {
    pipeline_id: newPipelineId,
    pipeline_version_id: newVersionId,
    run_id: newRunId,
    output: {
      format: "csv",
      content_base64: btoa("email,name,company\njohn@example.com,John,Acme"),
    },
    report: {
      pipeline_spec: {
        nodes: [
          { id: "n1", op: "parse_csv", config: {}, inputs: [] },
          { id: "n2", op: "transform", config: {}, inputs: ["n1"] },
        ],
      },
      validation_errors: [],
      fix_iterations: 1,
      metrics: {
        input_rows: 100,
        output_rows: 95,
      },
      eval: {
        constraint_pass: true,
        score: 1.0,
      },
      keywords_trace_id: `kw_trace_${Date.now()}`,
    },
  };
}

export async function rerunPipeline(
  pipelineId: string,
  data: { format: "csv"; content_base64: string }
): Promise<{ run_id: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { run_id: `run_${Date.now()}` };
}

export async function exportDocker(pipelineVersionId: string): Promise<{ download_url: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { download_url: `https://example.com/export/${pipelineVersionId}.tar.gz` };
}
