---
title: Review Flow — Harness Knowledge
owner: llm
status: draft
updated: 2026-04-23
tags: [harness, agent, testing]
related:
  - CLAUDE.md
  - docs/wiki/wiki/harness/commit-protocol.md
  - docs/GIT-WORKFLOW.md
---

# Review Flow — Harness Knowledge

작성(write) 레인과 검토(review/verify) 레인을 **같은 세션에서 겸하지 않는다**. self-approve는 금지.

## 두 개의 레인

| Lane    | 역할                                   | 담당                                                   |
| ------- | -------------------------------------- | ------------------------------------------------------ |
| Write   | 구현, 편집, 생성 (feat/fix/refactor)   | executor / designer / writer / human                   |
| Review  | 정합성·품질·보안 평가, evidence 수집   | code-reviewer / verifier / critic / security-reviewer  |

- Write 세션이 방금 만든 diff를 **같은 활성 컨텍스트**에서 자기 승인하지 않는다.
- Review 레인은 항상 별도 세션/서브에이전트/사람이 돌린다. 결과는 PR 코멘트·체크리스트로 축적.

## PR 생성 전 self-check

실행자 본인이 수행 — 이건 review가 아니라 "완료 선언 전 최소 증거 수집":

1. `cargo fmt --check`, `bun run lint`, `just ci-web`, `cargo check` 등 로컬 체크 통과 확인.
2. 타겟 기능을 **실제로 구동**하여 기대 동작을 확인 (UI면 dev server, API면 curl / `just api-smoke`).
3. 테스트가 관련되어 있으면 해당 테스트만이라도 돌려 pass 확인.
4. PR 본문에 "검증 방법" 섹션 — reviewer가 같은 절차로 재현할 수 있어야 한다.

통과하지 않은 상태로 PR을 열지 않는다. Draft PR이면 예외이지만 Draft 해제 전에는 반드시 통과.

## Reviewer 역할

- **code-reviewer**: SOLID, 스타일, 로직 결함, 회귀 위험 지적. severity-rated.
- **verifier**: 요구사항 vs 구현 대조. "완료 주장"에 대한 evidence 확보.
- **security-reviewer**: OWASP / secrets / unsafe patterns 스캔.
- **critic**: 계획·접근 자체를 여러 관점에서 재검토.

OMC 사용 시 리뷰는 `code-reviewer` 또는 `verifier` 서브에이전트에게 위임한다. 리뷰 결과는 main 세션의 최종 approval을 대체하지 않는다 — 사람 eyes-on은 merge 전 필수.

## Merge 규칙

- `dev` ← `feature/*`: review 1명 이상 승인 + CI green + 셀프 체크 완료.
- `main` ← `dev`: 릴리스 기준 체크리스트(`/ship` 또는 `/land-and-deploy`). hotfix 예외는 `docs/GIT-WORKFLOW.md` 참조.
- Force merge, admin override는 사용하지 않는다. 실패한 체크가 있으면 수정 후 재실행.

## Evidence & audit trail

- PR 설명에 다음을 남긴다:
  - **What**: 변경 요약 (bullet 3~5개)
  - **Why**: 연결된 이슈/링크, 의사결정 컨텍스트
  - **How verified**: 명령, 화면, 로그, 테스트 이름
  - **Risk**: rollback 방법, feature flag / kill switch
- 승인 코멘트도 evidence에 포함: "CI green / manual smoke: X·Y·Z pass".

## Anti-patterns

- 같은 세션에서 구현 → 자기 PR 코멘트로 approve → merge. (self-approve 금지)
- "테스트는 있는데 검증은 안 돌려봤다"는 완료 주장. (pass ≠ 검증)
- 리뷰 코멘트를 "agreed" 한 줄로 닫고 수정 없이 merge. (agree-but-ignore)
- Review 레인이 Write 레인의 실패를 숨기기 위한 형식상 승인. (performative review)

## Recent changes

- 2026-04-23: 초기 작성 (Phase 1 Finding 2 follow-up, #232)
