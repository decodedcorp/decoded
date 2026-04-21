---
title: Staging — Agent Reference
owner: human
status: placeholder
updated: 2026-04-21
tags: [agent, harness, env]
---

# Staging

**현재 staging 환경은 정의되어 있지 않습니다.**

- 로컬 개발 (`dev`) → Supabase CLI self-hosted ([`environments.md`](environments.md))
- 프로덕션 (`prod`) → Cloud Supabase
- **스테이징 (`staging`) → 없음**

## Agent 가이드

staging 관련 질문을 받으면:

1. "staging 은 현재 없음" 을 명시하고
2. 용도에 따라 **dev 또는 prod** 로 안내
3. staging 이 **반드시 필요한 기능** (prod 사전 검증, 외부 통합 테스트 등) 이 나오면 이 문서와 [`environments.md`](environments.md) 의 matrix staging 열을 **먼저 채우도록** 제안

## 언제 staging 을 정의해야 하는가

아래 중 하나라도 해당되면 staging 정의 필요:

- prod 데이터 구조 변경 전 실물 검증이 필요
- 외부 파트너와 통합 테스트 (예: Rakuten 실 API, 결제 연동)
- 부하 / 성능 테스트 환경 분리
- 수동 QA 가 로컬에서 재현 불가 (DNS / 인증 / 외부 callback 등)

## 정의 시 업데이트할 곳

1. 이 문서 — "현재 없음" 문구 제거하고 실제 구성 설명
2. [`environments.md`](environments.md) 의 staging 열 전부 채우기
3. [`docs/DATABASE-MIGRATIONS.md`](../DATABASE-MIGRATIONS.md) — staging 마이그레이션 워크플로우 섹션 추가
4. `.env.backend.example` — staging 용 섹션 또는 별도 템플릿
5. 배포 플랫폼 (Vercel/Fly 등) staging 환경 구성
