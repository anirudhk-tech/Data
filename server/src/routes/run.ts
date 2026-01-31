import { Elysia, t } from "elysia";
import {
  createPipeline,
  createPipelineVersion,
  createRun,
  updatePipelineVersionSpec,
  updateRunResults,
  updateRunStatus,
} from "../lib/db";
import { generatePipelineSpec, repairPipelineSpec } from "../lib/keywords";
import { base64Decode, parseCSV, serializeCSV, base64Encode, getCSVHash } from "../lib/csv";
import { validatePipeline, runPipeline, isWasmLoaded } from "../../engine_wasm/bindings";
import { computeMetrics, evaluateRun } from "../lib/eval";
import { ExecutionLogger } from "../lib/logger";
import type { CreatePipelineRequest, CreatePipelineResponse, PipelineSpec } from "../lib/types";

const MAX_INPUT_BYTES = parseInt(process.env.MAX_INPUT_BYTES || "10000000", 10); // 10MB default
const MAX_FIX_ITERS_DEFAULT = parseInt(process.env.MAX_FIX_ITERS_DEFAULT || "3", 10);

export const runRoutes = new Elysia().post(
  "/run",
  async ({ body }): Promise<CreatePipelineResponse> => {
    const startTime = Date.now();
    const logger = new ExecutionLogger();

    // 1. Parse and validate input
    const { prompt, data, options } = body as CreatePipelineRequest;
    
    logger.system("Pipeline execution started", { prompt_length: prompt.length });

    // Decode base64 input
    const csvContent = base64Decode(data.content_base64);
    const inputBytes = Buffer.byteLength(csvContent, "utf-8");

    // Check size limit
    if (inputBytes > MAX_INPUT_BYTES) {
      logger.systemError("Input size exceeded limit", { bytes: inputBytes, max: MAX_INPUT_BYTES });
      throw new Error(`Input too large: ${inputBytes} bytes (max: ${MAX_INPUT_BYTES})`);
    }

    // Parse CSV
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
    const maxFixIters = options?.max_fix_iters ?? MAX_FIX_ITERS_DEFAULT;

    // 2. Create database records
    const pipelineName = prompt.split(/\s+/).slice(0, 6).join(" ");

    const pipeline = await createPipeline(pipelineName, prompt);
    const pipelineVersion = await createPipelineVersion(pipeline.id, prompt, null);
    const run = await createRun(
      pipeline.id,
      pipelineVersion.id,
      "csv",
      inputBytes,
      inputHash
    );

    logger.system("Database records created", {
      pipeline_id: pipeline.id,
      version_id: pipelineVersion.id,
      run_id: run.id,
    });

    // Update run status to validating
    await updateRunStatus(run.id, "validating");

    let currentSpec: PipelineSpec | null = null;
    let validationErrors: string[] = [];
    let fixIterations = 0;
    let traceId = "";

    try {
      // 3. Generate initial spec via Keywords AI
      logger.keywords("Generating pipeline specification via LLM...");
      const genStart = Date.now();
      
      const generateResult = await generatePipelineSpec(
        prompt,
        inputCSV,
        {
          run_id: run.id,
          pipeline_id: pipeline.id,
          pipeline_version_id: pipelineVersion.id,
          stage: "spec_generate",
          iteration: 0,
        }
      );

      currentSpec = generateResult.spec;
      traceId = generateResult.traceId;
      
      logger.keywordsSuccess("Pipeline spec generated", {
        nodes_count: currentSpec.nodes.length,
        operations: currentSpec.nodes.map(n => n.op),
        trace_id: traceId,
      }, Date.now() - genStart);

      // 4. Validation and repair loop
      const engineType = isWasmLoaded() ? "C++ WASM" : "TypeScript";
      logger.wasm(`Using ${engineType} engine for validation and execution`);

      for (let i = 0; i <= maxFixIters; i++) {
        const valStart = Date.now();
        logger.validator(`Validation attempt ${i + 1}/${maxFixIters + 1}...`);
        
        const validation = validatePipeline(currentSpec);

        if (validation.valid) {
          validationErrors = [];
          logger.validatorSuccess("Pipeline spec validated successfully", {
            nodes: currentSpec.nodes.length,
          }, Date.now() - valStart);
          break;
        }

        validationErrors = validation.errors;
        logger.validatorWarn(`Validation failed with ${validation.errors.length} errors`, {
          errors: validation.errors,
        });

        if (i < maxFixIters) {
          // Attempt repair
          fixIterations++;
          logger.keywords(`Attempting spec repair (iteration ${fixIterations})...`);
          const repairStart = Date.now();
          
          const repairResult = await repairPipelineSpec(
            currentSpec,
            validationErrors,
            {
              run_id: run.id,
              pipeline_id: pipeline.id,
              pipeline_version_id: pipelineVersion.id,
              stage: "spec_repair",
              iteration: i + 1,
            }
          );

          currentSpec = repairResult.spec;
          traceId = repairResult.traceId;
          
          logger.keywordsSuccess(`Spec repair completed`, {
            nodes_count: currentSpec.nodes.length,
            operations: currentSpec.nodes.map(n => n.op),
          }, Date.now() - repairStart);
        }
      }

      // If still invalid after all iterations, throw
      if (validationErrors.length > 0) {
        logger.validatorError(`Pipeline validation failed after ${fixIterations} repair attempts`, {
          errors: validationErrors,
        });
        
        await updateRunResults(run.id, {
          status: "failed",
          input_rows: inputCSV.rows.length,
          fix_iterations: fixIterations,
          validation_errors_json: validationErrors,
          logs_json: logger.getLogs(),
          keywords_trace_id: traceId,
        });

        throw new Error(`Pipeline validation failed after ${fixIterations} repair attempts: ${validationErrors.join(", ")}`);
      }

      // 5. Update pipeline version with final spec
      await updatePipelineVersionSpec(pipelineVersion.id, currentSpec);
      logger.system("Pipeline spec saved to database");

      // 6. Execute pipeline
      await updateRunStatus(run.id, "running");
      
      logger.executor("Executing pipeline...");
      const execStart = Date.now();
      
      // Log each operation being executed
      for (const node of currentSpec.nodes) {
        logger.executor(`Executing node: ${node.id}`, {
          operation: node.op,
          config: node.config,
        });
      }

      const outputCSV = runPipeline(currentSpec, inputCSV);
      
      logger.executorSuccess("Pipeline execution completed", {
        input_rows: inputCSV.rows.length,
        output_rows: outputCSV.rows.length,
        rows_removed: inputCSV.rows.length - outputCSV.rows.length,
      }, Date.now() - execStart);

      // 7. Compute metrics and evaluation
      const execTimeMs = Date.now() - startTime;
      const metrics = computeMetrics(inputCSV, outputCSV, execTimeMs);
      const evalResult = evaluateRun(currentSpec, inputCSV, outputCSV, validationErrors);
      
      logger.system("Metrics and evaluation computed", {
        exec_time_ms: execTimeMs,
        score: evalResult.score,
        constraint_pass: evalResult.constraint_pass,
      });

      // 8. Serialize output
      const outputContent = serializeCSV(outputCSV);
      const outputBase64 = base64Encode(outputContent);
      
      logger.systemSuccess("Output serialized", {
        output_bytes: outputContent.length,
      });

      // 9. Persist results
      await updateRunResults(run.id, {
        status: "success",
        input_rows: inputCSV.rows.length,
        output_rows: outputCSV.rows.length,
        output_base64: outputBase64,
        fix_iterations: fixIterations,
        exec_time_ms: execTimeMs,
        metrics_json: metrics,
        eval_json: evalResult,
        validation_errors_json: validationErrors,
        logs_json: logger.getLogs(),
        keywords_trace_id: traceId,
      });

      logger.systemSuccess(`Pipeline completed successfully in ${execTimeMs}ms`);

      // 10. Return response
      return {
        pipeline_id: pipeline.id,
        pipeline_version_id: pipelineVersion.id,
        run_id: run.id,
        output: {
          format: "csv",
          content_base64: outputBase64,
        },
        report: {
          pipeline_spec: currentSpec,
          validation_errors: validationErrors,
          fix_iterations: fixIterations,
          metrics: {
            input_rows: metrics.input_rows,
            output_rows: metrics.output_rows,
          },
          eval: {
            constraint_pass: evalResult.constraint_pass,
            score: evalResult.score,
          },
          keywords_trace_id: traceId,
        },
      };
    } catch (error) {
      logger.systemError("Pipeline execution failed", { error: (error as Error).message });
      
      // Update run as failed
      await updateRunResults(run.id, {
        status: "failed",
        input_rows: inputCSV.rows.length,
        fix_iterations: fixIterations,
        validation_errors_json: validationErrors.length > 0 ? validationErrors : [(error as Error).message],
        logs_json: logger.getLogs(),
        keywords_trace_id: traceId,
      });

      throw error;
    }
  },
  {
    body: t.Object({
      prompt: t.String(),
      data: t.Object({
        format: t.Literal("csv"),
        content_base64: t.String(),
      }),
      options: t.Optional(
        t.Object({
          output_format: t.Optional(t.Literal("csv")),
          max_fix_iters: t.Optional(t.Number()),
          strict: t.Optional(t.Boolean()),
        })
      ),
    }),
  }
);
