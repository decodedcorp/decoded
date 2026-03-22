> STATUS: DRAFT — not approved for implementation

# NEXT-04: Commerce Bridge — Visual Search + Affiliate Mall Integration

> Direction: Visual Search → Intent → Commerce | Updated: 2026-02-20
> Audience: Internal decision-making + future AI agent context injection
> Builds on: NEXT-01 (Service Identity), current system (spots, solutions, affiliate_url)

---

## Concept

The Commerce Bridge connects decoded's existing item detection pipeline to an affiliate shopping mall via Visual Search. Current flow: user sees a spotted item → taps solution card → affiliate link opens externally. Next flow: user expresses shopping intent → Visual Search finds that item (or similar) across partner malls → seamless commerce handoff.

## Architecture Overview

```
Current:  Image → AI Detection → Spots → Solutions → affiliate_url (static, pre-stored)

Next:     Image → AI Detection → Spots → Visual Search Query → Live Mall Results
                                         ↑ entry point also: camera search, saved items
```

## Three Integration Layers

### Layer 1 — Enhanced Spot-to-Search Bridge

Existing spots become Visual Search entry points.

- User taps a spot → solution card shows (existing) + "Find Similar" CTA (new)
- "Find Similar" triggers Visual Search: crop of spot region → image embedding → mall search API
- Results return ranked product cards from affiliate partners (not just the pre-stored solution)
- Key: `SolutionRow.affiliate_url` remains the primary link; Visual Search is an additive path

**Integration point:** `/api/v1/spots/[spotId]/visual-search` (new route)

### Layer 2 — Intent Signal Detection

System detects shopping intent from user behavior and surfaces commerce actions proactively.

- Dwelling on a spot for >2s → "Shop This" micro-CTA surfaces without tap
- Saving an image → auto-queues item detection + affiliate match in background
- Share action → includes "Shop the look" deep link to Visual Search results

**Key change:** Session-level intent signals read by layout orchestrator (connects to NEXT-03 Stage 4).

### Layer 3 — Affiliate Mall Integration

Structured integration with partner affiliate malls (not just URL passthrough).

- Partner mall API integration: product catalog sync, availability, pricing
- Decoded earns affiliate commission on purchases attributed to visual search entry
- Attribution window: 7-day click cookie (standard affiliate model)
- Fallback: if mall API unavailable, fall back to existing `affiliate_url` static link

**Affiliate data flow:**
```
Visual Search Result → Affiliate Link (with tracking param) → Mall Checkout
                       ↓
               Decoded attribution tracking (server-side postback or pixel)
```

## Integration Points (Current System)

| Current | Role | Commerce Bridge Extension |
|---------|------|--------------------------|
| `spots` table | Detected item anchor | Entry point for Visual Search query |
| `solutions` table | Item + affiliate data | Fallback when Visual Search unavailable |
| `SolutionRow.affiliate_url` | Static affiliate link | Static fallback; Visual Search replaces in Layer 2+ |
| `/api/v1/posts/analyze` | AI detection | Provides item category + bounding box for Visual Search crop |

## Rollout Sequence

1. Layer 1 (MVP): Visual Search on existing spots, one partner mall
2. Layer 2: Intent signals + proactive commerce surfacing
3. Layer 3: Full affiliate mall API integration + attribution pipeline

## Out of Scope (This Document)

- Specific mall partner names or commercial terms
- Visual Search model architecture (image embedding approach)
- Legal/compliance for affiliate tracking
- Pricing display or cart integration
