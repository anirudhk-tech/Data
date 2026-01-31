import type { ParsedCSV, PipelineSpec, RunMetrics, RunEval } from "./types";

// ============================================
// Metrics Computation
// ============================================

export function computeMetrics(
  inputCSV: ParsedCSV,
  outputCSV: ParsedCSV,
  execTimeMs: number
): RunMetrics {
  const inputRows = inputCSV.rows.length;
  const outputRows = outputCSV.rows.length;

  // Calculate null rate in output
  let nullCount = 0;
  let totalCells = 0;

  for (const row of outputCSV.rows) {
    for (const cell of row) {
      totalCells++;
      if (cell === "" || cell === null || cell === undefined) {
        nullCount++;
      }
    }
  }

  const nullRate = totalCells > 0 ? nullCount / totalCells : 0;

  return {
    input_rows: inputRows,
    output_rows: outputRows,
    null_rate: nullRate,
    exec_time_ms: execTimeMs,
  };
}

// ============================================
// Evaluation
// ============================================

export function evaluateRun(
  spec: PipelineSpec,
  inputCSV: ParsedCSV,
  outputCSV: ParsedCSV,
  validationErrors: string[]
): RunEval {
  const schemaMatch = checkSchemaMatch(spec, outputCSV);
  const constraintPass = checkConstraints(spec, inputCSV, outputCSV);
  const execSuccess = validationErrors.length === 0 && outputCSV.rows.length > 0;

  // Calculate overall score (0-1)
  let score = 0;
  if (schemaMatch) score += 0.3;
  if (constraintPass) score += 0.4;
  if (execSuccess) score += 0.3;

  return {
    schema_match: schemaMatch,
    constraint_pass: constraintPass,
    exec_success: execSuccess,
    score,
  };
}

// ============================================
// Schema Validation
// ============================================

function checkSchemaMatch(spec: PipelineSpec, outputCSV: ParsedCSV): boolean {
  // Find select_columns node to determine expected output columns
  const selectNode = spec.nodes.find((n) => n.op === "select_columns");

  if (selectNode && selectNode.config.columns) {
    const expectedColumns = selectNode.config.columns as string[];
    const actualColumns = outputCSV.headers;

    // Check if all expected columns are present
    for (const col of expectedColumns) {
      if (!actualColumns.includes(col)) {
        return false;
      }
    }
  }

  return true;
}

// ============================================
// Constraint Checking
// ============================================

function checkConstraints(
  spec: PipelineSpec,
  inputCSV: ParsedCSV,
  outputCSV: ParsedCSV
): boolean {
  // Check dedupe constraint: after dedupe, key columns should be unique
  const dedupeNode = spec.nodes.find((n) => n.op === "dedupe");

  if (dedupeNode && dedupeNode.config.key_columns) {
    const keyColumns = dedupeNode.config.key_columns as string[];
    const keyIndices = keyColumns.map((col) => outputCSV.headers.indexOf(col));

    if (keyIndices.some((i) => i === -1)) {
      // Key column not found in output
      return false;
    }

    // Check uniqueness
    const seen = new Set<string>();
    for (const row of outputCSV.rows) {
      const key = keyIndices.map((i) => row[i]).join("|");
      if (seen.has(key)) {
        return false; // Duplicate found
      }
      seen.add(key);
    }
  }

  // Check that output has data (unless filter could legitimately remove all)
  const hasFilter = spec.nodes.some((n) => n.op === "filter");
  if (!hasFilter && inputCSV.rows.length > 0 && outputCSV.rows.length === 0) {
    return false;
  }

  // Check null rate threshold (max 20% nulls in output)
  let nullCount = 0;
  let totalCells = 0;
  for (const row of outputCSV.rows) {
    for (const cell of row) {
      totalCells++;
      if (cell === "" || cell === null || cell === undefined) {
        nullCount++;
      }
    }
  }
  const nullRate = totalCells > 0 ? nullCount / totalCells : 0;
  if (nullRate > 0.2) {
    return false;
  }

  return true;
}

// ============================================
// Summary Generation
// ============================================

export interface QualityCheckResult {
  name: string;
  passed: boolean;
  message: string;
}

export function generateQualityChecks(
  spec: PipelineSpec,
  inputCSV: ParsedCSV,
  outputCSV: ParsedCSV,
  metrics: RunMetrics,
  evalResult: RunEval
): QualityCheckResult[] {
  const checks: QualityCheckResult[] = [];

  // Schema check
  checks.push({
    name: "Schema Match",
    passed: evalResult.schema_match,
    message: evalResult.schema_match
      ? "Output columns match expected schema"
      : "Output columns do not match expected schema",
  });

  // Constraint check
  checks.push({
    name: "Constraints",
    passed: evalResult.constraint_pass,
    message: evalResult.constraint_pass
      ? "All data constraints satisfied"
      : "One or more constraints failed",
  });

  // Row count check
  const rowReduction = inputCSV.rows.length > 0
    ? ((inputCSV.rows.length - outputCSV.rows.length) / inputCSV.rows.length) * 100
    : 0;
  
  checks.push({
    name: "Row Count",
    passed: true,
    message: `${outputCSV.rows.length} rows output (${rowReduction.toFixed(1)}% reduction)`,
  });

  // Null rate check
  const nullRate = metrics.null_rate || 0;
  checks.push({
    name: "Data Quality",
    passed: nullRate <= 0.2,
    message: nullRate <= 0.2
      ? `Null rate: ${(nullRate * 100).toFixed(1)}%`
      : `High null rate: ${(nullRate * 100).toFixed(1)}%`,
  });

  // Execution time check
  checks.push({
    name: "Performance",
    passed: metrics.exec_time_ms < 5000,
    message: `Executed in ${metrics.exec_time_ms}ms`,
  });

  return checks;
}
