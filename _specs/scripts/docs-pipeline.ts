import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { paths, repoRoot } from "./docs-paths.ts";

type PipelineAction = "extract" | "render" | "generate" | "build" | "serve";

interface PipelineStage {
  name: string;
  cmd: string;
  args: string[];
}

const DEFAULT_ACTION: PipelineAction = "generate";
const SCRIPT = path.join(repoRoot, "_specs", "scripts");

function isPipelineAction(input: string): input is PipelineAction {
  return ["extract", "render", "generate", "build", "serve"].includes(input);
}

export function normalizeAction(input?: string): PipelineAction {
  if (!input) {
    return DEFAULT_ACTION;
  }
  if (!isPipelineAction(input)) {
    throw new Error(`Unsupported pipeline action: ${input}`);
  }
  return input;
}

export function buildExecutionPlan(action: PipelineAction): PipelineStage[] {
  const nodeArgs = ["--experimental-strip-types"];
  const extract = {
    name: "extract",
    cmd: process.execPath,
    args: [...nodeArgs, path.join(SCRIPT, "extract-tsdoc.ts")],
  };
  const render = {
    name: "render",
    cmd: process.execPath,
    args: [...nodeArgs, path.join(SCRIPT, "render-tsdoc.ts")],
  };

  if (action === "extract") {
    return [extract];
  }
  if (action === "render") {
    return [render];
  }
  if (action === "generate") {
    return [extract, render];
  }
  if (action === "build") {
    return [
      extract,
      render,
      {
        name: "mkdocs-build",
        cmd: "mkdocs",
        args: ["build", "--strict", "-f", paths.mkdocsConfig],
      },
    ];
  }

  return [
    {
      name: "mkdocs-serve",
      cmd: "mkdocs",
      args: ["serve", "-a", "0.0.0.0:8000", "-f", paths.mkdocsConfig],
    },
  ];
}

function runStage(stage: PipelineStage): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(stage.cmd, stage.args, {
      cwd: repoRoot,
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Stage \"${stage.name}\" failed with exit code ${code ?? "unknown"}`));
    });
  });
}

function printUsage(): void {
  console.log("Usage: npm run docs:pipeline -- [extract|render|generate|build|serve]");
  console.log("Default action: generate");
}

async function main(): Promise<void> {
  const input = process.argv[2];
  if (input === "--help" || input === "-h") {
    printUsage();
    return;
  }

  const action = normalizeAction(input);
  const stages = buildExecutionPlan(action);
  for (const stage of stages) {
    await runStage(stage);
  }
}

const currentFile = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] ? path.resolve(process.argv[1]) === currentFile : false;

if (isMainModule) {
  void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] ${message}`);
    process.exitCode = 1;
  });
}
