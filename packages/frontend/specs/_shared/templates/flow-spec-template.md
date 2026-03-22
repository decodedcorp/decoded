# [FLW-NN] Flow Name

> Screens: SCR-XXX-01 -> SCR-XXX-02 -> SCR-XXX-03 | Updated: YYYY-MM-DD

## Journey

Brief description of the user journey this flow covers and the goal the user achieves.

## Screen Sequence

```
[Screen A] --action--> [Screen B] --action--> [Screen C]
     |                      |
     v                      v
  [Alt path]           [Error state]
```

## Steps

### Step 1: Action Name

- **Screen:** SCR-XXX-01 (`/route`)
- **Trigger:** User does [action]
- **State change:** `store.field` changes from A to B
- **Data:** POST `/api/v1/endpoint` with `{ payload }`
- **Next:** -> Step 2 (on success) | -> Error (on failure)

### Step 2: Action Name

- **Screen:** SCR-XXX-02 (`/route`)
- **Trigger:** Previous step completes
- **State change:** `store.field` populated with response data
- **Data:** GET `/api/v1/endpoint/[id]`
- **Next:** -> Step 3 (on success) | -> Step 1 retry (on failure)

### Step 3: Action Name

- **Screen:** SCR-XXX-03 (`/route`)
- **Trigger:** User confirms
- **State change:** `store.status` set to "complete"
- **Data:** PATCH `/api/v1/endpoint/[id]` with `{ status: "complete" }`
- **Next:** -> Flow end / navigate to result

## State Transitions

| From | Event | To | Side Effect |
|------|-------|----|-------------|
| idle | user triggers action | loading | POST /api/v1/resource |
| loading | success response | processing | trigger secondary operation |
| processing | operation complete | review | populate result data |
| review | user confirms | submitting | PATCH /api/v1/resource |
| submitting | success | complete | navigate to result screen |
| any | network error | error | show retry toast |

## Shared Data

| Data | Source | Consumed By |
|------|--------|-------------|
| resourceId | Step 1 response | Step 2, Step 3 |
| items[] | Step 2 result | Step 3 review UI |
| finalStatus | Step 3 response | Navigation target |

## Error Recovery

| Error Point | Recovery | Fallback |
|-------------|----------|----------|
| Step 1 fails | Retry with toast | Return to entry screen |
| Step 2 fails | Retry silently | Show manual input option |
| Step 3 fails | Retry with confirm dialog | Preserve draft state |
