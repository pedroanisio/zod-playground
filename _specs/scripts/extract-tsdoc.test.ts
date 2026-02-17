import assert from "node:assert/strict";
import test from "node:test";

import { extractModuleOverviewFromSource, normalizeTypedocProject } from "./extract-tsdoc.ts";

const sampleProject = {
  children: [
    {
      id: 2,
      name: "beta",
      kindString: "Module",
      children: [
        {
          id: 8,
          name: "zeta",
          kindString: "Variable",
          comment: {
            summary: [{ text: "zeta summary" }],
            blockTags: [{ tag: "@remarks", content: [{ text: "zeta remarks" }] }],
          },
          sources: [{ fileName: "/repo/docs/_specs/schemas/beta.ts", line: 10 }],
        },
      ],
      sources: [{ fileName: "/repo/docs/_specs/schemas/beta.ts", line: 1 }],
    },
    {
      id: 1,
      name: "alpha",
      kindString: "Module",
      children: [
        {
          id: 6,
          name: "__type",
          kindString: "Type literal",
        },
        {
          id: 7,
          name: "alphaFn",
          kindString: "Function",
          signatures: [
            {
              comment: {
                summary: [{ text: "alpha summary" }],
                blockTags: [
                  { tag: "@example", content: [{ text: "example" }] },
                  { tag: "@remarks", content: [{ text: "remarks" }] },
                ],
              },
            },
          ],
          sources: [{ fileName: "/repo/docs/_specs/schemas/alpha.ts", line: 42 }],
        },
      ],
      sources: [{ fileName: "/repo/docs/_specs/schemas/alpha.ts", line: 1 }],
    },
  ],
};

test("normalization sorts modules and symbols and preserves tags", () => {
  const model = normalizeTypedocProject(sampleProject as never);

  assert.equal(model.modules[0]?.name, "alpha");
  assert.equal(model.modules[1]?.name, "beta");
  assert.equal(model.modules[0]?.symbols.length, 1);

  const symbol = model.modules[0]?.symbols[0];
  assert.equal(symbol?.name, "alphaFn");
  assert.equal(symbol?.summary, "alpha summary");
  assert.equal(symbol?.kind, "function");
  assert.deepEqual(symbol?.tags.map((tag) => tag.tag), ["@example", "@remarks"]);
});

test("normalization maps numeric kinds into readable labels", () => {
  const model = normalizeTypedocProject({
    children: [
      {
        id: 1,
        name: "alpha",
        kind: 2,
        children: [
          {
            id: 2,
            name: "ALPHA_CONST",
            kind: 32,
            flags: { isConst: true },
          },
          {
            id: 3,
            name: "AlphaType",
            kind: 2097152,
          },
        ],
      },
    ],
  } as never);

  assert.equal(model.modules[0]?.symbols[0]?.kind, "const");
  assert.equal(model.modules[0]?.symbols[1]?.kind, "type");
});

test("module overview extraction prefers descriptive sentences", () => {
  const summary = extractModuleOverviewFromSource(`
// Copyright (c) source-code. Licensed under MIT.
//
// ADR Schema
//
import { z } from "zod";
// Unified module: Zod v4 validation + JSONL serialization.
// Merges grid-editor and iande-builder ADR contracts.
export const A = z.string();
`);

  assert.equal(summary, "Unified module: Zod v4 validation + JSONL serialization. Merges grid-editor and iande-builder ADR contracts.");
});
