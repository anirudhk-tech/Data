import type { PipelineSpec, PipelineNode, ParsedCSV, ValidationResult } from "./types";
import { csvToRecords, recordsToCSV } from "./csv";

// ============================================
// WASM Engine Interface
// ============================================

// For v0, we implement validation and execution in TypeScript
// This can be replaced with actual WASM module later

// ============================================
// Validation (TypeScript implementation for v0)
// ============================================

export function validatePipeline(spec: PipelineSpec): ValidationResult {
  const errors: string[] = [];

  if (!spec || !spec.nodes || !Array.isArray(spec.nodes)) {
    return { valid: false, errors: ["Invalid spec: missing nodes array"] };
  }

  if (spec.nodes.length === 0) {
    return { valid: false, errors: ["Pipeline must have at least one node"] };
  }

  const nodeIds = new Set<string>();
  const nodeMap = new Map<string, PipelineNode>();

  // Build node map and check for duplicate IDs
  for (const node of spec.nodes) {
    if (!node.id) {
      errors.push("Node missing required 'id' field");
      continue;
    }

    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    nodeIds.add(node.id);
    nodeMap.set(node.id, node);
  }

  // Validate each node
  for (const node of spec.nodes) {
    // Check required fields
    if (!node.op) {
      errors.push(`Node ${node.id}: missing 'op' field`);
      continue;
    }

    // Validate operation type
    const validOps = [
      "parse_csv",
      "filter",
      "select_columns",
      "dedupe",
      "rename_columns",
      "transform",
      "validate_email",
      "fix_dates",
      "output_csv",
    ];

    if (!validOps.includes(node.op)) {
      errors.push(`Node ${node.id}: unknown operation '${node.op}'`);
    }

    // Validate inputs reference existing nodes
    if (node.inputs && node.inputs.length > 0) {
      for (const inputId of node.inputs) {
        if (!nodeIds.has(inputId)) {
          errors.push(`Node ${node.id}: references unknown input '${inputId}'`);
        }
      }
    }

    // Validate operation-specific config
    const configErrors = validateNodeConfig(node);
    errors.push(...configErrors);
  }

  // Check for parse_csv at start
  const firstNode = spec.nodes[0];
  if (firstNode && firstNode.op !== "parse_csv") {
    errors.push("Pipeline must start with parse_csv node");
  }

  // Check for output_csv at end
  const lastNode = spec.nodes[spec.nodes.length - 1];
  if (lastNode && lastNode.op !== "output_csv") {
    errors.push("Pipeline must end with output_csv node");
  }

  // Check for cycles (simple check: ensure inputs only reference earlier nodes)
  const nodeOrder = new Map<string, number>();
  spec.nodes.forEach((node, index) => nodeOrder.set(node.id, index));

  for (const node of spec.nodes) {
    if (node.inputs) {
      for (const inputId of node.inputs) {
        const inputIndex = nodeOrder.get(inputId);
        const nodeIndex = nodeOrder.get(node.id);
        if (inputIndex !== undefined && nodeIndex !== undefined && inputIndex >= nodeIndex) {
          errors.push(`Node ${node.id}: creates cycle by referencing '${inputId}'`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateNodeConfig(node: PipelineNode): string[] {
  const errors: string[] = [];
  const config = node.config || {};

  switch (node.op) {
    case "select_columns":
      if (!config.columns || !Array.isArray(config.columns)) {
        errors.push(`Node ${node.id}: select_columns requires 'columns' array`);
      }
      break;

    case "dedupe":
      if (!config.key_columns || !Array.isArray(config.key_columns)) {
        errors.push(`Node ${node.id}: dedupe requires 'key_columns' array`);
      }
      break;

    case "filter":
      if (!config.condition || typeof config.condition !== "string") {
        errors.push(`Node ${node.id}: filter requires 'condition' string`);
      }
      break;

    case "rename_columns":
      if (!config.mapping || typeof config.mapping !== "object") {
        errors.push(`Node ${node.id}: rename_columns requires 'mapping' object`);
      }
      break;

    case "transform":
      if (!config.column || typeof config.column !== "string") {
        errors.push(`Node ${node.id}: transform requires 'column' string`);
      }
      if (!config.expression || typeof config.expression !== "string") {
        errors.push(`Node ${node.id}: transform requires 'expression' string`);
      }
      break;

    case "validate_email":
      if (!config.column || typeof config.column !== "string") {
        errors.push(`Node ${node.id}: validate_email requires 'column' string`);
      }
      break;

    case "fix_dates":
      if (!config.column || typeof config.column !== "string") {
        errors.push(`Node ${node.id}: fix_dates requires 'column' string`);
      }
      break;
  }

  return errors;
}

// ============================================
// Execution (TypeScript implementation for v0)
// ============================================

export function runPipeline(spec: PipelineSpec, inputCSV: ParsedCSV): ParsedCSV {
  let data = csvToRecords(inputCSV);
  let headers = [...inputCSV.headers];

  for (const node of spec.nodes) {
    const result = executeNode(node, data, headers);
    data = result.data;
    headers = result.headers;
  }

  return recordsToCSV(data, headers);
}

function executeNode(
  node: PipelineNode,
  data: Record<string, string>[],
  headers: string[]
): { data: Record<string, string>[]; headers: string[] } {
  switch (node.op) {
    case "parse_csv":
      // Input is already parsed
      return { data, headers };

    case "output_csv":
      // Output is handled by caller
      return { data, headers };

    case "filter":
      return executeFilter(node, data, headers);

    case "select_columns":
      return executeSelectColumns(node, data, headers);

    case "dedupe":
      return executeDedupe(node, data, headers);

    case "rename_columns":
      return executeRenameColumns(node, data, headers);

    case "transform":
      return executeTransform(node, data, headers);

    case "validate_email":
      return executeValidateEmail(node, data, headers);

    case "fix_dates":
      return executeFixDates(node, data, headers);

    default:
      console.warn(`Unknown operation: ${node.op}, passing through`);
      return { data, headers };
  }
}

function executeFilter(
  node: PipelineNode,
  data: Record<string, string>[],
  headers: string[]
): { data: Record<string, string>[]; headers: string[] } {
  const condition = node.config.condition as string;

  // Parse simple conditions like "column == 'value'" or "column > 100"
  const match = condition.match(/^(\w+)\s*(==|!=|>|<|>=|<=|contains)\s*(.+)$/);

  if (!match) {
    console.warn(`Cannot parse filter condition: ${condition}`);
    return { data, headers };
  }

  const [, column, operator, rawValue] = match;
  const value = rawValue.replace(/^['"]|['"]$/g, ""); // Remove quotes

  const filtered = data.filter((row) => {
    const cellValue = row[column] || "";

    switch (operator) {
      case "==":
        return cellValue === value;
      case "!=":
        return cellValue !== value;
      case ">":
        return parseFloat(cellValue) > parseFloat(value);
      case "<":
        return parseFloat(cellValue) < parseFloat(value);
      case ">=":
        return parseFloat(cellValue) >= parseFloat(value);
      case "<=":
        return parseFloat(cellValue) <= parseFloat(value);
      case "contains":
        return cellValue.toLowerCase().includes(value.toLowerCase());
      default:
        return true;
    }
  });

  return { data: filtered, headers };
}

function executeSelectColumns(
  node: PipelineNode,
  data: Record<string, string>[],
  headers: string[]
): { data: Record<string, string>[]; headers: string[] } {
  const columns = node.config.columns as string[];

  const selected = data.map((row) => {
    const newRow: Record<string, string> = {};
    for (const col of columns) {
      newRow[col] = row[col] || "";
    }
    return newRow;
  });

  return { data: selected, headers: columns };
}

function executeDedupe(
  node: PipelineNode,
  data: Record<string, string>[],
  headers: string[]
): { data: Record<string, string>[]; headers: string[] } {
  const keyColumns = node.config.key_columns as string[];

  const seen = new Set<string>();
  const deduped: Record<string, string>[] = [];

  for (const row of data) {
    const key = keyColumns.map((col) => row[col] || "").join("|");
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(row);
    }
  }

  return { data: deduped, headers };
}

function executeRenameColumns(
  node: PipelineNode,
  data: Record<string, string>[],
  headers: string[]
): { data: Record<string, string>[]; headers: string[] } {
  const mapping = node.config.mapping as Record<string, string>;

  const newHeaders = headers.map((h) => mapping[h] || h);

  const renamed = data.map((row) => {
    const newRow: Record<string, string> = {};
    for (const [oldKey, value] of Object.entries(row)) {
      const newKey = mapping[oldKey] || oldKey;
      newRow[newKey] = value;
    }
    return newRow;
  });

  return { data: renamed, headers: newHeaders };
}

function executeTransform(
  node: PipelineNode,
  data: Record<string, string>[],
  headers: string[]
): { data: Record<string, string>[]; headers: string[] } {
  const column = node.config.column as string;
  const expression = node.config.expression as string;

  const transformed = data.map((row) => {
    const newRow = { ...row };
    const value = row[column] || "";

    // Simple expression support
    if (expression === "lower(value)") {
      newRow[column] = value.toLowerCase();
    } else if (expression === "upper(value)") {
      newRow[column] = value.toUpperCase();
    } else if (expression === "trim(value)") {
      newRow[column] = value.trim();
    } else if (expression.startsWith("replace(")) {
      // replace(value, 'old', 'new')
      const replaceMatch = expression.match(/replace\(value,\s*'([^']*)',\s*'([^']*)'\)/);
      if (replaceMatch) {
        newRow[column] = value.replace(new RegExp(replaceMatch[1], "g"), replaceMatch[2]);
      }
    }

    return newRow;
  });

  return { data: transformed, headers };
}

function executeValidateEmail(
  node: PipelineNode,
  data: Record<string, string>[],
  headers: string[]
): { data: Record<string, string>[]; headers: string[] } {
  const column = node.config.column as string;
  const strict = node.config.strict as boolean;

  // Add email_valid column
  const newHeaders = [...headers];
  if (!newHeaders.includes("email_valid")) {
    newHeaders.push("email_valid");
  }

  const emailRegex = strict
    ? /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validated = data.map((row) => {
    const email = row[column] || "";
    const isValid = emailRegex.test(email);
    return { ...row, email_valid: isValid ? "true" : "false" };
  });

  return { data: validated, headers: newHeaders };
}

function executeFixDates(
  node: PipelineNode,
  data: Record<string, string>[],
  headers: string[]
): { data: Record<string, string>[]; headers: string[] } {
  const column = node.config.column as string;
  const targetFormat = node.config.format as string || "YYYY-MM-DD";

  const fixed = data.map((row) => {
    const newRow = { ...row };
    const dateStr = row[column] || "";

    try {
      // Try to parse the date
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        // Format to target format
        if (targetFormat === "YYYY-MM-DD") {
          newRow[column] = date.toISOString().split("T")[0];
        } else if (targetFormat === "MM/DD/YYYY") {
          newRow[column] = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`;
        } else if (targetFormat === "DD/MM/YYYY") {
          newRow[column] = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
        }
      }
    } catch {
      // Keep original if parsing fails
    }

    return newRow;
  });

  return { data: fixed, headers };
}
