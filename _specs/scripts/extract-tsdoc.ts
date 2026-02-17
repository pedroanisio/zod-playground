import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { type ExtractedCommentTag, type ExtractedModel, type ExtractedModule, type ExtractedSymbol } from "./docs-model.ts";
import { paths, repoRoot } from "./docs-paths.ts";

const execFileAsync = promisify(execFile);

interface TypeDocTextPart {
  text?: string;
}

interface TypeDocComment {
  summary?: TypeDocTextPart[];
  blockTags?: Array<{
    tag?: string;
    content?: TypeDocTextPart[];
  }>;
}

interface TypeDocSource {
  fileName?: string;
  line?: number;
}

interface TypeDocNode {
  id?: number;
  name?: string;
  kind?: number;
  kindString?: string;
  flags?: {
    isConst?: boolean;
  };
  comment?: TypeDocComment;
  signatures?: TypeDocNode[];
  children?: TypeDocNode[];
  sources?: TypeDocSource[];
}

const exportedSymbolPattern = /^export\s+(?:declare\s+)?(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z0-9_$]+)/;

const reflectionKindMap: Record<number, string> = {
  8: "enum",
  32: "variable",
  64: "function",
  128: "class",
  256: "interface",
  2097152: "type",
};

const headingLinePattern = /^[^\w]+$/;

function normalizeKindLabel(kind: string): string {
  const value = kind.toLowerCase().replace(/\s+/g, "");
  const map: Record<string, string> = {
    variable: "variable",
    function: "function",
    class: "class",
    interface: "interface",
    enum: "enum",
    typealias: "type",
    type: "type",
  };
  return map[value] ?? kind.toLowerCase();
}

function textFromParts(parts: TypeDocTextPart[] | undefined): string {
  if (!parts || parts.length === 0) {
    return "";
  }
  return parts
    .map((part) => part.text ?? "")
    .join("")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sourceToPath(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.replaceAll("\\", "/");
  const rootNormalized = repoRoot.replaceAll("\\", "/");
  if (normalized.startsWith(rootNormalized)) {
    return normalized.slice(rootNormalized.length + 1);
  }
  if (normalized.startsWith("docs/")) {
    return normalized;
  }
  if (/^[^/]+\.ts$/.test(normalized)) {
    return path.join("docs", "_specs", "schemas", normalized).replaceAll("\\", "/");
  }
  return normalized;
}

function kindForNode(node: TypeDocNode): string {
  if (node.kind === 32 && node.flags?.isConst) {
    return "const";
  }
  if (node.kindString && node.kindString.trim().length > 0) {
    return normalizeKindLabel(node.kindString);
  }
  if (typeof node.kind === "number" && reflectionKindMap[node.kind]) {
    return reflectionKindMap[node.kind];
  }
  return "symbol";
}

function summaryFromComment(comment?: TypeDocComment): string {
  return textFromParts(comment?.summary);
}

function cleanOverviewLines(lines: string[]): string[] {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^copyright\b/i.test(line))
    .filter((line) => !headingLinePattern.test(line));
}

export function extractModuleOverviewFromSource(content: string): string {
  const lines = content.split("\n");
  const firstExportIndex = lines.findIndex((line) => /^\s*export\b/.test(line));
  const scope = firstExportIndex >= 0 ? lines.slice(0, firstExportIndex) : lines;
  const commentLines: string[] = [];
  let inBlock = false;

  for (const rawLine of scope) {
    let line = rawLine.trim();

    if (inBlock) {
      const blockEnd = line.indexOf("*/");
      if (blockEnd >= 0) {
        line = line.slice(0, blockEnd);
        inBlock = false;
      }
      line = line.replace(/^\*\s?/, "").trim();
      if (line.length > 0) {
        commentLines.push(line);
      }
      continue;
    }

    if (line.startsWith("//")) {
      line = line.replace(/^\/\/\s?/, "").trim();
      if (line.length > 0) {
        commentLines.push(line);
      }
      continue;
    }

    if (line.startsWith("/*")) {
      line = line.replace(/^\/\*+/, "").trim();
      const blockEnd = line.indexOf("*/");
      if (blockEnd >= 0) {
        line = line.slice(0, blockEnd).trim();
        if (line.length > 0) {
          commentLines.push(line.replace(/^\*\s?/, "").trim());
        }
        continue;
      }
      inBlock = true;
      line = line.replace(/^\*\s?/, "").trim();
      if (line.length > 0) {
        commentLines.push(line);
      }
    }
  }

  const cleaned = cleanOverviewLines(commentLines);
  if (cleaned.length === 0) {
    return "";
  }

  const sentenceLines = cleaned.filter((line) => /[a-z]/.test(line) && /[.!?]$/.test(line));
  const selected = sentenceLines.length > 0 ? sentenceLines.slice(0, 2) : cleaned.slice(0, 2);
  return selected.join(" ").replace(/\s+/g, " ").trim();
}

