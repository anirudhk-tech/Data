"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PipelineForm } from "@/components/pipelines/pipeline-form";
import { LiveBuilderModal } from "@/components/live-builder/live-builder-modal";
import type { ParsedCSV, CreatePipelineResponse } from "@/lib/types";

export default function NewPipelinePage() {
  const router = useRouter();
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildData, setBuildData] = useState<{
    prompt: string;
    csvContent: string;
    csvBase64: string;
    parsedData: ParsedCSV;
  } | null>(null);

  const handleSubmit = (data: { prompt: string; csvContent: string; parsedData: ParsedCSV }) => {
    // Convert CSV content to base64
    const csvBase64 = btoa(data.csvContent);
    setBuildData({
      ...data,
      csvBase64,
    });
    setIsBuilding(true);
  };

  const handleBuildComplete = (result: { runId: string; pipelineId: string; response: CreatePipelineResponse }) => {
    setIsBuilding(false);
    // Navigate to the run details page
    router.push(`/runs/${result.runId}`);
  };

  const handleBuildCancel = () => {
    setIsBuilding(false);
    setBuildData(null);
  };

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-10">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/pipelines">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Projects
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary glow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
            <p className="text-muted-foreground">
              Upload your file and tell us what you need in plain English
            </p>
          </div>
        </div>
      </div>

      <PipelineForm onSubmit={handleSubmit} isSubmitting={isBuilding} />

      {isBuilding && buildData && (
        <LiveBuilderModal
          isOpen={isBuilding}
          prompt={buildData.prompt}
          csvBase64={buildData.csvBase64}
          onComplete={handleBuildComplete}
          onCancel={handleBuildCancel}
        />
      )}
    </div>
  );
}
