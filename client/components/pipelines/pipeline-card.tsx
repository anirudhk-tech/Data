"use client";

import Link from "next/link";
import { formatDistanceToNow } from "@/lib/date-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, ChevronRight } from "lucide-react";
import type { Pipeline } from "@/lib/types";

interface PipelineCardProps {
  pipeline: Pipeline;
}

export function PipelineCard({ pipeline }: PipelineCardProps) {
  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              <Link 
                href={`/pipelines/${pipeline.id}`}
                className="hover:underline"
              >
                {pipeline.name}
              </Link>
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {pipeline.description}
            </CardDescription>
          </div>
          {pipeline.last_run_status && (
            <Badge 
              variant={pipeline.last_run_status === "success" ? "default" : "destructive"}
            >
              {pipeline.last_run_status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {pipeline.last_run_at ? (
              <span>Last run {formatDistanceToNow(pipeline.last_run_at)}</span>
            ) : (
              <span>Never run</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/pipelines/${pipeline.id}`}>
                <Play className="mr-1 h-3 w-3" />
                Run Again
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/pipelines/${pipeline.id}`}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
