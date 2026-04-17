#!/usr/bin/env bun
import { EXIT } from "./lib/config.ts";

function help(): void {
  process.stdout.write(`wiki CLI — docs/wiki/** validator/linker/ingest

Usage:
  bun run wiki:lint                       Validate frontmatter + H1 + related paths
  bun run wiki:links                      Report broken body links + backlink index
  bun run wiki:ingest <topic> <title>     Create new note + update INDEX.md
                                          topic: harness|ops|tasks|incidents
`);
}

async function main(): Promise<number> {
  const [subcommand] = process.argv.slice(2);
  switch (subcommand) {
    case "lint": {
      const { runLint } = await import("./lint.ts");
      return runLint();
    }
    case "links":
    case "ingest":
      process.stderr.write(`TODO: ${subcommand} not yet implemented\n`);
      return EXIT.IO_ERROR;
    case "-h":
    case "--help":
    case undefined:
      help();
      return EXIT.OK;
    default:
      process.stderr.write(`unknown subcommand: ${subcommand}\n`);
      help();
      return EXIT.IO_ERROR;
  }
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    process.stderr.write(`fatal: ${(e as Error).stack ?? e}\n`);
    process.exit(EXIT.IO_ERROR);
  });
