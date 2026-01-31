"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileInput, 
  FileOutput, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  ExternalLink
} from "lucide-react";
import type { Run } from "@/lib/types";

interface RunSummaryProps {
  run: Run;
}

export function RunSummary({ run }: RunSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          {run.status === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
        </CardHeader>
        <CardContent>
          <Badge variant={run.status === "success" ? "default" : "destructive"} className="text-lg">
            {run.status}
          </Badge>
        </CardContent>
      </Card>

      {/* Input/Output Rows */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rows</CardTitle>
          <div className="flex items-center gap-1">
            <FileInput className="h-4 w-4 text-muted-foreground" />
            <FileOutput className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {run.input_rows.toLocaleString()} → {run.output_rows.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {run.input_rows - run.output_rows > 0 
              ? `${(run.input_rows - run.output_rows).toLocaleString()} rows removed`
              : "No rows removed"}
          </p>
        </CardContent>
      </Card>

      {/* Fix Iterations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fix Iterations</CardTitle>
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{run.fix_iterations}</div>
          <p className="text-xs text-muted-foreground">
            {run.fix_iterations === 0 
              ? "No fixes needed"
              : `${run.fix_iterations} validation ${run.fix_iterations === 1 ? "fix" : "fixes"}`}
          </p>
        </CardContent>
      </Card>

      {/* Eval Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {run.eval_score !== null ? `${(run.eval_score * 100).toFixed(0)}%` : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {run.constraint_pass 
              ? "All constraints passed"
              : "Some constraints failed"}
          </p>
        </CardContent>
      </Card>

      {/* Keywords AI Trace */}
      {run.keywords_trace_id && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trace ID</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <code className="rounded bg-muted px-2 py-1 text-sm">
              {run.keywords_trace_id}
            </code>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
