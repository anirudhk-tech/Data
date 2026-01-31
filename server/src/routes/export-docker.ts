import { Elysia, t } from "elysia";
import { getPipelineVersion } from "../lib/db";
import type { ExportDockerRequest, ExportDockerResponse } from "../lib/types";

export const exportDockerRoutes = new Elysia()
  // POST /export/docker - Export pipeline version to Docker
  .post(
    "/export/docker",
    async ({ body }): Promise<ExportDockerResponse> => {
      const { pipeline_version_id } = body as ExportDockerRequest;

      // 1. Load the pipeline version
      const version = await getPipelineVersion(pipeline_version_id);
      if (!version) {
        throw new Error(`Pipeline version not found: ${pipeline_version_id}`);
      }

      if (!version.spec_json) {
        throw new Error(`Pipeline version ${pipeline_version_id} has no spec`);
      }

      // 2. Generate export package
      // In a full implementation, this would:
      // - Create a zip file containing:
      //   - pipeline.json (the spec)
      //   - pipeline_engine.wasm (the WASM module)
      //   - server.ts (minimal Bun server for execution)
      //   - Dockerfile
      //   - README.md
      // - Upload to Supabase Storage
      // - Return download URL

      const exportContent = generateExportPackage(version.spec_json, pipeline_version_id);

      // For v0, we return a placeholder URL
      // In production, upload to Supabase Storage and return actual URL
      const downloadUrl = `/exports/${pipeline_version_id}.tar.gz`;

      // Store export metadata (could also store in artifacts table)
      console.log(`Export generated for version ${pipeline_version_id}:`, {
        filesGenerated: Object.keys(exportContent),
      });

      return {
        download_url: downloadUrl,
      };
    },
    {
      body: t.Object({
        pipeline_version_id: t.String(),
      }),
    }
  );

// ============================================
// Export Package Generation
// ============================================

interface ExportPackage {
  "pipeline.json": string;
  "server.ts": string;
  Dockerfile: string;
  "README.md": string;
}

function generateExportPackage(
  spec: object,
  versionId: string
): ExportPackage {
  const pipelineJson = JSON.stringify(spec, null, 2);

  const serverTs = `// Auto-generated pipeline server
import { Elysia, t } from "elysia";

const spec = ${pipelineJson};

// Pipeline execution logic (simplified)
function runPipeline(spec: any, input: any) {
  // Implementation would be included from wasm-engine
  return input;
}

const app = new Elysia()
  .post("/run", async ({ body }) => {
    const { data } = body as { data: { content_base64: string } };
    const csvContent = Buffer.from(data.content_base64, "base64").toString("utf-8");
    
    // Parse and execute
    const result = runPipeline(spec, csvContent);
    
    return {
      output: {
        format: "csv",
        content_base64: Buffer.from(result).toString("base64"),
      },
    };
  })
  .listen(3000);

console.log("Pipeline server running on port 3000");
`;

  const dockerfile = `# Auto-generated Dockerfile for pipeline ${versionId}
FROM oven/bun:1

WORKDIR /app

# Copy pipeline files
COPY pipeline.json .
COPY server.ts .

# Install dependencies
RUN bun add elysia

# Expose port
EXPOSE 3000

# Run server
CMD ["bun", "run", "server.ts"]
`;

  const readme = `# Pipeline Export: ${versionId}

This is an auto-generated export of a Dagger pipeline.

## Files

- \`pipeline.json\` - The pipeline specification
- \`server.ts\` - Minimal Bun/Elysia server for execution
- \`Dockerfile\` - Docker configuration

## Usage

### Local Development

\`\`\`bash
bun install
bun run server.ts
\`\`\`

### Docker

\`\`\`bash
docker build -t pipeline-${versionId} .
docker run -p 3000:3000 pipeline-${versionId}
\`\`\`

### API

POST /run

Request:
\`\`\`json
{
  "data": {
    "format": "csv",
    "content_base64": "<base64-encoded-csv>"
  }
}
\`\`\`

Response:
\`\`\`json
{
  "output": {
    "format": "csv",
    "content_base64": "<base64-encoded-result>"
  }
}
\`\`\`
`;

  return {
    "pipeline.json": pipelineJson,
    "server.ts": serverTs,
    Dockerfile: dockerfile,
    "README.md": readme,
  };
}
