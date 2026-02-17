import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { type ExtractedModel, type ExtractedModule, type ExtractedSymbol } from "./docs-model.ts";
import { paths, repoRoot } from "./docs-paths.ts";

const companionDocs: Record<string, string> = {
  "plan-schema": "plan-schema-protocol.md",
  "continuity-journal": "continuity-journal-design.md",
  "version-mixin": "version-mixin-design.md",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderTags(symbol: ExtractedSymbol): string {
  if (symbol.tags.length === 0) {
    return "";
  }

  const blocks = symbol.tags
    .map((tag) => {
      const body = normalizeTagMarkdown(tag.text);
      return [`##### ${tag.tag}`, body.length > 0 ? body : "_No content_"].join("\n\n");
    })
    .join("\n\n");

  return `#### TSDoc Tags\n\n${blocks}`;
}

function renderSymbol(symbol: ExtractedSymbol): string {
  const header = `### ${symbol.name} (${symbol.kind})`;
  const location = symbol.sourcePath
    ? `**Source:** \`${symbol.sourcePath}${symbol.line ? `:${symbol.line}` : ""}\``
    : "";
  const summary = symbol.summary ? `**Summary:** ${symbol.summary}` : "";
  const tags = renderTags(symbol);
  const chunks = [header, location, summary, tags].filter((chunk) => chunk.length > 0);
  return chunks.join("\n\n");
}

function normalizeTagMarkdown(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return "";
  }

  // Recover markdown tables when comment extraction flattened row breaks.
  if (trimmed.includes("|") && trimmed.includes("---") && !trimmed.includes("\n")) {
    return trimmed.replace(/\|\s+\|/g, "|\n|");
  }

  return trimmed;
}

function renderCompanion(moduleName: string): string {
  const companion = companionDocs[moduleName];
  if (!companion) {
    return "";
  }
  return `## Companion Design Doc\n- [${companion.replace(/\.md$/, "")}](../../_specs/schemas/docs/${companion})\n`;
}

function renderModuleOverview(moduleItem: ExtractedModule): string {
  if (moduleItem.summary && moduleItem.summary.trim().length > 0) {
    return `**Overview:** ${moduleItem.summary.trim()}`;
  }
  return `**Overview:** Exported schemas, types, and helpers defined in \`${moduleItem.name}\`.`;
}

function applyTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => variables[key] ?? "");
}

export function renderModulePage(moduleItem: ExtractedModule, template: string): string {
  const sections = moduleItem.symbols.map(renderSymbol);
  const symbols = sections
    .map((section, index) => {
      if (index === sections.length - 1) {
        return section;
      }
      return `${section}\n\n---`;
    })
    .join("\n\n");
  const companionSection = renderCompanion(moduleItem.name);
  const source = moduleItem.sourcePath ? `Source: \`${moduleItem.sourcePath}\`` : "";
  const moduleOverview = renderModuleOverview(moduleItem);

  return `${applyTemplate(template, {
    module_title: `Schema Module: ${moduleItem.name}`,
    source,
    module_overview: moduleOverview,
    companion: companionSection,
    symbol_sections: symbols.length > 0 ? symbols : "No exported symbols were discovered.",
  })}\n`;
}

export function renderIndexPage(model: ExtractedModel, template: string): string {
  const lines = model.modules.map((moduleItem) => {
    const fileName = `${moduleItem.name}.md`;
    const companion = companionDocs[moduleItem.name]
      ? `, companion: [${companionDocs[moduleItem.name]?.replace(/\.md$/, "")}](../../_specs/schemas/docs/${companionDocs[moduleItem.name]})`
      : "";

    return `- [${moduleItem.name}](${fileName}) (${moduleItem.symbols.length} symbols${companion})`;
  });

  return `${applyTemplate(template, {
    module_list: lines.join("\n"),
  })}\n`;
}

async function clearGeneratedMarkdown(outputDir: string): Promise<void> {
  const entries = await readdir(outputDir, { withFileTypes: true }).catch(() => []);
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "README.md")
      .map((entry) => rm(path.join(outputDir, entry.name), { force: true }))
  );
}

export async function renderModelToDisk(model: ExtractedModel, outputDir: string): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  await clearGeneratedMarkdown(outputDir);

  const moduleTemplate = await readFile(paths.moduleTemplate, "utf8");
  const indexTemplate = await readFile(paths.indexTemplate, "utf8");

  for (const moduleItem of model.modules) {
    const fileName = `${slugify(moduleItem.name)}.md`;
    const rendered = renderModulePage(moduleItem, moduleTemplate);
    await writeFile(path.join(outputDir, fileName), rendered, "utf8");
  }

  const index = renderIndexPage(model, indexTemplate);
  await writeFile(path.join(outputDir, "index.md"), index, "utf8");

  const readme = [
    "# Generated Schema Docs",
    "",
    "This directory is generated by `npm run docs:render`.",
    "Do not manually edit generated module pages.",
    "",
    "Primary entrypoint: [index.md](./index.md)",
    "",
  ].join("\n");

  await writeFile(path.join(outputDir, "README.md"), readme, "utf8");
}

async function main(): Promise<void> {
  const raw = await readFile(paths.extractModel, "utf8");
  const model = JSON.parse(raw) as ExtractedModel;

  await renderModelToDisk(model, paths.generatedDocsDir);
  console.log(`Wrote ${path.relative(repoRoot, paths.generatedDocsDir)}`);
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
