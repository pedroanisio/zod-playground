import assert from "node:assert/strict";
import test from "node:test";

import { renderIndexPage, renderModulePage } from "./render-tsdoc.ts";

const moduleTemplate = `# {{module_title}}\n\n{{source}}\n\n{{module_overview}}\n\n{{companion}}\n\n## Symbols\n\n{{symbol_sections}}\n`;
const indexTemplate = `# Schema Reference\n\n{{module_list}}\n`;

test("module page renders tags and companion links", () => {
  const output = renderModulePage(
    {
      id: 1,
      name: "plan-schema",
      sourcePath: "docs/_specs/schemas/plan-schema.ts",
      symbols: [
        {
          id: 2,
          name: "PlanSchema",
          kind: "Variable",
          summary: "Plan root schema",
          tags: [
            { tag: "@remarks", text: "Important details" },
            { tag: "@example", text: "{\"schemaVersion\":\"0.3.0\"}" },
          ],
        },
      ],
    },
    moduleTemplate
  );

  assert.match(output, /@remarks/);
  assert.match(output, /@example/);
  assert.match(output, /plan-schema-protocol/);
  assert.match(output, /\*\*Overview:\*\*/);
});

test("index page lists module links", () => {
  const output = renderIndexPage(
    {
      schemaVersion: "1.0.0",
      modules: [
        { id: 1, name: "adr", symbols: [], sourcePath: "docs/_specs/schemas/adr.ts" },
        { id: 2, name: "version-mixin", symbols: [], sourcePath: "docs/_specs/schemas/version-mixin.ts" },
      ],
    },
    indexTemplate
  );

  assert.match(output, /\[adr\]\(adr.md\)/);
  assert.match(output, /version-mixin-design/);
});
