"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataPreview } from "@/components/shared/data-preview";
import type { ParsedCSV } from "@/lib/types";

interface OutputPreviewProps {
  runId: string;
  outputBase64: string | null;
}

function parseCSVFromBase64(base64: string): ParsedCSV {
  try {
    const csvContent = atob(base64);
    const lines = csvContent.trim().split(/\r?\n/);
    
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = parseCSVLine(lines[0]);
    const rows: string[][] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        rows.push(parseCSVLine(line));
      }
    }

    return { headers, rows };
  } catch {
    return { headers: [], rows: [] };
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

export function OutputPreview({ runId, outputBase64 }: OutputPreviewProps) {
  const data = outputBase64 
    ? parseCSVFromBase64(outputBase64)
    : { headers: [], rows: [] };

  const hasData = data.headers.length > 0;

  const handleDownload = () => {
    if (!hasData) return;

    // Create CSV content
    const csvContent = [
      data.headers.join(","),
      ...data.rows.map((row) => row.join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `output-${runId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Output Preview</CardTitle>
          <CardDescription>No output data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Output Preview</CardTitle>
            <CardDescription>
              First {Math.min(data.rows.length, 10)} rows of the output data
            </CardDescription>
          </div>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataPreview data={data} maxRows={10} />
      </CardContent>
    </Card>
  );
}
