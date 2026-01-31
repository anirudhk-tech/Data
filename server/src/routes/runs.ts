import { Elysia } from "elysia";
import { getRun } from "../lib/db";
import type { RunDetailResponse } from "../lib/types";

export const runsRoutes = new Elysia()
  // GET /runs/:id - Get run details
  .get("/runs/:id", async ({ params }): Promise<RunDetailResponse> => {
    const { id } = params;

    const run = await getRun(id);
    if (!run) {
      throw new Error(`Run not found: ${id}`);
    }

    return {
      id: run.id,
      pipeline_id: run.pipeline_id,
      pipeline_version_id: run.pipeline_version_id,
      status: run.status,
      input_rows: run.input_rows,
      output_rows: run.output_rows,
      fix_iterations: run.fix_iterations,
      eval_score: run.eval_json?.score ?? null,
      constraint_pass: run.eval_json?.constraint_pass ?? null,
      keywords_trace_id: run.keywords_trace_id,
      created_at: run.created_at,
      finished_at: run.finished_at,
      output_base64: run.output_base64,
      validation_errors: run.validation_errors_json,
      metrics: run.metrics_json,
    };
  });
