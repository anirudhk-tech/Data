"use client";

import { Progress } from "@/components/ui/progress";
import type { AgentPhase } from "@/lib/types";

interface IterationProgressProps {
  currentIteration: number;
  maxIterations: number;
  phase: AgentPhase;
}

const phaseProgress: Record<AgentPhase, number> = {
  analyzing: 10,
  generating: 30,
  validating: 50,
  executing: 70,
  evaluating: 90,
  complete: 100,
  failed: 100,
};

export function IterationProgress({
  currentIteration,
  maxIterations,
  phase,
}: IterationProgressProps) {
  const baseProgress = phaseProgress[phase] || 0;
  
  // Adjust progress based on iteration (if we're re-validating)
  const iterationAdjustment = currentIteration > 1 ? (currentIteration - 1) * 5 : 0;
  const progress = Math.min(baseProgress + iterationAdjustment, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {phase === "complete"
            ? "Complete"
            : phase === "failed"
            ? "Failed"
            : `Building pipeline...`}
        </span>
        <span className="font-medium">
          {currentIteration > 0 && `Iteration ${currentIteration}/${maxIterations}`}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
