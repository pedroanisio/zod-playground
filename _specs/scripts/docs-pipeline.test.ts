import assert from "node:assert/strict";
import test from "node:test";

import { buildExecutionPlan, normalizeAction } from "./docs-pipeline.ts";

test("normalizeAction defaults to generate", () => {
  assert.equal(normalizeAction(undefined), "generate");
});

test("normalizeAction rejects unknown action", () => {
  assert.throws(() => normalizeAction("invalid"), /Unsupported pipeline action/);
});

test("build action includes mkdocs build stage", () => {
  const stages = buildExecutionPlan("build");
  assert.equal(stages[0]?.name, "extract");
  assert.equal(stages[1]?.name, "render");
  assert.equal(stages[2]?.name, "mkdocs-build");
});

test("serve action only runs mkdocs serve", () => {
  const stages = buildExecutionPlan("serve");
  assert.equal(stages.length, 1);
  assert.equal(stages[0]?.name, "mkdocs-serve");
});
