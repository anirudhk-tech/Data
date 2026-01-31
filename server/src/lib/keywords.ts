import OpenAI from "openai";
import type { PipelineSpec, KeywordsMetadata, ParsedCSV } from "./types";

// Keywords AI client (OpenAI-compatible)
let keywordsClient: OpenAI | null = null;

// Prompt IDs from Keywords AI Prompt Manager
// Set these in your .env file after creating prompts in the Keywords AI dashboard
const SPEC_GENERATE_PROMPT_ID = process.env.KEYWORDS_SPEC_GENERATE_PROMPT_ID;
const SPEC_REPAIR_PROMPT_ID = process.env.KEYWORDS_SPEC_REPAIR_PROMPT_ID;

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
// Fallback prompts (used when prompt IDs not configured)
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

const SPEC_REPAIR_SYSTEM_PROMPT = `You are a data pipeline specification repair assistant. Given a pipeline spec that failed validation and the validation errors, fix the spec to resolve the errors.

Return ONLY the corrected JSON spec, no explanation.`;

// ============================================
// Spec Generation
// ============================================

export async function generatePipelineSpec(
  prompt: string,
  sampleData: ParsedCSV,
  metadata: KeywordsMetadata
): Promise<{ spec: PipelineSpec; traceId: string }> {
  const client = getKeywordsClient();

  // Build sample data string for the prompt
  const sampleColumns = sampleData.headers.join(", ");
  const sampleRows = sampleData.rows.slice(0, 3).map((row) => row.join(", ")).join("\n");

  // Check if using Keywords AI Prompt Manager
  if (SPEC_GENERATE_PROMPT_ID) {
    // Use Keywords AI Prompt Manager with variables
    const response = await client.chat.completions.create({
      model: "gpt-4o", // Will be overridden by prompt config
      messages: [{ role: "user", content: "placeholder" }], // Will be overridden
      response_format: { type: "json_object" },
      // @ts-expect-error - Keywords AI specific fields
      prompt: {
        prompt_id: SPEC_GENERATE_PROMPT_ID,
        variables: {
          user_request: prompt,
          sample_columns: sampleColumns,
          sample_rows: sampleRows,
        },
        override: true, // Use prompt config instead of SDK parameters
      },
      metadata: {
        run_id: metadata.run_id,
        pipeline_id: metadata.pipeline_id,
        pipeline_version_id: metadata.pipeline_version_id,
        stage: metadata.stage,
        iteration: String(metadata.iteration),
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

  // Fallback: Use hardcoded prompts
  const userMessage = `User request: ${prompt}

Sample data columns: ${sampleColumns}
Sample rows (first 3):
${sampleRows}

Generate the pipeline specification:`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SPEC_GENERATE_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    // @ts-expect-error - Keywords AI specific field
    metadata: {
      run_id: metadata.run_id,
      pipeline_id: metadata.pipeline_id,
      pipeline_version_id: metadata.pipeline_version_id,
      stage: metadata.stage,
      iteration: String(metadata.iteration),
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

// ============================================
// Spec Repair
// ============================================

export async function repairPipelineSpec(
  currentSpec: PipelineSpec,
  validationErrors: string[],
  metadata: KeywordsMetadata
): Promise<{ spec: PipelineSpec; traceId: string }> {
  const client = getKeywordsClient();

  const specJson = JSON.stringify(currentSpec, null, 2);
  const errorsText = validationErrors.map((e, i) => `${i + 1}. ${e}`).join("\n");

  // Check if using Keywords AI Prompt Manager
  if (SPEC_REPAIR_PROMPT_ID) {
    // Use Keywords AI Prompt Manager with variables
    const response = await client.chat.completions.create({
      model: "gpt-4o", // Will be overridden by prompt config
      messages: [{ role: "user", content: "placeholder" }], // Will be overridden
      response_format: { type: "json_object" },
      // @ts-expect-error - Keywords AI specific fields
      prompt: {
        prompt_id: SPEC_REPAIR_PROMPT_ID,
        variables: {
          current_spec: specJson,
          validation_errors: errorsText,
        },
        override: true,
      },
      metadata: {
        run_id: metadata.run_id,
        pipeline_id: metadata.pipeline_id,
        pipeline_version_id: metadata.pipeline_version_id,
        stage: metadata.stage,
        iteration: String(metadata.iteration),
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

  // Fallback: Use hardcoded prompts
  const userMessage = `Current pipeline spec:
${specJson}

Validation errors:
${errorsText}

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
      iteration: String(metadata.iteration),
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
