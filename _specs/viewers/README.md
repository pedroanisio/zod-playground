# Viewer Preview Package

Local React/Vite host for previewing viewer templates from `docs/_specs/viewers`.

## Run

```bash
cd docs/_specs/viewers
pnpm install
pnpm dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## Pick Viewer

Use the top-left dropdown, or set query param:

- `?viewer=registry`
- `?viewer=feedback`
- `?viewer=feature_registry`
- `?viewer=mental_model`
- `?viewer=plan`
