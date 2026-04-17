---
title: Auth 로그인 플로우 안정화 (#44)
owner: human
status: draft
updated: 2026-04-09
tags: [security]
---

# Auth 로그인 플로우 안정화 (#44)

## 목표

로그인/인증 플로우를 안정화하고 보안을 강화하여 유저 기반 기능(프로필, request/solution)의 선행 조건을 완성한다.

## 현재 상태

- Google OAuth + 게스트 로그인 구현됨
- Zustand authStore로 상태 관리
- AuthProvider에서 Supabase 세션 리스너 동기화
- OAuth 콜백: `app/api/auth/callback/route.ts`
- 세션 쿠키: `app/api/auth/session/route.ts`

## 변경 사항

### 1. OAuth 콜백 에러 강화

**파일**: `packages/web/app/api/auth/callback/route.ts`

- 에러 코드별 분기 처리 (access_denied, invalid_request, server_error 등)
- 사용자 친화적 에러 메시지와 함께 `/login?error=<code>` 리다이렉트
- 콜백 에러 로깅 추가

### 2. 세션 만료 처리

**파일**: `packages/web/lib/components/auth/AuthProvider.tsx`

- Supabase `onAuthStateChange`에서 `TOKEN_REFRESHED`, `SIGNED_OUT` 이벤트 처리
- 세션 만료 시 자동 리프레시 시도 → 실패 시 재로그인 유도 UI
- 세션 상태를 authStore에 반영 (`sessionExpired` 플래그)

### 3. 리다이렉트 안정화

**파일**: `packages/web/lib/components/auth/LoginCard.tsx`, `packages/web/lib/stores/authStore.ts`

- 로그인 전 현재 URL을 `sessionStorage`에 저장
- 로그인 성공 후 저장된 URL로 복귀
- 보호 페이지 접근 시 자동 리다이렉트 → 로그인 → 원래 페이지

### 4. 유저 프로필 연동 강화

**파일**: `packages/web/lib/stores/authStore.ts`, `packages/web/lib/components/auth/AuthProvider.tsx`

- users 테이블과 authStore 동기화 안정화
- 온보딩 필요 여부 판단 로직 정리
- 프로필 데이터 캐싱 및 갱신 전략

## QA 기준

- [ ] Google OAuth 로그인 → 정상 세션 생성 확인
- [ ] Google OAuth 로그아웃 → 세션 클리어 확인
- [ ] 잘못된 콜백 코드 → 에러 메시지 표시 확인
- [ ] 세션 만료 시뮬레이션 → 재로그인 유도 확인
- [ ] 미인증 상태에서 `/request` 접근 → 로그인 → `/request` 복귀
- [ ] 온보딩 미완료 유저 → 온보딩 플로우 진입 확인

## QA 도구

- **Chrome MCP** — OAuth 실제 브라우저 테스트 (localhost:3000 고정)

## 브랜치

- `feat/44-auth-stabilization` (dev 기반)
