import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { runRoutes } from "./routes/run";
import { pipelinesRoutes } from "./routes/pipelines";
import { runsRoutes } from "./routes/runs";
import { pipelineRunRoutes } from "./routes/pipeline-run";
import { exportDockerRoutes } from "./routes/export-docker";

const app = new Elysia()
  .use(cors())
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(runRoutes)
  .use(pipelinesRoutes)
  .use(runsRoutes)
  .use(pipelineRunRoutes)
  .use(exportDockerRoutes)
  .listen(process.env.PORT || 3001);

console.log(
  `🚀 PipeCanvas server running at http://${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
