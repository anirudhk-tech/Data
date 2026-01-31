"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentPhase } from "@/lib/types";

interface AgentStepperProps {
  currentPhase: AgentPhase;
  currentIteration: number;
}

const phases: { id: AgentPhase; label: string }[] = [
  { id: "analyzing", label: "Analyzing goal" },
  { id: "generating", label: "Generating spec" },
  { id: "validating", label: "Validating" },
  { id: "executing", label: "Executing pipeline" },
  { id: "evaluating", label: "Evaluating output" },
];

const phaseOrder: AgentPhase[] = ["analyzing", "generating", "validating", "executing", "evaluating", "complete"];

function getPhaseIndex(phase: AgentPhase): number {
  return phaseOrder.indexOf(phase);
}

export function AgentStepper({ currentPhase, currentIteration }: AgentStepperProps) {
  const currentIndex = getPhaseIndex(currentPhase);
  const isComplete = currentPhase === "complete";
  const isFailed = currentPhase === "failed";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Agent Status</h3>
        {currentIteration > 0 && (
          <span className="text-xs text-muted-foreground">
            Iteration {currentIteration}
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {phases.map((phase, index) => {
          const phaseIndex = getPhaseIndex(phase.id);
          const isActive = phase.id === currentPhase;
          const isDone = isComplete || currentIndex > phaseIndex;
          const isPending = !isDone && !isActive;

          return (
            <div
              key={phase.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive && "bg-primary/10 text-primary",
                isDone && "text-muted-foreground",
                isPending && "text-muted-foreground/50"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  isDone && "border-green-500 bg-green-500 text-white",
                  isPending && "border-muted-foreground/30"
                )}
              >
                {isDone ? (
                  <Check className="h-3 w-3" />
                ) : isActive ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "font-medium",
                isActive && "text-primary",
                isDone && "line-through opacity-70"
              )}>
                {phase.label}
                {isActive && phase.id === "validating" && currentIteration > 1 && (
                  <span className="ml-1 text-xs opacity-70">(retry)</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Final Status */}
      {(isComplete || isFailed) && (
        <div
          className={cn(
            "mt-4 rounded-lg p-3 text-sm font-medium",
            isComplete && "bg-green-500/10 text-green-700 dark:text-green-400",
            isFailed && "bg-destructive/10 text-destructive"
          )}
        >
          {isComplete ? "Pipeline built successfully!" : "Pipeline build failed"}
        </div>
      )}
    </div>
  );
}
