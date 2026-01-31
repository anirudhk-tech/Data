"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataPreview } from "@/components/shared/data-preview";
import { mockOutputData } from "@/lib/api";

interface OutputPreviewProps {
  runId: string;
}

export function OutputPreview({ runId }: OutputPreviewProps) {
  // In real implementation, this would fetch the actual output data
  const data = mockOutputData;

  const handleDownload = () => {
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
