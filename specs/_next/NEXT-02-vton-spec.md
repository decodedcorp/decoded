> STATUS: ACTIVE — Phase 1 promoted to Milestone 7 (AI Magazine & Archive Expansion)
> Promoted: 2026-03-05 | Original draft: 2026-02-20

# NEXT-02: Virtual Try-On (VTON) Technical Architecture

> Direction: Phase 1-3 VTON rollout | Updated: 2026-03-12
> Implementation: SCR-VTON-01 (Try-on Studio), FLW-05 (cinematic sequence)
> Audience: Internal decision-making + future AI agent context injection
> Builds on: NEXT-01 (Service Identity)
> User flow reference: [FLW-05 VTON](../flows/FLW-05-vton.md) — 5-stage cinematic fitting sequence

---

## Concept

VTON lets users see detected items (from image spots) virtually fitted on themselves. The 5-stage cinematic sequence (Pick & Drop → Chic Blur → Blueprint → Magic Flip → Morphing Loop) defined in FLW-05 is the UX layer — this document covers the technical architecture beneath it.

## Phase Architecture

### Phase 1 — MVP (Feature-Flagged Proof of Concept)

**Goal:** End-to-end flow from item tap → rendered result. No user photo required.
**Architecture:**
- Input: detected item image (from existing `spots.solution_id` → product image URL)
- Processing: **Google Vertex AI Virtual Try-On API** (`virtual-try-on-001`)
  - Endpoint: `POST https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/virtual-try-on-001:predict`
  - Synchronous API — no polling needed (result returned in single response)
  - `personImage`: mannequin/stock model image (Phase 1) or user photo (Phase 2)
  - `productImages`: item image from solution data (product image URL → base64)
  - `sampleCount`: 1 (MVP), up to 4
  - `baseSteps`: 16 (PoC validated — quality comparable to 32, 30% faster)
  - `personGeneration`: "allow_adult"
- Output: base64 PNG/JPEG result image rendered in result screen
- Auth gate: logged-in users only (feature flag in `authStore`)
- Storage: ephemeral — result not persisted, session-only

**API integration notes:**
- Google API is **synchronous** — simplifies architecture (no taskId polling pattern needed)
- Response time ~10s (`baseSteps=16`) — cinematic sequence should be ~10s to match
- API route: `POST /api/v1/vton/apply` → calls Vertex AI → returns base64 result
- Rate limiting: per-user, GCP quota management
- Cost: Vertex AI Imagen pricing (confirm per-inference cost → map to credit system)

**Item eligibility (from PoC 2026-03-12):**
- ✅ Supported: dresses, tops, shirts, jackets, coats — upper/full-body garments
- ❌ Not supported: handbags, stockings, shoes, accessories — API forces garment interpretation
- Filter: show "Try On" CTA only for items where `sam_prompt` contains clothing keywords

### Phase 2 — User Photo Integration

**Goal:** User photo as the fitting base for personalized results.
**Architecture:**
- Add photo capture/upload sub-flow (camera or gallery pick)
- User photo stored temporarily (presigned S3 URL, 24h TTL)
- Google VTON API call: `personImage` = user photo + `productImages` = item image → fitted result
- `sampleCount`: 2-4 (multiple angle/variation options)
- Result optionally saved to user's "Try-On History" (new DB table: `vton_results`)
- Privacy: user photo never persisted beyond session without explicit opt-in

**Dependencies:** S3 presigned upload, Supabase table, GCP service account credentials.

### Phase 3 — Scale & Personalization

**Goal:** VTON as a core commerce-driving feature, personalized by body profile.
**Architecture:**
- User body profile (height, measurements) stored in `users` table (new columns)
- VTON model fine-tuned or parameterized with body profile for better fit accuracy
- Result gallery: persistent, shareable, linkable (`/vton/[resultId]`)
- Batch processing queue for peak load (background job, not synchronous)
- Analytics: conversion tracking from VTON result → affiliate link tap

## Item Eligibility Filter

"Try On" CTA is only shown for items compatible with the VTON API. Filter by `item.sam_prompt`:

```typescript
const VTON_ELIGIBLE_KEYWORDS = [
  'dress', 'top', 'shirt', 'blouse', 'jacket', 'coat',
  'sweater', 'hoodie', 'cardigan', 'vest', 'tank',
  'jumpsuit', 'romper', 'bodysuit', 'polo', 'tee',
];

function isVtonEligible(samPrompt: string): boolean {
  const lower = samPrompt.toLowerCase();
  return VTON_ELIGIBLE_KEYWORDS.some((kw) => lower.includes(kw));
}
```

Excluded: handbag, bag, shoe, boot, stocking, hat, jewelry, watch, sunglasses, belt, scarf (accessories).

## Integration Points (Current System)

| Touchpoint | Current spec | VTON hook |
|------------|-------------|-----------|
| Item spot selection | FLW-02 Solution Panel | "Try On" CTA added to solution card (if `isVtonEligible`) |
| Auth check | `authStore.selectIsLoggedIn` | VTON requires `isLoggedIn` (not guest) |
| Item data | `item.cropped_image_path` | Garment image from R2 CDN → base64 |

## API Vendor Decision

**Selected: Google Vertex AI Virtual Try-On API** (`virtual-try-on-001`)
- Decision date: 2026-03-12
- Rationale:
  - Synchronous API — no async polling complexity, response during cinematic animation
  - GCP ecosystem alignment (project: `decoded-editorial`)
  - Stable infra with SLA guarantees
  - Simple integration: base64 image in/out, no separate storage pipeline
- Item images sourced from `item.cropped_image_path` (R2 CDN) → base64 conversion at API route level

**PoC Results (2026-03-12):**

| Test | baseSteps | Latency | Result |
|------|-----------|---------|--------|
| white lace dress | 16 | 9.6s | ✅ Good quality |
| white lace dress | 24 | 11.1s | ✅ Comparable |
| white lace dress | 32 | 13.8s | ✅ Marginal improvement |
| black lace dress | 32 | 12.4s | ✅ |
| navy blue dress | 32 | 12.1s | ✅ |
| handbag | 32 | 11.5s | ❌ Converted to shirt — not viable |
| stockings | 32 | 12.2s | ❌ Converted to t-shirt — not viable |

- Input: `item.cropped_image_path` from R2 CDN works directly
- Recommended: `baseSteps=16` for production (quality/speed sweet spot)
- Person image: full-body photos yield best results

## Out of Scope (This Document)

- UI component specs (follow FLW-05 for flow, SCR-VTON-01~04 for screens)
- Avatar/body profile capture UI (separate sub-flow)
