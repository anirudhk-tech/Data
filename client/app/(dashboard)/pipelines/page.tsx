"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Zap, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PipelineCard } from "@/components/pipelines/pipeline-card";
import { getPipelines } from "@/lib/api";
import type { Pipeline } from "@/lib/types";

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPipelines().then((data) => {
      setPipelines(data);
      setLoading(false);
    });
  }, []);

  const handlePipelineUpdate = (updated: Pipeline) => {
    setPipelines((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  return (
    <div className="container py-8">
      {/* Header with glow effect */}
      <div className="mb-10 flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary glow-sm">
              <Workflow className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          </div>
          <p className="text-muted-foreground">
            All your saved recipes in one place
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/pipelines/new">
            <Plus className="h-5 w-5" />
            New Project
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[160px] w-full rounded-xl bg-white/5" />
            </div>
          ))}
        </div>
      ) : pipelines.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-20">
          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
          </div>
          
          <div className="relative text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary glow">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold">No projects yet</h3>
            <p className="mb-6 text-muted-foreground">
              Upload a spreadsheet and tell us what you need — we&apos;ll handle the rest
            </p>
            <Button asChild size="lg">
              <Link href="/pipelines/new">
                <Plus className="mr-2 h-5 w-5" />
                Start My First Project
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pipelines.map((pipeline) => (
            <PipelineCard 
              key={pipeline.id} 
              pipeline={pipeline} 
              onUpdate={handlePipelineUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
