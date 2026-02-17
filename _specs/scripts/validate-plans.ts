import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

type PlanSchemaModule = typeof import("../schemas/plan-schema.ts");

type ValidationResult =
  | { kind: "ok"; file: string; warnings: string[] }
  | { kind: "schema-error"; file: string; errors: string[] }
  | { kind: "wellformedness-error"; file: string; errors: string[]; warnings: string[] };

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const repoRoot = path.resolve(currentDir, "../../..");
const defaultPlanDir = path.join(repoRoot, "_data", "_shared");

function isPlanFile(filePath: string): boolean {
  const base = path.basename(filePath).toLowerCase();
  return base === "plan.json" || base.startsWith("plan-");
}

async function listJsonFiles(dir: string, options?: { planOnly?: boolean }): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listJsonFiles(fullPath, options));
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    if (options?.planOnly && !isPlanFile(fullPath)) {
      continue;
    }
    files.push(fullPath);
  }

  return files.sort();
}

async function resolveTargets(args: string[]): Promise<string[]> {
  if (args.length === 0) {
    return listJsonFiles(defaultPlanDir, { planOnly: true });
  }

  const files: string[] = [];
  for (const rawTarget of args) {
    const resolved = path.resolve(process.cwd(), rawTarget);
    const details = await stat(resolved);
    if (details.isDirectory()) {
      files.push(...await listJsonFiles(resolved, { planOnly: true }));
      continue;
    }
    if (details.isFile()) {
      files.push(resolved);
      continue;
    }
    throw new Error(`Target is not a file or directory: ${rawTarget}`);
  }

  return [...new Set(files)].sort();
}

function formatPath(value: (string | number)[]): string {
  return value.length === 0 ? "(root)" : value.join(".");
}

async function validateFile(filePath: string): Promise<ValidationResult> {
  const planModule = await loadPlanSchemaModule();
  const content = await readFile(filePath, "utf8");
  const parsedJson = JSON.parse(content) as unknown;
  const parsed = planModule.PlanSchema.safeParse(parsedJson);

  if (!parsed.success) {
    return {
      kind: "schema-error",
      file: filePath,
      errors: parsed.error.issues.map((issue) => `${formatPath(issue.path)}: ${issue.message}`),
    };
  }

  const wf = planModule.validateWellFormedness(parsed.data);
  if (wf.errors.length > 0) {
    return {
      kind: "wellformedness-error",
      file: filePath,
      errors: wf.errors,
      warnings: wf.warnings,
    };
  }

  return {
    kind: "ok",
    file: filePath,
    warnings: wf.warnings,
  };
}

function printUsage(): void {
  console.log("Usage: npm run validate:plans -- [file-or-directory ...]");
  console.log("Default target: _data/_shared/plan*.json");
}

let cachedPlanSchemaModule: Promise<PlanSchemaModule> | null = null;

async function loadPlanSchemaModule(): Promise<PlanSchemaModule> {
  if (cachedPlanSchemaModule) {
    return cachedPlanSchemaModule;
  }

  cachedPlanSchemaModule = import("../schemas/plan-schema.ts").catch((error: unknown) => {
    const code = (error as { code?: string })?.code;
    const message = error instanceof Error ? error.message : String(error);
    if (code === "ERR_MODULE_NOT_FOUND" && message.includes("package 'zod'")) {
      throw new Error('Missing dependency "zod". Run `pnpm install` before `pnpm run validate:plans`.');
    }
    throw error;
  }) as Promise<PlanSchemaModule>;

  return cachedPlanSchemaModule;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    printUsage();
    return;
  }

  const targets = await resolveTargets(args);
  if (targets.length === 0) {
    throw new Error("No JSON files found to validate.");
  }

  const results = await Promise.all(targets.map((target) => validateFile(target)));
  let hasError = false;

  for (const result of results) {
    const relativeFile = path.relative(repoRoot, result.file);
    if (result.kind === "ok") {
      const warningSuffix = result.warnings.length > 0 ? ` (${result.warnings.length} warning(s))` : "";
      console.log(`[OK] ${relativeFile}${warningSuffix}`);
      for (const warning of result.warnings) {
        console.log(`  - warning: ${warning}`);
      }
      continue;
    }

    hasError = true;
    if (result.kind === "schema-error") {
      console.log(`[ERROR] ${relativeFile} failed schema validation`);
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
      continue;
    }

    console.log(`[ERROR] ${relativeFile} failed well-formedness validation`);
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
    for (const warning of result.warnings) {
      console.log(`  - warning: ${warning}`);
    }
  }

  if (hasError) {
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${results.length} file(s) successfully.`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[ERROR] ${message}`);
  process.exitCode = 1;
});
