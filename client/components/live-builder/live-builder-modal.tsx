"use client";

import { useEffect, useReducer, useRef, useCallback } from "react";
import { X, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AgentStepper } from "./agent-stepper";
import { LiveSpecViewer } from "./live-spec-viewer";
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {isComplete ? (
                state.finalStatus === "success" ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
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
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Goal Summary */}
        <div className="rounded-lg bg-muted/50 p-3">
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
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          {/* Left Column - Agent Status & Validation */}
          <div className="space-y-6">
            <AgentStepper
              currentPhase={state.phase}
              currentIteration={state.currentIteration}
            />
            <ValidationFeed errors={state.validationErrors} />
          </div>

          {/* Right Column - Live Spec */}
          <LiveSpecViewer
            spec={state.currentSpec}
            previousSpec={state.previousSpec}
          />
        </div>

        {/* Actions */}
        {isComplete && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            {state.finalStatus === "failed" && (
              <Button variant="outline" onClick={handleCancel}>
                Close
              </Button>
            )}
            {state.finalStatus === "success" && (
              <Button onClick={handleViewResults}>
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
