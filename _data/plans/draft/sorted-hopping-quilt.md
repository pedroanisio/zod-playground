# Plan: Add Schema Visualization via zod-mermaid

## Context

The Zod playground currently has two panels: a schema editor (left) and value validation (right). Users write Zod schemas and test values against them but have no visual representation of the schema structure. Adding ER diagram visualization via `zod-mermaid` surfaces the validation constraints that are Zod's core purpose -- field types, cardinality, min/max, enum values, uuid/email patterns -- directly in the diagram. Class diagrams and flowcharts are secondary options.

**Deliverable:** A formal PlanSchema JSON file at `_data/plans/plan.schema-visualization.<timestamp>.json`, plus implementation of the feature.

## Architecture Decision: CDN Dynamic Import

Both `zod-mermaid` and `mermaid` will be loaded from CDN at runtime (not bundled):

- **Why:** The playground already loads Zod from jsDelivr CDN dynamically. `zod-mermaid` imports `zod` internally -- if bundled, it gets its own Zod instance, but schemas are created from CDN-loaded Zod. Cross-instance `instanceof` checks would fail. Loading `zod-mermaid` from CDN lets jsDelivr resolve its `zod` dependency from the same CDN cache.
- **Zod 4 only:** `zod-mermaid` requires Zod 4 (`^4.0.5`). Visualization is disabled when Zod 3.x is selected.
- **Mermaid from CDN:** Mermaid is ~2MB. CDN loading keeps the app bundle unchanged. Lazy-loaded on first diagram tab click.

## UX: Tab in Right Panel

A `Tabs` component (Mantine `Tabs`) in the right panel toggles between "Values" (existing) and "Diagram" views. Rationale:
- Minimal layout change; two-panel structure preserved
- Three panels would crowd screens (each gets ~440px on 1440px)
- Users don't need values and diagram simultaneously
- Diagram tab disabled with tooltip when Zod 3.x is selected

## Files to Create

1. **`src/features/SchemaVisualization/SchemaVisualization.tsx`** (~120 lines)
   - Accepts `schema` (evaluated Zod schema object) and `isZod4` boolean
   - `SegmentedControl` for diagram type: ER (default) | Class | Flowchart
   - Copy Mermaid button (reuses existing `CopyButton`)
   - Shows "Requires Zod 4+" alert when `isZod4` is false
   - SVG container with overflow scroll for large diagrams

2. **`src/features/SchemaVisualization/SchemaVisualization.module.css`** (~30 lines)
   - Follow existing `.valueTitle` / `.valueContainer` patterns from [ValueEditor.module.css](src/features/ValueEditor/ValueEditor.module.css)

3. **`src/features/SchemaVisualization/useSchemaVisualization.ts`** (~80 lines)
   - Custom hook: lazy-loads zod-mermaid + mermaid from CDN (cached after first load)
   - Debounces diagram generation (500ms -- schemas change per keystroke)
   - Returns `{ svg, mermaidText, isLoading, error }`
   - Stale render prevention via generation counter
   - Respects dark mode: re-initializes mermaid with `theme: 'dark'` based on Mantine color scheme

4. **`tests/schemaVisualization.e2e.ts`** (~60 lines)
   - Diagram tab visible, click shows SVG
   - Diagram type switching changes output
   - Zod 3 shows "Requires Zod 4+" message
   - Values tab still works after viewing diagram (regression)

## Files to Modify

1. **[src/App.tsx](src/App.tsx)** -- Right panel: wrap content in Mantine `Tabs`. Add `isZod4` computation (`Number.parseInt(version.split('.')[0], 10) >= 4`). Import + render `SchemaVisualization`. ~25 lines changed.

2. **[src/App.module.css](src/App.module.css)** -- Add `.tabs` / `.tabPanel` styles so `Tabs.Panel` fills available height (flex layout). ~15 lines added.

## Key Patterns to Reuse

- CDN loading pattern: [src/zod.ts:22-27](src/zod.ts#L22-L27) (`import(/* @vite-ignore */ url)`)
- Version detection: [src/zod.ts:15](src/zod.ts#L15) (`Number.parseInt(version.split('.')[0], 10) >= 4`)
- Title bar styling: [src/App.module.css:37-44](src/App.module.css#L37-L44) (`.sectionTitle` pattern)
- Color scheme detection: [src/features/ValueEditor/ValueEditor.tsx:73-75](src/features/ValueEditor/ValueEditor.tsx#L73-L75)
- `CopyButton` component: [src/features/CopyButton.tsx](src/features/CopyButton.tsx)
- `SegmentedControl` pattern: exists in VersionPicker for zod/zod-mini toggle

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| jsDelivr `+esm` fails for zod-mermaid deep imports | Medium | Test CDN URL first; fallback to esm.sh or bundling |
| Cross-Zod-version duck typing breaks | Low | zod-mermaid uses `.def.type` property checks, stable across Zod 4.x |
| Mermaid dark mode rendering | Low | Pass `theme: 'dark'` to `mermaid.initialize()` based on color scheme |
| Large schemas produce unreadable diagrams | Low | SVG container with overflow scroll; future: add zoom/pan |
| Primitive schemas (e.g. `z.string()`) produce trivial diagrams | Low | Show informational message for non-object schemas |

## Verification

1. `npm run dev` -- open playground, write a Zod 4 object schema, click Diagram tab, verify ER diagram renders
2. Switch diagram types via SegmentedControl -- verify output changes
3. Switch to Zod 3.x version -- verify "Requires Zod 4+" message
4. Switch back to Values tab -- verify validation still works
5. `npm run test:e2e` -- new E2E tests pass
6. `npm run build` -- no bundle size regression (zod-mermaid + mermaid are CDN-only)
7. `npm run biome:check` -- no lint errors

## Implementation Order

1. Create `useSchemaVisualization` hook (core async logic)
2. Create `SchemaVisualization` component + CSS
3. Integrate into `App.tsx` with Tabs
4. Adjust `App.module.css` for Tabs layout
5. Add E2E tests
6. Generate formal PlanSchema JSON (deliverable per `create-plan.md`)
