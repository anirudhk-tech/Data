import { Elysia, t } from "elysia";
import {
  getPipelineVersion,
  createRun,
  updateRunStatus,
  updateRunResults,
} from "../lib/db";
import { base64Decode, parseCSV, serializeCSV, base64Encode, getCSVHash } from "../lib/csv";
import { validatePipeline, runPipeline, isWasmLoaded } from "../../engine_wasm/bindings";
import { computeMetrics, evaluateRun } from "../lib/eval";
import { ExecutionLogger } from "../lib/logger";
import type { RerunPipelineRequest, RerunPipelineResponse } from "../lib/types";

const MAX_INPUT_BYTES = parseInt(process.env.MAX_INPUT_BYTES || "10000000", 10); // 10MB default

export const pipelineRunRoutes = new Elysia()
  // POST /pipelines/:id/run - Re-run a saved version on new data
  .post(
    "/pipelines/:id/run",
    async ({ params, body }): Promise<RerunPipelineResponse> => {
      const startTime = Date.now();
      const logger = new ExecutionLogger();
      const { id: pipelineId } = params;
      const { pipeline_version_id, data } = body as RerunPipelineRequest;

      logger.system("Pipeline re-run started", { pipeline_id: pipelineId, version_id: pipeline_version_id });

      // 1. Load the pipeline version
      const version = await getPipelineVersion(pipeline_version_id);
      if (!version) {
        logger.systemError(`Pipeline version not found: ${pipeline_version_id}`);
        throw new Error(`Pipeline version not found: ${pipeline_version_id}`);
      }

      if (version.pipeline_id !== pipelineId) {
        logger.systemError(`Version mismatch`, { version_pipeline: version.pipeline_id, requested: pipelineId });
        throw new Error(`Version ${pipeline_version_id} does not belong to pipeline ${pipelineId}`);
      }

      if (!version.spec_json) {
        logger.systemError(`Pipeline version has no spec`);
        throw new Error(`Pipeline version ${pipeline_version_id} has no spec`);
      }

      logger.systemSuccess("Pipeline version loaded", {
        version: version.version,
        nodes: version.spec_json.nodes.length,
        operations: version.spec_json.nodes.map(n => n.op),
      });

      // 2. Parse and validate input
      const csvContent = base64Decode(data.content_base64);
      const inputBytes = Buffer.byteLength(csvContent, "utf-8");

      if (inputBytes > MAX_INPUT_BYTES) {
        logger.systemError("Input size exceeded limit", { bytes: inputBytes, max: MAX_INPUT_BYTES });
        throw new Error(`Input too large: ${inputBytes} bytes (max: ${MAX_INPUT_BYTES})`);
      }

      const csvParseStart = Date.now();
      const inputCSV = parseCSV(csvContent);
      if (inputCSV.headers.length === 0) {
        logger.systemError("Invalid CSV: no headers found");
        throw new Error("Invalid CSV: no headers found");
      }

      logger.systemSuccess("CSV parsed successfully", {
        rows: inputCSV.rows.length,
        columns: inputCSV.headers.length,
        headers: inputCSV.headers.slice(0, 5),
      }, Date.now() - csvParseStart);

      const inputHash = getCSVHash(csvContent);

      // 3. Create run record
      const run = await createRun(
        pipelineId,
        pipeline_version_id,
        "csv",
        inputBytes,
        inputHash
      );

      logger.system("Run record created", { run_id: run.id });

      try {
        // 4. Validate spec (fast check)
        await updateRunStatus(run.id, "validating");
        
        const engineType = isWasmLoaded() ? "C++ WASM" : "TypeScript";
        logger.wasm(`Using ${engineType} engine for validation and execution`);
        
        const valStart = Date.now();
        logger.validator("Validating stored pipeline spec...");
        const validation = validatePipeline(version.spec_json);

        if (!validation.valid) {
          logger.validatorError("Stored spec validation failed", { errors: validation.errors });
          await updateRunResults(run.id, {
            status: "failed",
            input_rows: inputCSV.rows.length,
            validation_errors_json: validation.errors,
            logs_json: logger.getLogs(),
          });

          throw new Error(`Stored spec invalid: ${validation.errors.join(", ")}`);
        }

        logger.validatorSuccess("Pipeline spec validated", {
          nodes: version.spec_json.nodes.length,
        }, Date.now() - valStart);

        // 5. Execute pipeline
        await updateRunStatus(run.id, "running");
        
        logger.executor("Executing pipeline...");
        const execStart = Date.now();

        // Log each operation
        for (const node of version.spec_json.nodes) {
          logger.executor(`Executing node: ${node.id}`, {
            operation: node.op,
            config: node.config,
          });
        }

        const outputCSV = runPipeline(version.spec_json, inputCSV);

        logger.executorSuccess("Pipeline execution completed", {
          input_rows: inputCSV.rows.length,
          output_rows: outputCSV.rows.length,
          rows_removed: inputCSV.rows.length - outputCSV.rows.length,
        }, Date.now() - execStart);

        // 6. Compute metrics and evaluation
        const execTimeMs = Date.now() - startTime;
        const metrics = computeMetrics(inputCSV, outputCSV, execTimeMs);
        const evalResult = evaluateRun(version.spec_json, inputCSV, outputCSV, []);

        logger.system("Metrics and evaluation computed", {
          exec_time_ms: execTimeMs,
          score: evalResult.score,
          constraint_pass: evalResult.constraint_pass,
        });

        // 7. Serialize output
        const outputContent = serializeCSV(outputCSV);
        const outputBase64 = base64Encode(outputContent);

        logger.systemSuccess("Output serialized", { output_bytes: outputContent.length });

        // 8. Persist results
        await updateRunResults(run.id, {
          status: "success",
          input_rows: inputCSV.rows.length,
          output_rows: outputCSV.rows.length,
          output_base64: outputBase64,
          fix_iterations: 0,
          exec_time_ms: execTimeMs,
          metrics_json: metrics,
          eval_json: evalResult,
          validation_errors_json: [],
          logs_json: logger.getLogs(),
        });

        logger.systemSuccess(`Pipeline completed successfully in ${execTimeMs}ms`);

        // 9. Return response
        return {
          run_id: run.id,
          output: {
            format: "csv",
            content_base64: outputBase64,
          },
          report: {
            metrics: {
              input_rows: metrics.input_rows,
              output_rows: metrics.output_rows,
            },
            eval: {
              constraint_pass: evalResult.constraint_pass,
              score: evalResult.score,
            },
          },
        };
      } catch (error) {
        logger.systemError("Pipeline execution failed", { error: (error as Error).message });

        await updateRunResults(run.id, {
          status: "failed",
          input_rows: inputCSV.rows.length,
          validation_errors_json: [(error as Error).message],
          logs_json: logger.getLogs(),
        });

        throw error;
      }
    },
    {
      body: t.Object({
        pipeline_version_id: t.String(),
        data: t.Object({
          format: t.Literal("csv"),
          content_base64: t.String(),
        }),
        options: t.Optional(
          t.Object({
            output_format: t.Optional(t.Literal("csv")),
          })
        ),
      }),
    }
  );
