---
phase: quick
plan: 042
type: execute
wave: 1
depends_on: []
files_modified:
  - docs/diagrams/service-journey-scenario.excalidraw
autonomous: true
must_haves:
  truths:
    - "Excalidraw file opens correctly in Excalidraw editor"
    - "All 4 phases (Discovery, Personalization, Deep Experience, Retention) are visually distinct"
    - "All 8 nodes are present with correct labels and spec references"
    - "Arrows show the user journey flow between nodes"
    - "Summary table with Phase/Action/System/Emotion is rendered at bottom"
  artifacts:
    - path: "docs/diagrams/service-journey-scenario.excalidraw"
      provides: "Complete service journey scenario diagram"
---

<objective>
Create an Excalidraw JSON diagram visualizing decoded's "Next Generation Magazine" 4-phase service journey scenario.

Purpose: Provide a visual map of the full user journey from discovery through retention, referencing spec screen IDs and showing system background processes alongside user emotions.
Output: Single `.excalidraw` file in `docs/diagrams/`
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@docs/diagrams/navigation-flow.excalidraw (reference for Excalidraw JSON structure and element patterns)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create service journey scenario Excalidraw diagram</name>
  <files>docs/diagrams/service-journey-scenario.excalidraw</files>
  <action>
Create a single Excalidraw JSON file following the existing pattern in `docs/diagrams/navigation-flow.excalidraw`.

**Layout: Left-to-right flow across 4 phase columns (~1800px wide, ~900px tall)**

**Phase grouping boxes (large rounded rectangles as backgrounds):**
- Phase 1 "Discovery (The Hook)" — color: #fff3bf (warm yellow bg)
- Phase 2 "Personalization (The Ritual)" — color: #d0bfff (purple bg)
- Phase 3 "Deep Experience (The Magic)" — color: #b2f2bb (green bg)
- Phase 4 "Retention & Archive (The Library)" — color: #a5d8ff (blue bg)

**Nodes (rectangles with rounded corners inside each phase):**
Phase 1:
- Node 1: "Guest Landing" (subtitle: "Black & neon theme") — bg: #ffd43b
- Node 2: "Daily Editorial\nSCR-MAG-01" (subtitle: "AI magazine + GSAP") — bg: #ffd43b
- Action label: "Item click -> shopping popup -> desire trigger"

Phase 2:
- Node 3: "SNS Linkage" (subtitle: "Pinterest/Instagram") — bg: #b197fc
- Node 4: "Decoding Ritual\nSCR-MAG-02" (subtitle: "Taste analysis + particles") — bg: #b197fc
- Action label: "Analysis -> Vol.01: [User] Edition born"

Phase 3:
- Node 5: "Personal Magazine\nSCR-MAG-02 result" (subtitle: "Personalized layout") — bg: #69db7c
- Node 6: "AI Try-on Studio\nSCR-VTON-01" (subtitle: "Virtual try-on FLW-05") — bg: #69db7c
- Action label: "Save to Collection / Share to IG"

Phase 4:
- Node 7: "My Bookshelf\nSCR-COL-01" (subtitle: "3D bookshelf") — bg: #74c0fc
- Node 8: "Credit System" (subtitle: "Tag/Share -> credits -> next issue") — bg: #74c0fc
- Action label: "Push: New taste discovered"

**Arrows (type: arrow):**
- Node 1 -> Node 2 (within Phase 1)
- Node 2 -> Node 3 (Phase 1 -> Phase 2 transition)
- Node 3 -> Node 4 (within Phase 2)
- Node 4 -> Node 5 (Phase 2 -> Phase 3 transition)
- Node 5 -> Node 6 (within Phase 3)
- Node 6 -> Node 7 (Phase 3 -> Phase 4 transition)
- Node 7 -> Node 8 (within Phase 4)
- Node 8 -> Node 2 (retention loop back, dashed style)

**Emotion bar at bottom of each phase (small text labels):**
- Phase 1: "Curiosity"
- Phase 2: "Anticipation"
- Phase 3: "Achievement + Aha-moment"
- Phase 4: "Ownership"

**Summary table at bottom (~y: 750):**
Render as a group of rectangles forming a table with columns: Phase | User Action | System Background | Emotion
5 data rows matching the summary table from the spec.

**Title at top center:** "DECODED Service Journey — Next Generation Magazine"

Follow the exact JSON element structure from navigation-flow.excalidraw:
- Each element needs: id, type, x, y, width, height, strokeColor, backgroundColor, fillStyle, strokeWidth, roughness, opacity
- Text elements need: text, fontSize, fontFamily, textAlign, verticalAlign
- Arrows need: points array with [x,y] offsets, startBinding/endBinding with elementId
- Use `"roughness": 1` for hand-drawn style consistent with other diagrams
- Include `"type": "excalidraw", "version": 2, "source": "https://excalidraw.com"` wrapper
- End with `"appState": { "viewBackgroundColor": "#ffffff" }` and empty `"files": {}`
  </action>
  <verify>
1. `cat docs/diagrams/service-journey-scenario.excalidraw | python3 -m json.tool > /dev/null` — valid JSON
2. `grep -c '"type": "rectangle"' docs/diagrams/service-journey-scenario.excalidraw` — should show 8+ rectangles (nodes) + phase boxes + table cells
3. `grep -c '"type": "arrow"' docs/diagrams/service-journey-scenario.excalidraw` — should show 8 arrows
4. `grep -c '"type": "text"' docs/diagrams/service-journey-scenario.excalidraw` — should show 20+ text elements
5. Verify all 8 node names present: Guest Landing, Daily Editorial, SNS Linkage, Decoding Ritual, Personal Magazine, AI Try-on Studio, My Bookshelf, Credit System
  </verify>
  <done>
- Valid Excalidraw JSON file at docs/diagrams/service-journey-scenario.excalidraw
- All 4 phases visually grouped with distinct background colors
- All 8 journey nodes present with correct labels and spec references
- 8 arrows connecting the flow including retention loop
- Emotion labels per phase
- Summary table rendered at bottom
- File opens correctly in Excalidraw editor
  </done>
</task>

</tasks>

<verification>
- JSON parses without errors
- All spec references (SCR-MAG-01, SCR-MAG-02, SCR-VTON-01, SCR-COL-01, FLW-05) present
- Diagram is visually coherent when opened in Excalidraw
</verification>

<success_criteria>
- Single Excalidraw file created at docs/diagrams/service-journey-scenario.excalidraw
- Diagram covers all 4 phases, 8 nodes, connecting arrows, emotions, and summary table
- Follows same JSON structure as existing diagrams in docs/diagrams/
</success_criteria>

<output>
After completion, create `.planning/quick/042-excalidraw-service-journey-scenario/042-SUMMARY.md`
</output>