function symbolComment(node: TypeDocNode): TypeDocComment | undefined {
  if (node.comment) {
    return node.comment;
  }
  return node.signatures?.find((entry) => entry.comment)?.comment;
}

function toTags(comment?: TypeDocComment): ExtractedCommentTag[] {
  if (!comment?.blockTags || comment.blockTags.length === 0) {
    return [];
  }

  return comment.blockTags
    .map((tag) => ({
      tag: tag.tag ?? "@unknown",
      text: textFromParts(tag.content),
    }))
    .filter((tag) => tag.text.length > 0)
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

function toSymbol(node: TypeDocNode): ExtractedSymbol | null {
  const symbolName = node.name ?? "";
  if (!symbolName || symbolName.startsWith("__")) {
    return null;
  }

  const comment = symbolComment(node);
  const source = node.sources?.[0];

  return {
    id: node.id ?? 0,
    name: symbolName,
    kind: kindForNode(node),
    summary: summaryFromComment(comment),
    tags: toTags(comment),
    sourcePath: sourceToPath(source?.fileName),
    line: source?.line,
  };
}

function moduleSourcePath(node: TypeDocNode): string | undefined {
  if (node.sources?.[0]?.fileName) {
    return sourceToPath(node.sources[0].fileName);
  }
  const childWithSource = node.children?.find((child) => child.sources?.[0]?.fileName);
  return sourceToPath(childWithSource?.sources?.[0]?.fileName);
}

export function normalizeTypedocProject(project: TypeDocNode): ExtractedModel {
  const children = Array.isArray(project.children) ? project.children : [];
  const moduleNodes = children.filter((child) => (child.kindString ?? "") === "Module");
  const effectiveModules = moduleNodes.length > 0 ? moduleNodes : children;

  const modules: ExtractedModule[] = effectiveModules
    .filter((node) => Boolean(node.name))
    .map((moduleNode) => {
      const symbols = (moduleNode.children ?? [])
        .map((entry) => toSymbol(entry))
        .filter((entry): entry is ExtractedSymbol => entry !== null)
        .sort((a, b) => {
          const nameCmp = a.name.localeCompare(b.name);
          if (nameCmp !== 0) {
            return nameCmp;
          }
          return a.kind.localeCompare(b.kind);
        });

      return {
        id: moduleNode.id ?? 0,
        name: moduleNode.name ?? "unknown-module",
        summary: summaryFromComment(moduleNode.comment),
        sourcePath: moduleSourcePath(moduleNode),
        symbols,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    schemaVersion: "1.0.0",
    modules,
  };
}

function parseJsDocBlock(rawBlock: string): { summary: string; tags: ExtractedCommentTag[] } {
  const cleaned = rawBlock
    .split("\n")
    .map((line) => line.trim().replace(/^\/\*\*?/, "").replace(/\*\/$/, "").replace(/^\*\s?/, "").trim())
    .filter((line) => line.length > 0);

  const summaryLines: string[] = [];
  const tags: ExtractedCommentTag[] = [];
  let currentTag: ExtractedCommentTag | null = null;

  for (const line of cleaned) {
    if (line.startsWith("@")) {
      if (currentTag) {
        tags.push(currentTag);
      }
      const [tag, ...rest] = line.split(/\s+/);
      currentTag = {
        tag,
        text: rest.join(" ").trim(),
      };
      continue;
    }

    if (currentTag) {
      currentTag.text = `${currentTag.text}\n${line}`.trim();
      continue;
    }

    summaryLines.push(line);
  }

  if (currentTag) {
    tags.push(currentTag);
  }

  return {
    summary: summaryLines.join("\n").trim(),
    tags,
  };
}

function readJsDocAbove(lines: string[], lineIndex: number): { summary: string; tags: ExtractedCommentTag[] } {
  let cursor = lineIndex - 1;
  while (cursor >= 0 && lines[cursor].trim() === "") {
    cursor -= 1;
  }

  if (cursor < 0 || !lines[cursor].trim().endsWith("*/")) {
    return { summary: "", tags: [] };
  }

  const blockLines: string[] = [];
  while (cursor >= 0) {
    const line = lines[cursor];
    blockLines.unshift(line);
    if (line.trim().startsWith("/**")) {
      return parseJsDocBlock(blockLines.join("\n"));
    }
    cursor -= 1;
  }

  return { summary: "", tags: [] };
}

function toKind(line: string): string {
  const match = line.match(/^export\s+(?:declare\s+)?(const|let|var|function|class|interface|type|enum)\b/);
  return match ? match[1] : "symbol";
}

async function extractFromSourceFiles(): Promise<ExtractedModel> {
  const schemaDir = path.join(repoRoot, "docs", "_specs", "schemas");
  const entries = await readdir(schemaDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => entry.name)
    .sort();

  let nextId = 1;
  const modules: ExtractedModule[] = [];

  for (const fileName of files) {
    const fullPath = path.join(schemaDir, fileName);
    const content = await readFile(fullPath, "utf8");
    const lines = content.split("\n");
    const symbols: ExtractedSymbol[] = [];

    lines.forEach((line, index) => {
      const match = line.match(exportedSymbolPattern);
      if (!match) {
        return;
      }

      const name = match[1];
      if (!name) {
        return;
      }

      const comment = readJsDocAbove(lines, index);
      symbols.push({
        id: nextId,
        name,
        kind: toKind(line),
        summary: comment.summary,
        tags: comment.tags,
        sourcePath: path.join("docs", "_specs", "schemas", fileName).replaceAll("\\", "/"),
        line: index + 1,
      });
      nextId += 1;
    });

    modules.push({
      id: nextId,
      name: fileName.replace(/\.ts$/, ""),
      summary: extractModuleOverviewFromSource(content),
      sourcePath: path.join("docs", "_specs", "schemas", fileName).replaceAll("\\", "/"),
      symbols: symbols.sort((a, b) => a.name.localeCompare(b.name)),
    });
    nextId += 1;
  }

  return {
    schemaVersion: "1.0.0",
    modules,
  };
}

function resolveTypeDocBin(): string | null {
  const candidates = [
    path.join(repoRoot, "node_modules", "typedoc", "bin", "typedoc"),
    path.join(repoRoot, "node_modules", "typedoc", "bin", "typedoc.cjs"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function extractViaTypeDoc(rawOutputPath: string): Promise<ExtractedModel> {
  const typedocBin = resolveTypeDocBin();
  if (!typedocBin) {
    throw new Error("TypeDoc executable not found");
  }

  await execFileAsync(process.execPath, [typedocBin, "--options", paths.typedocConfig, "--json", rawOutputPath], {
    cwd: repoRoot,
    maxBuffer: 1024 * 1024 * 20,
  });

  const raw = await readFile(rawOutputPath, "utf8");
  const parsed = JSON.parse(raw) as TypeDocNode;
  return normalizeTypedocProject(parsed);
}

async function fillModuleSummaries(model: ExtractedModel): Promise<ExtractedModel> {
  const modules = await Promise.all(
    model.modules.map(async (moduleItem) => {
      if (moduleItem.summary && moduleItem.summary.trim().length > 0) {
        return moduleItem;
      }
      if (!moduleItem.sourcePath) {
        return moduleItem;
      }

      const fullPath = path.isAbsolute(moduleItem.sourcePath)
        ? moduleItem.sourcePath
        : path.join(repoRoot, moduleItem.sourcePath);

      const source = await readFile(fullPath, "utf8").catch(() => "");
      const summary = extractModuleOverviewFromSource(source);
      if (summary.length === 0) {
        return moduleItem;
      }

      return {
        ...moduleItem,
        summary,
      };
    })
  );

  return {
    ...model,
    modules,
  };
}

async function main(): Promise<void> {
  await mkdir(path.dirname(paths.extractRaw), { recursive: true });

  let model: ExtractedModel;
  try {
    model = await extractViaTypeDoc(paths.extractRaw);
    console.log("Extraction mode: typedoc");
  } catch {
    model = await extractFromSourceFiles();
    console.log("Extraction mode: source-scan fallback");
  }

  model = await fillModuleSummaries(model);

  await writeFile(paths.extractModel, `${JSON.stringify(model, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(repoRoot, paths.extractModel)}`);
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
