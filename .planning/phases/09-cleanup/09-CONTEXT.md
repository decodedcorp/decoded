# Phase v4-09: Cleanup - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Retire old bundle spec directories so AI agents only see the new v4.0 structure. Remove 8 old bundle directories from `specs/`, clean up stale references in spec files, and verify the final directory structure matches the target layout. No code changes — documentation cleanup only.

</domain>

<decisions>
## Implementation Decisions

### Admin specs fate
- `specs/admin/` stays as-is at current location — exception to the "only v4.0 directories" rule
- Admin specs are v3.0 format permanently — no future v4.0-format rewrite planned
- Update success criteria: specs/ root allows `_archive/, _shared/, _next/, flows/, screens/, admin/, README.md`
- Add `specs/admin/` to injection-guide as a loadable spec bundle for admin feature work

### Retirement method
- 8 old bundle directories to retire: `creation-ai/`, `detail-view/`, `discovery/`, `mobile-platform/`, `scroll-animation/`, `shared/`, `system-backend/`, `user-system/`
- Retirement approach: Claude's discretion (verify archive exists, then delete)
- Unarchived files (e.g., `api-endpoints.md`): Claude judges per file whether to archive first or just delete
- `shared/` directory: check for unique content not in `_shared/` before deleting (CMN-03, CMN-04, workflows may be unique)
- Clean up `.DS_Store` and other dotfiles from `specs/` after deletion

### Cross-reference sweep
- Scope: spec files only (`specs/` directory) — not CLAUDE.md, .planning/, or docs/
- Stale reference handling: update to new v4.0 path (not just remove)
- Final verification pass on `specs/README.md` — ensure it reflects the actual post-cleanup directory structure
- Do NOT audit completeness (whether all 14 screen specs are listed) — only remove/fix stale references

### Claude's Discretion
- Whether to verify archive completeness before deletion or delete directly (based on git history safety)
- Per-file judgment on unarchived files in old bundles
- How to handle `shared/` unique content (archive to `_archive/v2.1.0/shared/` or just keep in `_shared/`)
- Exact stale reference replacement paths (map old bundle paths to new v4.0 equivalents)

</decisions>

<specifics>
## Specific Ideas

- Target directory structure for `specs/` root after cleanup:
  ```
  specs/
  ├── _archive/      # v2.1.0 snapshot (read-only)
  ├── _next/         # NEXT-* draft documents
  ├── _shared/       # v4.0 shared foundation
  ├── admin/         # v3.0 admin specs (exception)
  ├── flows/         # v4.0 flow documents
  ├── screens/       # v4.0 screen specs
  └── README.md      # Updated index
  ```

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-cleanup*
*Context gathered: 2026-02-20*
