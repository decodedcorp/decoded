---
name: commit
description: >-
  Stages and commits changes as one logical work unit per commit: analyzes diffs,
  splits mixed work with git add -p or file-level staging, and writes Conventional
  Commit messages. Use when the user invokes /commit, asks for logical commits,
  작업 단위 커밋, split commits, or commit message help before committing.
---

# /commit — 논리적 작업 단위 커밋

## 트리거

- 사용자가 `/commit`, "논리적인 작업 단위로 커밋", "커밋 나누기", "스테이징 정리" 등을 요청할 때 이 스킬을 따른다.

## 원칙

1. **한 커밋 = 하나의 논리적 변경** — 리뷰어가 커밋 메시지만 보고도 "무엇을 왜 바꿨는지" 이해할 수 있어야 한다.
2. **섞인 작업은 분리** — 같은 세션에 만든 변경이라도 목적이 다르면 커밋을 나눈다 (기능 추가 + 포맷팅 + 문서 → 최소 2~3커밋).
3. **프로젝트 관례** — 이 저장소는 [Conventional Commits](https://www.conventionalcommits.org/) 형식을 쓴다: `type(scope): summary` (필요 시 본문).

## 워크플로

### 1. 현재 변경 파악

- `git status`로 추적/미추적 파일 확인.
- `git diff`와 `git diff --staged`로 스테이징 여부에 따라 내용 확인.
- 범위가 크면 `git diff --stat`으로 요약 후 필요한 경로만 상세 diff.

### 2. 논리 단위로 묶기

각 후보 커밋에 대해 다음을 만족하는지 검토한다.

| 질문 | 불만족 시 |
|------|-----------|
| 단일 목적(기능/버그/리팩터/문서/빌드/스타일)인가? | 커밋 분리 |
| 함께 롤백해도 자연스러운가? | 분리 검토 |
| 메시지 한 줄로 요약 가능한가? | 범위 축소 또는 분리 |

**분리 방법**

- 파일 단위: 관련 파일만 `git add path/to/file`.
- 파일 내부: `git add -p` (또는 `git checkout -p`로 스테이징 취소)로 hunks 선택.
- 실수로 섞인 포맷/리네임은 해당 hunks만 따로 스테이징.

### 3. 커밋 메시지

형식:

```text
type(scope): 짧은 요약 (명령형, ~50자 권장)

선택: 본문 — 무엇을/왜 바꿨는지, 브레이킹 체인지나 이슈 번호
```

**type 예시**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`

- `scope`는 패키지·영역이 분명할 때만 (`web`, `api-server`, `auth` 등).
- 요약은 영어로 쓰는 것이 관례면 관례를 따르고, 팀이 한국어만 쓰면 한국어로 통일.

### 4. 실행

- 사용자가 "바로 커밋해줘"가 아니면, **제안 순서**(커밋 1 메시지 → 파일 목록, 커밋 2 …)를 먼저 보여주고 확인 후 `git add` / `git commit` 실행.
- 이미 모든 변경이 한 목적에 맞으면 단일 커밋으로 처리.

## 안티패턴

- 의미 없이 `git add .`만 하고 거대한 diff를 한 커밋에 넣기.
- "WIP" 또는 빈 메시지로 임시 커밋 (요청이 명시적으로 WIP일 때만 예외).
- 포맷터/린트 전체 파일 변경과 기능 변경을 한 커밋에 섞기 — 분리 우선.

## 빠른 체크리스트

- [ ] 스테이징된 변경이 하나의 스토리로 설명되는가?
- [ ] 커밋 메시지의 `type`이 실제 변경과 일치하는가?
- [ ] 다음 커밋에 남겨야 할 파일이 스테이징에 섞이지 않았는가?
