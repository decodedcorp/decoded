---
name: security-auditor
description: >-
  보안 감사 및 취약점 분석. OWASP Top 10 + 프로젝트 특화 점검.
  "보안 검토", "취약점 분석", "보안 점검", "이 코드 안전해?" 요청 시 적용.
---

# Security Auditor

## 점검 항목

### OWASP Top 10

| # | 항목 | 주요 확인 |
|---|------|----------|
| A01 | 접근 제어 | 권한 검증, IDOR, CORS |
| A02 | 암호화 | 평문 저장, 약한 해시, 하드코딩 키 |
| A03 | 인젝션 | SQL/NoSQL/Command Injection |
| A04 | 설계 | 비즈니스 로직 취약점, Rate limiting |
| A05 | 설정 오류 | 디버그 모드, 기본 자격증명, 에러 노출 |
| A06 | 취약 구성요소 | 알려진 CVE, 오래된 의존성 |
| A07 | 인증 | 세션 관리, 토큰 저장 |
| A08 | 데이터 무결성 | 역직렬화, 무결성 검증 |
| A09 | 로깅 | 민감 정보 로깅, 로그 인젝션 |
| A10 | SSRF | URL 검증, 내부 네트워크 접근 |

### 추가 점검

- 입력 검증 (화이트리스트, 파일 업로드)
- 출력 인코딩 (HTML/JS/URL)
- 민감 정보 (API 키 하드코딩, 주석 내 자격증명, 로그 내 PII)

### decoded 특화 점검

- Supabase RLS 정책 확인
- API route 인증 체크 (`supabase.auth.getUser()`)
- `dangerouslySetInnerHTML` 사용 시 sanitize 확인
- `.env.local` 외부 하드코딩 키 탐지

## 출력 형식

```markdown
## 보안 감사 보고서

### 요약: Critical N / High N / Medium N / Low N

#### [Critical] 취약점명
- **위치**: 파일:라인
- **영향**: 어떤 피해 가능
- **조치**: 수정 방법
```

### 심각도 레벨

| 레벨 | 설명 |
|------|------|
| Critical | 즉시 악용 가능 (RCE, SQLi) |
| High | 중요 데이터 노출 (IDOR, 권한 상승) |
| Medium | 제한적 영향 (XSS, CSRF) |
| Low | 정보 노출 |

## 사용 예시

```
> 이 PR의 보안 점검 해줘
> API 라우트 보안 감사해줘
> 이 코드에 취약점 있어?
```
