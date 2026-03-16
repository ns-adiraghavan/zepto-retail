
## Plan: Load all 7 datasets from `.json.gz` files using pako

### Problem
- `DataContext.tsx` currently tries cloud storage first, then falls back to uncompressed local `.json` files.
- The `.json.gz` compressed files are now the source of truth in `public/data/`.
- The uncompressed local `.json` fallback may not exist or be outdated.
- `sku_master`, `platform_summary`, and `competitor_events` are currently **statically imported** in `dataLoader.ts` from `src/data/` — they are never fetched dynamically.
- `pako` is not installed.

### What needs to change

**1. Install `pako`**
Add `pako` and `@types/pako` to dependencies in `package.json`.

**2. Update `DataContext.tsx` — rewrite fetch logic**
- Remove all cloud storage URL logic entirely.
- Add all 7 dataset keys: extend `DatasetKey` to include `sku_master`, `platform_summary`, `competitor_events`.
- New `fetchGzip(filename)` utility:
  ```typescript
  const