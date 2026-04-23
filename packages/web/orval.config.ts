import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "orval";

const packageRoot = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = join(packageRoot, "..", "..");

function prettierWriteHook(): string {
  const local = join(packageRoot, "node_modules", ".bin", "prettier");
  const hoisted = join(monorepoRoot, "node_modules", ".bin", "prettier");

  if (existsSync(local)) return `${local} --write`;
  if (existsSync(hoisted)) return `${hoisted} --write`;

  return "bunx prettier --write";
}

export default defineConfig({
  decodedApi: {
    input: {
      target: "../api-server/openapi.json",
      override: {
        transformer: (spec: Record<string, unknown>) => {
          // Remove multipart/binary upload endpoints that Orval cannot generate valid hooks for.
          // These 4 endpoints use FormData/binary — not representable as typed hooks.
          // CRITICAL: /api/v1/posts has both GET (list_posts — KEEP) and POST (create_post_without_solutions — REMOVE).
          // We must remove only the POST verb, not the entire path.
          const pathsToRemoveVerb: Record<string, string[]> = {
            "/api/v1/posts": ["post"],
            "/api/v1/posts/with-solutions": ["post"],
            "/api/v1/posts/upload": ["post"],
            "/api/v1/posts/analyze": ["post"],
          };

          const paths = spec.paths as
            | Record<string, Record<string, unknown>>
            | undefined;
          if (paths) {
            for (const [path, verbs] of Object.entries(pathsToRemoveVerb)) {
              if (paths[path]) {
                for (const verb of verbs) {
                  delete paths[path][verb];
                }
                // If no verbs remain, remove the entire path entry
                if (Object.keys(paths[path]).length === 0) {
                  delete paths[path];
                }
              }
            }
          }

          return spec;
        },
      },
    },
    output: {
      mode: "tags-split",
      target: "./lib/api/generated",
      schemas: "./lib/api/generated/models",
      client: "react-query",
      httpClient: "axios",
      override: {
        mutator: {
          path: "./lib/api/mutator/custom-instance.ts",
          name: "customInstance",
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
    hooks: {
      afterAllFilesWrite: prettierWriteHook(),
    },
  },
  decodedApiZod: {
    input: {
      target: "../api-server/openapi.json",
    },
    output: {
      client: "zod",
      target: "./lib/api/generated/zod",
      fileExtension: ".zod.ts",
    },
  },
});
