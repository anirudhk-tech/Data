import type { ParsedCSV } from "./types";

// ============================================
// Base64 Utilities
// ============================================

export function base64Encode(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64");
}

export function base64Decode(base64: string): string {
  return Buffer.from(base64, "base64").toString("utf-8");
}

export function base64ToBytes(base64: string): Uint8Array {
  return Buffer.from(base64, "base64");
}

export function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

// ============================================
// CSV Parsing
// ============================================

export function parseCSV(csvContent: string, delimiter: string = ","): ParsedCSV {
  const lines = csvContent.trim().split(/\r?\n/);
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCSVLine(lines[0], delimiter);
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      rows.push(parseCSVLine(line, delimiter));
    }
  }

  return { headers, rows };
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === delimiter) {
        // End of field
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  // Don't forget the last field
  result.push(current.trim());

  return result;
}

// ============================================
// CSV Serialization
// ============================================

export function serializeCSV(data: ParsedCSV, delimiter: string = ","): string {
  const lines: string[] = [];

  // Header row
  lines.push(data.headers.map((h) => escapeCSVField(h, delimiter)).join(delimiter));

  // Data rows
  for (const row of data.rows) {
    lines.push(row.map((cell) => escapeCSVField(cell, delimiter)).join(delimiter));
  }

  return lines.join("\n");
}

function escapeCSVField(field: string, delimiter: string): string {
  // Check if field needs quoting
  const needsQuoting =
    field.includes(delimiter) ||
    field.includes('"') ||
    field.includes("\n") ||
    field.includes("\r");

  if (needsQuoting) {
    // Escape quotes by doubling them
    const escaped = field.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return field;
}

// ============================================
// CSV Utilities
// ============================================

export function csvToRecords(csv: ParsedCSV): Record<string, string>[] {
  return csv.rows.map((row) => {
    const record: Record<string, string> = {};
    csv.headers.forEach((header, index) => {
      record[header] = row[index] || "";
    });
    return record;
  });
}

export function recordsToCSV(
  records: Record<string, string>[],
  headers?: string[]
): ParsedCSV {
  if (records.length === 0) {
    return { headers: headers || [], rows: [] };
  }

  const csvHeaders = headers || Object.keys(records[0]);
  const rows = records.map((record) =>
    csvHeaders.map((header) => record[header] || "")
  );

  return { headers: csvHeaders, rows };
}

export function getCSVHash(content: string): string {
  // Simple hash for deduplication - using Bun's built-in hasher
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(content);
  return hasher.digest("hex");
}
