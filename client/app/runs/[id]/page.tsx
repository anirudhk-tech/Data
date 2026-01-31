"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RunSummary } from "@/components/runs/run-summary";
import { OutputPreview } from "@/components/runs/output-preview";
import { getRun } from "@/lib/api";
import { formatDate } from "@/lib/date-utils";
import type { Run } from "@/lib/types";

export default function RunDetailPage() {
  const params = useParams();
  const runId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState<Run | null>(null);

  useEffect(() => {
    getRun(runId).then((data) => {
      setRun(data);
      setLoading(false);
    });
  }, [runId]);

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="mb-2 h-10 w-64" />
        <Skeleton className="mb-8 h-5 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="container py-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/pipelines">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pipelines
          </Link>
        </Button>
        <p>Run not found</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/pipelines/${run.pipeline_id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pipeline
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold tracking-tight">Run Details</h1>
        <p className="text-muted-foreground">
          Run ID: <code className="rounded bg-muted px-1 py-0.5">{run.id}</code>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Started {formatDate(run.created_at)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8">
        <RunSummary run={run} />
      </div>

      {/* Output Preview */}
      {run.status === "success" && (
        <OutputPreview runId={run.id} outputBase64={run.output_base64} />
      )}

      {/* Failed State */}
      {run.status === "failed" && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <h3 className="font-semibold text-destructive">Run Failed</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This run failed after {run.fix_iterations} fix iterations. 
            Check the trace ID for more details about what went wrong.
          </p>
        </div>
      )}
    </div>
  );
}
