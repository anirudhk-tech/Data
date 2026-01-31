"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Download, ChevronRight, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VersionList } from "@/components/pipelines/version-list";
import { getPipeline } from "@/lib/api";
import { formatDate, formatDistanceToNow } from "@/lib/date-utils";
import type { Pipeline, PipelineVersion, Run } from "@/lib/types";

export default function PipelineDetailPage() {
  const params = useParams();
  const pipelineId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [versions, setVersions] = useState<PipelineVersion[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [showSpec, setShowSpec] = useState(false);

  useEffect(() => {
    getPipeline(pipelineId).then((data) => {
      if (data) {
        setPipeline(data.pipeline);
        setVersions(data.versions);
        setRuns(data.runs);
        if (data.versions.length > 0) {
          setSelectedVersionId(data.versions[0].id);
        }
      }
      setLoading(false);
    });
  }, [pipelineId]);

  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="mb-2 h-10 w-64" />
        <Skeleton className="mb-8 h-5 w-96" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="container py-8">
        <p>Pipeline not found</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/pipelines">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pipelines
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{pipeline.name}</h1>
            <p className="text-muted-foreground">{pipeline.description}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Created {formatDate(pipeline.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {versions.length > 0 && (
              <VersionList
                versions={versions}
                selectedVersionId={selectedVersionId}
                onVersionSelect={setSelectedVersionId}
              />
            )}
            <Button>
              <Play className="mr-2 h-4 w-4" />
              Run Again
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Pipeline Spec (Collapsible) */}
      {selectedVersion && (
        <Card className="mb-8">
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => setShowSpec(!showSpec)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <CardTitle className="text-base">Pipeline Spec</CardTitle>
                <Badge variant="secondary">Advanced</Badge>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform ${showSpec ? "rotate-90" : ""}`} />
            </div>
          </CardHeader>
          {showSpec && (
            <CardContent>
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
                {JSON.stringify(selectedVersion.spec, null, 2)}
              </pre>
            </CardContent>
          )}
        </Card>
      )}

      {/* Run History */}
      <Card>
        <CardHeader>
          <CardTitle>Run History</CardTitle>
          <CardDescription>
            Past runs of this pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No runs yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Input Rows</TableHead>
                  <TableHead>Output Rows</TableHead>
                  <TableHead>Fix Iterations</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-sm">
                      {run.id.slice(0, 12)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant={run.status === "success" ? "default" : "destructive"}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{run.input_rows.toLocaleString()}</TableCell>
                    <TableCell>{run.output_rows.toLocaleString()}</TableCell>
                    <TableCell>{run.fix_iterations}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(run.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/runs/${run.id}`}>
                          View
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
