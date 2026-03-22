# [FLW-07] Credit Economy Flow

> Screens: SCR-MAG-02, SCR-VTON-01, Profile | Updated: 2026-03-05
> Cross-cutting: FLW-06 (Magazine Rendering), FLW-05 (VTON Cinematic)

## Journey

User enters a credit-gated feature (magazine generation or VTON try-on), sees their current balance, and either proceeds with an action that deducts credits optimistically before API confirmation, or is blocked and prompted to acquire more credits. On failure the deduction is rolled back. `creditStore` is the single source of truth shared across all consuming screens.

## Credit Cost Table

| Action | `action_type` | Cost | Endpoint |
|--------|---------------|------|----------|
| Magazine generate | `magazine_generate` | 1 credit | POST /api/v1/magazine/personal/generate |
| Magazine regenerate | `magazine_regenerate` | 1 credit | POST /api/v1/magazine/personal/generate |
| VTON try-on | `vton_apply` | 2 credits | POST /api/v1/vton/apply |
| Ink credit earn (tagging) | — | +N credits | planned |
| Credit top-up (purchase) | — | +N credits | planned |

## Screen Sequence

```
[Feature Entry: /magazine/personal or /vton]
     |
     v
[Step 1: Balance Fetch]
     |
     +-- balance >= cost --> [Step 2: Affordance Display] --> [Step 3: User Confirms]
     |                                                               |
     +-- balance < cost  --> [Insufficient State] <-- rollback --+  v
                                  |                              [Step 4: Optimistic Deduction]
                                  v                                  |
                             [Top-up prompt]          +-- 202 ok --> [Step 5: API Confirmation]
                             (planned)                |                    |
                                                      +-- 402/5xx --------+
                                                                          |
                                                                     [Step 6: Rollback]
```

## Steps

### Step 1: Balance Fetch on Feature Entry

- **Screen:** SCR-MAG-02 (`/magazine/personal`) or SCR-VTON-01 (`/vton`)
- **Trigger:** Page mounts; `authStore.selectIsLoggedIn` is true
- **EARS:** When the feature page mounts and the user is authenticated, the system shall call `creditStore.fetchBalance()` which issues GET `/api/v1/credits/balance`.
- **State change:** `creditStore.isLoading` set to true; on response, `creditStore.balance` populated and `lastFetched` set to `Date.now()`
- **Stale check:** When `lastFetched` is within 60 seconds, the system shall skip the fetch and use the cached balance.
- **Data:** GET `/api/v1/credits/balance` -> `CreditBalance { balance, lifetime_earned, lifetime_spent }`
- **Next:** -> Step 2 (balance received) | -> error state with retry (network failure)

### Step 2: Affordance Display

- **Screen:** SCR-MAG-02 or SCR-VTON-01
- **Trigger:** `creditStore.isLoading` becomes false with a valid balance
- **EARS:** When the balance is loaded and `creditStore.balance >= cost`, the system shall display the balance and enable the action CTA. When `creditStore.balance < cost`, the system shall disable the CTA and render the `CreditGate` / `VtonCreditConfirm` in a blocked state.
- **State change:** None; UI renders from `creditStore.selectCanAfford(cost)`
- **UI elements:**
  - Balance badge: `"Credits: {balance} remaining"` — always visible on feature screens
  - CTA enabled: `Generate` (magazine) or `Try On` (VTON) is interactive
  - CTA disabled: grayed out, tooltip or inline text cites insufficient credits
- **Next:** -> Step 3 (user taps enabled CTA) | -> top-up prompt (user taps disabled CTA — planned)

### Step 3: User Confirms Action

- **Screen:** SCR-MAG-02 or SCR-VTON-01 (`VtonCreditConfirm` overlay for VTON)
- **Trigger:** User taps action CTA
- **EARS:** When the user taps the action CTA, the system shall display a confirmation step showing the credit cost and remaining balance after deduction before calling the generation API.
- **State change:** `vtonStore.status` set to `'confirming'` (VTON only); magazine proceeds immediately to Step 4
- **Next:** -> Step 4 (user confirms) | -> Step 2 (user cancels)

### Step 4: Optimistic Deduction

- **Screen:** SCR-MAG-02 or SCR-VTON-01 (generation animation begins)
- **Trigger:** User confirms the action in Step 3; API call is dispatched
- **EARS:** When the generation API call is dispatched, the system shall immediately call `creditStore.deductLocally(cost)` to decrement the displayed balance before the API responds.
- **State change:** `creditStore.balance` decremented by `cost`; generation status set to `'generating'`
- **Rationale:** Optimistic update prevents the user from initiating a second action with the same credits while the async API is in flight.
- **Next:** -> Step 5 (API responds 202) | -> Step 6 (API responds 402 or 5xx)

### Step 5: API Confirmation

- **Screen:** SCR-MAG-02 or SCR-VTON-01 (generation animation continues)
- **Trigger:** API responds 202 with `{ credit_deducted, remaining_credits }`
- **EARS:** When the API responds 202, the system shall reconcile `creditStore.balance` with `remaining_credits` from the response to correct any drift between optimistic state and server state.
- **State change:** `creditStore.balance` set to `response.remaining_credits` (authoritative sync)
- **Data:** Response body includes `credit_deducted: number` and `remaining_credits: number`
- **Next:** -> polling flow (FLW-06 Step 6 for magazine, FLW-05 for VTON) | -> Step 6 on polling failure

