import type { LiveBuilderEvent, PipelineSpec, AgentPhase } from "./types";

// Mock spec that evolves through iterations
const mockSpecV1: PipelineSpec = {
  nodes: [
    {
      id: "n1",
      op: "parse_csv",
      config: { delimiter: "," },
      inputs: [],
    },
    {
      id: "n2",
      op: "filter",
      config: { 
        condition: "email != null",
        // Intentional issue: wrong column name
        column: "email_address" 
      },
      inputs: ["n1"],
    },
    {
      id: "n3",
      op: "dedupe",
      config: { 
        key_columns: ["email"],
        // Intentional issue: invalid strategy
        strategy: "keep_newest" 
      },
      inputs: ["n2"],
    },
    {
      id: "n4",
      op: "select_columns",
      config: { columns: ["email", "name", "company"] },
      inputs: ["n3"],
    },
  ],
};

const mockSpecV2: PipelineSpec = {
  nodes: [
    {
      id: "n1",
      op: "parse_csv",
      config: { delimiter: "," },
      inputs: [],
    },
    {
      id: "n2",
      op: "filter",
      config: { 
        condition: "email != null",
        // Fixed: correct column name
        column: "email" 
      },
      inputs: ["n1"],
    },
    {
      id: "n3",
      op: "dedupe",
      config: { 
        key_columns: ["email"],
        // Fixed: valid strategy
        strategy: "keep_first" 
      },
      inputs: ["n2"],
    },
    {
      id: "n4",
      op: "select_columns",
      config: { columns: ["email", "name", "company"] },
      inputs: ["n3"],
    },
  ],
};

// Event timeline for simulation
interface ScheduledEvent {
  delayMs: number;
  event: LiveBuilderEvent;
}

function createEventTimeline(): ScheduledEvent[] {
  const now = () => new Date().toISOString();
  
  return [
    // 0.0s - Start analyzing
    {
      delayMs: 0,
      event: {
        type: "phase_change",
        payload: {
          phase: "analyzing" as AgentPhase,
          currentIteration: 0,
          maxIterations: 3,
        },
        timestamp: now(),
      },
    },
    // 1.0s - Start generating
    {
      delayMs: 1000,
      event: {
        type: "phase_change",
        payload: {
          phase: "generating" as AgentPhase,
        },
        timestamp: now(),
      },
    },
    // 2.0s - Spec v1 appears
    {
      delayMs: 2000,
      event: {
        type: "spec_update",
        payload: {
          currentSpec: mockSpecV1,
          currentIteration: 1,
        },
        timestamp: now(),
      },
    },
    // 2.5s - Start validating
    {
      delayMs: 2500,
      event: {
        type: "phase_change",
        payload: {
          phase: "validating" as AgentPhase,
        },
        timestamp: now(),
      },
    },
    // 3.0s - Validation errors found
    {
      delayMs: 3000,
      event: {
        type: "validation_result",
        payload: {
          validationErrors: [
            {
              iteration: 1,
              errors: [
                "Column 'email_address' not found in input schema. Did you mean 'email'?",
                "Invalid dedupe strategy 'keep_newest'. Valid options: 'keep_first', 'keep_last'",
              ],
              timestamp: now(),
              fixed: false,
            },
          ],
        },
        timestamp: now(),
      },
    },
    // 3.5s - Back to generating (fixing)
    {
      delayMs: 3500,
      event: {
        type: "phase_change",
        payload: {
          phase: "generating" as AgentPhase,
          currentIteration: 2,
        },
        timestamp: now(),
      },
    },
    // 4.5s - Spec v2 (fixed)
    {
      delayMs: 4500,
      event: {
        type: "spec_update",
        payload: {
          currentSpec: mockSpecV2,
        },
        timestamp: now(),
      },
    },
    // 5.0s - Validating again
    {
      delayMs: 5000,
      event: {
        type: "phase_change",
        payload: {
          phase: "validating" as AgentPhase,
        },
        timestamp: now(),
      },
    },
    // 5.5s - Validation passed
    {
      delayMs: 5500,
      event: {
        type: "validation_result",
        payload: {
          validationErrors: [
            {
              iteration: 1,
              errors: [
                "Column 'email_address' not found in input schema. Did you mean 'email'?",
                "Invalid dedupe strategy 'keep_newest'. Valid options: 'keep_first', 'keep_last'",
              ],
              timestamp: now(),
              fixed: true,
            },
          ],
        },
        timestamp: now(),
      },
    },
    // 6.0s - Executing
    {
      delayMs: 6000,
      event: {
        type: "phase_change",
        payload: {
          phase: "executing" as AgentPhase,
        },
        timestamp: now(),
      },
    },
    // 7.5s - Evaluating
    {
      delayMs: 7500,
      event: {
        type: "phase_change",
        payload: {
          phase: "evaluating" as AgentPhase,
        },
        timestamp: now(),
      },
    },
    // 8.5s - Complete
    {
      delayMs: 8500,
      event: {
        type: "complete",
        payload: {
          phase: "complete" as AgentPhase,
          isComplete: true,
          finalStatus: "success",
        },
        timestamp: now(),
      },
    },
  ];
}

/**
 * Simulates the pipeline build process with streaming events
 * @param onEvent Callback for each event
 * @returns Cleanup function to cancel the simulation
 */
export function simulatePipelineBuild(
  onEvent: (event: LiveBuilderEvent) => void
): () => void {
  const timeline = createEventTimeline();
  const timeouts: NodeJS.Timeout[] = [];

  timeline.forEach(({ delayMs, event }) => {
    const timeout = setTimeout(() => {
      onEvent({
        ...event,
        timestamp: new Date().toISOString(),
      });
    }, delayMs);
    timeouts.push(timeout);
  });

  // Return cleanup function
  return () => {
    timeouts.forEach(clearTimeout);
  };
}

/**
 * Get the initial state for the live builder
 */
export function getInitialLiveBuilderState(runId: string) {
  return {
    runId,
    phase: "analyzing" as AgentPhase,
    currentIteration: 0,
    maxIterations: 3,
    currentSpec: null,
    validationErrors: [],
    isComplete: false,
    finalStatus: null,
  };
}
