# Keywords AI Prompt Setup Guide

This guide walks you through setting up prompts in the [Keywords AI Prompt Manager](https://platform.keywordsai.co/platform/prompts) for Dagger.

## Why Use Prompt Manager?

Instead of hardcoding prompts in the codebase, Keywords AI Prompt Manager lets you:
- **Version control prompts** - Track changes and rollback if needed
- **A/B test variations** - Try different prompt versions without code deploys
- **Monitor performance** - See latency, token usage, and success rates per prompt
- **Collaborate** - Team members can edit prompts without touching code

## Setup Instructions

### 1. Create the Spec Generation Prompt

1. Go to [Keywords AI Prompts](https://platform.keywordsai.co/platform/prompts)
2. Click **"Create new prompt"**
3. Name it: `dagger-spec-generate`
4. Add description: `Generates pipeline DAG spec from natural language`

#### System Message:
```
You are a data pipeline specification generator. Given a user's description of what they want to do with their CSV data, generate a pipeline specification in JSON format.

The pipeline spec must follow this schema:
{
  "nodes": [
    {
      "id": "unique_node_id",
      "op": "operation_type",
      "config": { ...operation-specific config... },
      "inputs": ["id_of_input_node"]
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

Return ONLY the JSON spec, no explanation.
```

#### User Message (with variables):
```
User request: {{user_request}}

Sample data columns: {{sample_columns}}
Sample rows (first 3):
{{sample_rows}}

Generate the pipeline specification:
```

#### Configuration:
- **Model**: `gpt-4o`
- **Temperature**: `0.2` (low for consistent outputs)
- **Response Format**: JSON Object

5. Click **Commit** with message: `Initial version`
6. Go to **Deployments** tab and click **Deploy**
7. Copy the **Prompt ID** from the Overview panel

---

### 2. Create the Spec Repair Prompt

1. Click **"Create new prompt"**
2. Name it: `dagger-spec-repair`
3. Add description: `Repairs invalid pipeline specs based on validation errors`

#### System Message:
```
You are a data pipeline specification repair assistant. Given a pipeline spec that failed validation and the validation errors, fix the spec to resolve the errors.

The fixed spec must still follow this schema:
{
  "nodes": [
    {
      "id": "unique_node_id",
      "op": "operation_type",
      "config": { ...operation-specific config... },
      "inputs": ["id_of_input_node"]
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
5. Fix ONLY the errors mentioned - don't change working parts

Return ONLY the corrected JSON spec, no explanation.
```

#### User Message (with variables):
```
Current pipeline spec:
{{current_spec}}

Validation errors:
{{validation_errors}}

Fix the pipeline specification to resolve these errors:
```

#### Configuration:
- **Model**: `gpt-4o`
- **Temperature**: `0.1` (very low for precise fixes)
- **Response Format**: JSON Object

5. Click **Commit** with message: `Initial version`
6. Go to **Deployments** tab and click **Deploy**
7. Copy the **Prompt ID** from the Overview panel

---

### 3. Add Prompt IDs to Environment

Add the prompt IDs to your `.env` file:

```env
KEYWORDS_SPEC_GENERATE_PROMPT_ID=your-generate-prompt-id
KEYWORDS_SPEC_REPAIR_PROMPT_ID=your-repair-prompt-id
```

---

## Variables Reference

### Spec Generation Prompt

| Variable | Description | Example |
|----------|-------------|---------|
| `{{user_request}}` | The user's natural language description | "Clean emails and dedupe by company" |
| `{{sample_columns}}` | Comma-separated column headers | "email, name, company, created_at" |
| `{{sample_rows}}` | First 3 rows of data | "john@acme.com, John, Acme, 2024-01-15" |

### Spec Repair Prompt

| Variable | Description | Example |
|----------|-------------|---------|
| `{{current_spec}}` | The JSON spec that failed validation | `{"nodes": [...]}` |
| `{{validation_errors}}` | Numbered list of errors | "1. Unknown operation: filterr" |

---

## Monitoring

After deploying, you can monitor prompt performance at:
- [Keywords AI Logs](https://platform.keywordsai.co/platform/requests) - Filter by prompt name
- [Keywords AI Analytics](https://platform.keywordsai.co/platform/analytics) - See aggregate metrics

Each pipeline run's trace ID links directly to the detailed request log in Keywords AI.

---

## Iterating on Prompts

1. Edit the prompt in the Editor tab
2. Test with sample inputs using the **Run** button
3. When satisfied, click **Commit** with a descriptive message
4. Deploy the new version to production

Your code doesn't need to change - it always uses the deployed version of the prompt.
