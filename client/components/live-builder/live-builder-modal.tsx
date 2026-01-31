"use client";

import { useEffect, useReducer, useRef, useCallback } from "react";
import { X, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AgentStepper } from "./agent-stepper";
import { PipelineCanvas } from "./pipeline-canvas";
import { ValidationFeed } from "./validation-feed";
import { IterationProgress } from "./iteration-progress";
import { simulatePipelineBuild, getInitialLiveBuilderState } from "@/lib/mock-streaming";
import type { LiveBuilderState, LiveBuilderEvent, PipelineSpec } from "@/lib/types";

interface LiveBuilderModalProps {
  isOpen: boolean;
  prompt: string;
  onComplete: (state: LiveBuilderState) => void;
  onCancel: () => void;
}

type Action =
  | { type: "UPDATE"; payload: Partial<LiveBuilderState> }
  | { type: "SET_PREVIOUS_SPEC"; payload: PipelineSpec | null };

interface State extends LiveBuilderState {
  previousSpec: PipelineSpec | null;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "UPDATE":
      return {
        ...state,
        ...action.payload,
        // Track previous spec for diff highlighting
        previousSpec: action.payload.currentSpec !== undefined 
          ? state.currentSpec 
          : state.previousSpec,
      };
    case "SET_PREVIOUS_SPEC":
      return { ...state, previousSpec: action.payload };
    default:
      return state;
  }
}

export function LiveBuilderModal({
  isOpen,
  prompt,
  onComplete,
  onCancel,
}: LiveBuilderModalProps) {
  const runId = useRef(`run_${Date.now()}`);
  const cancelRef = useRef<(() => void) | null>(null);

  const [state, dispatch] = useReducer(reducer, {
    ...getInitialLiveBuilderState(runId.current),
    previousSpec: null,
  });

  const handleEvent = useCallback((event: LiveBuilderEvent) => {
    dispatch({ type: "UPDATE", payload: event.payload });
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Start the simulation
      cancelRef.current = simulatePipelineBuild(handleEvent);
    }

    return () => {
      if (cancelRef.current) {
        cancelRef.current();
      }
    };
  }, [isOpen, handleEvent]);

  const handleCancel = () => {
    if (cancelRef.current) {
      cancelRef.current();
    }
    onCancel();
  };

  const handleViewResults = () => {
    onComplete(state);
  };

  const isComplete = state.phase === "complete" || state.phase === "failed";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="!max-w-[1400px] !w-[95vw] h-[85vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-8 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold">
              {isComplete ? (
                state.finalStatus === "success" ? (
                  <span className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    Pipeline Built Successfully
                  </span>
                ) : (
                  "Pipeline Build Failed"
                )
              ) : (
                "Building Pipeline..."
              )}
            </DialogTitle>
            {!isComplete && (
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Goal Summary */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm">
              <span className="font-medium">Goal: </span>
              <span className="text-muted-foreground">{prompt}</span>
            </p>
          </div>

          {/* Progress Bar */}
          <IterationProgress
            currentIteration={state.currentIteration}
            maxIterations={state.maxIterations}
            phase={state.phase}
          />

          {/* Main Content */}
          <div className="grid gap-8 lg:grid-cols-[320px_1fr] min-h-[400px]">
            {/* Left Column - Agent Status & Validation */}
            <div className="space-y-6">
              <AgentStepper
                currentPhase={state.phase}
                currentIteration={state.currentIteration}
              />
              <ValidationFeed errors={state.validationErrors} />
            </div>

            {/* Right Column - Pipeline Canvas */}
            <div className="min-h-[400px]">
              <PipelineCanvas
                spec={state.currentSpec}
                previousSpec={state.previousSpec}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        {isComplete && (
          <div className="flex justify-end gap-3 px-8 py-4 border-t shrink-0 bg-background">
            {state.finalStatus === "failed" && (
              <Button variant="outline" onClick={handleCancel}>
                Close
              </Button>
            )}
            {state.finalStatus === "success" && (
              <Button size="lg" onClick={handleViewResults}>
                View Results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
