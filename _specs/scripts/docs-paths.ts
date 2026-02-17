import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
export const repoRoot = path.resolve(currentDir, "../..");

export const paths = {
  typedocConfig: path.join(repoRoot, "_specs", "typedoc.json"),
  mkdocsConfig: path.join(repoRoot, "_specs", "mkdocs.yml"),
  extractRaw: path.join(repoRoot, "_data", "generated", "typedoc", "raw.json"),
  extractModel: path.join(repoRoot, "_data", "generated", "typedoc", "schemas.json"),
  generatedDocsDir: path.join(repoRoot, "generated", "schemas"),
  moduleTemplate: path.join(repoRoot, "_specs", "scripts", "templates", "module-page.md.tmpl"),
  indexTemplate: path.join(repoRoot, "_specs", "scripts", "templates", "index-page.md.tmpl"),
};