### Step 6: Rollback on Failure

- **Screen:** SCR-MAG-02 or SCR-VTON-01
- **Trigger:** API responds 402 (insufficient), 5xx (server error), network timeout, or user cancels during generation
- **EARS:** When the API call fails or the user cancels during generation, the system shall call `creditStore.refund(cost)` to restore the locally deducted balance and display an error toast.
- **State change:** `creditStore.balance` incremented by `cost`; generation status reverts to `'idle'` or `'error'`
- **Error distinctions:**
  - 402: balance was stale — re-fetch balance, show `CreditGate`
  - 5xx / timeout: transient failure — show retry toast; credits refunded
  - User cancel (polling > timeout): credits refunded; backend generation may complete (orphaned task)
- **Next:** -> Step 2 (user may retry) | -> top-up prompt (402 case)

### Step 7: Cross-Screen Balance Sync

- **Screen:** All screens consuming `creditStore`
- **Trigger:** Any action that changes `creditStore.balance` (Steps 1, 5, 6)
- **EARS:** When `creditStore.balance` changes, all mounted components subscribed via `useCreditStore(selectBalance)` shall re-render with the updated value without requiring a page reload.
- **Consumers:** SCR-MAG-02 balance badge, SCR-VTON-01 balance badge, Profile credit display
- **Next:** Flow end; balance remains in store until next feature entry triggers a re-fetch (stale > 60s)

## State Transitions

| From | Event | To | Side Effect |
|------|-------|----|-------------|
| idle | feature page mount (authenticated) | fetching | GET /api/v1/credits/balance |
| fetching | balance received | known | `creditStore.balance` set; `lastFetched` set |
| fetching | network error | error | Show retry; CTA skeleton remains |
| known | balance >= cost | can_afford | CTA enabled |
| known | balance < cost | cannot_afford | CTA disabled; CreditGate rendered |
| can_afford | user confirms action | deducting | `deductLocally(cost)`; API dispatched |
| deducting | API 202 | confirmed | `balance` reconciled with `remaining_credits` |
| deducting | API 402 | rolled_back | `refund(cost)`; re-fetch balance; show CreditGate |
| deducting | API 5xx / timeout | rolled_back | `refund(cost)`; show retry toast |
| deducting | user cancels | rolled_back | `refund(cost)`; status reverts to idle |
| confirmed | generation complete | idle | Balance unchanged; generation flow resumes |
| rolled_back | user retries | deducting | Re-enter deduction cycle |

## Shared Data

| Data | Source | Consumed By |
|------|--------|-------------|
| `creditStore.balance` | GET /api/v1/credits/balance | SCR-MAG-02 badge, SCR-VTON-01 badge, Profile |
| `creditStore.isLoading` | creditStore internal | Skeleton states on feature pages |
| `creditStore.lastFetched` | creditStore internal | Stale-check guard (60s TTL) |
| `remaining_credits` | API 202 response | Step 5 reconciliation |
| `credit_deducted` | API 202 response | Audit / drift detection |
| `creditStore.selectCanAfford(cost)` | derived selector | CTA enabled state, CreditGate visibility |
| `action_type` | per-feature constant | POST /api/v1/credits/deduct (server-side) |

## Error Recovery Table

| Error Point | Trigger | Recovery | Fallback |
|-------------|---------|----------|----------|
| Balance fetch fails | Network error on page mount | Retry toast + manual "Refresh" button | Disable CTA with "Unable to load credits" |
| Balance stale (402 on confirm) | Server balance lower than cached | `refund(cost)` + re-fetch + show CreditGate | Block action; prompt top-up |
| Generation API 5xx | Server error after deduction | `refund(cost)` + retry toast | User retries from Step 3 |
| Generation timeout (>60s MAG / >90s VTON) | Poll deadline exceeded | User prompted: keep waiting or cancel; cancel triggers `refund(cost)` | Orphaned backend task; user is not charged |
| User cancels during generation | Cancel tap while polling | `refund(cost)`; stop polling | Navigate back to feature entry screen |
| Network failure during polling | No response from poll endpoint | Silent auto-retry 3×; then show error + `refund(cost)` | User retries or navigates away |

## Future Capabilities (Planned, Not Scoped)

- **Credit earning via ink tagging:** When a user's solution is adopted (high-quality tagging), the system will award ink credits via a server-side event. `creditStore.fetchBalance()` will reflect the new balance on next feature entry.
- **Credit top-up (purchase):** A purchase flow will allow users to acquire credit bundles. `CreditGate` already renders a top-up CTA placeholder. The flow is outside FLW-07 scope.

---

See: [FLW-06](FLW-06-magazine-rendering.md) -- Magazine rendering (Step 6 consumes creditStore)
See: [FLW-05](FLW-05-vton.md) -- VTON cinematic sequence (Step 4 consumes creditStore)
See: [SCR-MAG-02](../screens/magazine/SCR-MAG-02-personal-issue.md) -- Personal issue generation screen
See: [SCR-VTON-01](../screens/vton/SCR-VTON-01-try-on-studio.md) -- Try-on studio screen
See: [store-map](_shared/../store-map.md) -- creditStore definition
See: [api-contracts](_shared/../api-contracts.md) -- GET /credits/balance, POST /credits/deduct
