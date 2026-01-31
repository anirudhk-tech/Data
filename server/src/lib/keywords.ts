import OpenAI from "openai";
import type { PipelineSpec, KeywordsMetadata, ParsedCSV } from "./types";

// Keywords AI client (OpenAI-compatible)
let keywordsClient: OpenAI | null = null;

function getKeywordsClient(): OpenAI {
  if (!keywordsClient) {
    const apiKey = process.env.KEYWORDS_AI_API_KEY;
    const baseURL = process.env.KEYWORDS_BASE_URL || "https://api.keywordsai.co/api/";

    if (!apiKey) {
      throw new Error("Missing KEYWORDS_AI_API_KEY environment variable");
    }

    keywordsClient = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  return keywordsClient;
}

// ============================================
// Spec Generation
// ============================================

const SPEC_GENERATE_SYSTEM_PROMPT = `You are a data pipeline specification generator. Given a user's description of what they want to do with their CSV data, generate a pipeline specification in JSON format.

The pipeline spec must follow this schema:
{
  "nodes": [
    {
      "id": "unique_node_id",
      "op": "operation_type",
      "config": { ...operation-specific config... },
      "inputs": ["id_of_input_node"] // empty array for first node
    }
  ]
}

Available operations:
- parse_csv: Parse input CSV. Config: { "delimiter": "," }
- filter: Filter rows. Config: { "condition": "column_name == 'value'" or "column_name > 100" }
- select_columns: Keep only specified columns. Config: { "columns": ["col1", "col2"] }
- dedupe: Remove duplicate rows. Config: { "key_columns": ["col1", "col2"] }
- rename_columns: Rename columns. Config: { "mapping": { "old_name": "new_name" } }
- transform: Apply transformation. Config: { "column": "col_name", "expression": "lower(value)" }
- validate_email: Validate email format. Config: { "column": "email", "strict": true }
- fix_dates: Standardize date format. Config: { "column": "date_col", "format": "YYYY-MM-DD" }
- output_csv: Output as CSV. Config: { "delimiter": "," }

Rules:
1. Always start with parse_csv node
2. Always end with output_csv node  
3. Each node's inputs must reference valid previous node IDs
4. Generate a DAG (no cycles)

Return ONLY the JSON spec, no explanation.`;

export async function generatePipelineSpec(
  prompt: string,
  sampleData: ParsedCSV,
  metadata: KeywordsMetadata
): Promise<{ spec: PipelineSpec; traceId: string }> {
  const client = getKeywordsClient();

  const userMessage = `User request: ${prompt}

Sample data columns: ${sampleData.headers.join(", ")}
Sample rows (first 3):
${sampleData.rows.slice(0, 3).map((row) => row.join(", ")).join("\n")}

Generate the pipeline specification:`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SPEC_GENERATE_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    // Keywords AI metadata passed via extra headers or body
    // @ts-expect-error - Keywords AI specific field
    metadata: {
      run_id: metadata.run_id,
      pipeline_id: metadata.pipeline_id,
      pipeline_version_id: metadata.pipeline_version_id,
      stage: metadata.stage,
      iteration: metadata.iteration,
    },
  } as OpenAI.ChatCompletionCreateParamsNonStreaming);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from Keywords AI");
  }

  const spec = JSON.parse(content) as PipelineSpec;
  
  // Extract trace ID from response (Keywords AI specific)
  const traceId = (response as unknown as { id?: string }).id || `trace_${Date.now()}`;

  return { spec, traceId };
}

// ============================================
// Spec Repair
// ============================================

const SPEC_REPAIR_SYSTEM_PROMPT = `You are a data pipeline specification repair assistant. Given a pipeline spec that failed validation and the validation errors, fix the spec to resolve the errors.

Return ONLY the corrected JSON spec, no explanation.`;

export async function repairPipelineSpec(
  currentSpec: PipelineSpec,
  validationErrors: string[],
  metadata: KeywordsMetadata
): Promise<{ spec: PipelineSpec; traceId: string }> {
  const client = getKeywordsClient();

  const userMessage = `Current pipeline spec:
${JSON.stringify(currentSpec, null, 2)}

Validation errors:
${validationErrors.map((e, i) => `${i + 1}. ${e}`).join("\n")}

Fix the pipeline specification to resolve these errors:`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SPEC_REPAIR_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    // @ts-expect-error - Keywords AI specific field
    metadata: {
      run_id: metadata.run_id,
      pipeline_id: metadata.pipeline_id,
      pipeline_version_id: metadata.pipeline_version_id,
      stage: metadata.stage,
      iteration: metadata.iteration,
    },
  } as OpenAI.ChatCompletionCreateParamsNonStreaming);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from Keywords AI");
  }

  const spec = JSON.parse(content) as PipelineSpec;
  const traceId = (response as unknown as { id?: string }).id || `trace_${Date.now()}`;

  return { spec, traceId };
}
