# Database Schema Update Checklist

**Purpose:** Ensure consistent updates across types, code, and documentation when the database schema changes.

---

## 0. Trigger Conditions

Use this checklist when:

- A new migration is applied (e.g., adding columns, changing enums).
- `db MCP` reveals a discrepancy in `image`, `item`, or `post` tables.
- You encounter a runtime error related to missing columns or unknown enum values.

---

## 1. Verify Schema Changes (via MCP)

- [ ] **Run MCP Tool**: `mcp_supabase-decoded-ai_list_tables` for the relevant tables.
- [ ] **Snapshot**: Capture the new columns, changed enums, or modified types.
- [ ] **Metadata**: Update the "Last updated" date in `docs/database/01-schema-usage.md`.

---

## 2. Synchronize TypeScript Types

- [ ] **Generate Types**: Run the type generation command.
  ```bash
  supabase gen types typescript --project-id pdgvuwrxsfwrypadwdlu > lib/supabase/types.ts
  ```
  _(Or `yarn typegen:dev` if configured in package.json)_
- [ ] **Diff Check**: Open `lib/supabase/types.ts` and verify:
  - New columns appear in `Row` / `Insert` / `Update` interfaces.
  - New enum values are added to `Enums`.
  - JSONB fields are correctly typed (often `Json` or `any`, requiring manual app-level typing).

---

## 3. Code Audit & Updates

### 3.1 Queries (`lib/supabase/queries/`)

- [ ] **Explicit Selects**: If not using `select('*')`, ensure new columns are added to the select string.
- [ ] **Type Assertions**: If casting results (e.g., `as ImageRow`), verify the cast remains valid.

### 3.2 Hooks & State

- [ ] **React Query Keys**: Do new fields require new query keys? (e.g., filtering by a new column).
- [ ] **Zustand Stores**: Check if stores (like `useFilterStore`) rely on hardcoded enum values that need updating.
- [ ] **App-Level Types**: Update manual interfaces (e.g., `ItemWithParsedData`) to reflect new JSON structures or columns.

### 3.3 Field Mapping (Critical for Item Images)

- [ ] **Check Field Mappings**: If `item` table columns changed, verify field mappings in `lib/components/detail/types.ts:normalizeItem()`.
- [ ] **DbItem → UiItem**: Ensure all DB fields that need UI representation are mapped:
  - `cropped_image_path` → `imageUrl` (required for item images)
  - `center` → `normalizedBox` / `normalizedCenter` (required for highlighting)
- [ ] **Component Props**: Verify components use UI field names (`item.imageUrl`) not DB names (`item.cropped_image_path`).
- [ ] **Reference**: See `docs/database/03-data-flow.md` for complete field mapping documentation.

---

## 4. Documentation Update

- [ ] **Update Usage Guide**: Edit `docs/database/01-schema-usage.md`.
  - Add new columns/enums.
  - Update usage flows if logic changes (e.g., "Status X now triggers Y").
  - Update Mermaid diagrams if relationships change.
  - **Changelog**: Add a new entry with the date and summary of changes.

---

## 5. Verification

- [ ] **Build Check**: Run `yarn build` (or `tsc`) to catch type errors.
- [ ] **Manual Test**:
  - Run the dev server.
  - Verify data loading in the UI.
  - Check browser console for warnings.

---

## 6. Commit

- [ ] **Message**: "docs(db): update schema guide and types for [feature/migration]"

---

> **Recommendation:** Add `- [ ] Run docs/database/02-update-checklist.md` to your Pull Request template for schema-related changes.
