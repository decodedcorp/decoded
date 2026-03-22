# Chapter 1: 사용자 시스템 (User System)

## 개요

사용자 인증, 프로필 관리, 활동 내역, 수익 관리 등 사용자 계정과 관련된 모든 화면을 다룹니다.

## 화면 목록

| ID | 화면명 | 경로 | 상태 | 기능 ID |
|:---|:---|:---|:---:|:---|
| [SCR-USER-01](./SCR-USER-01-login.md) | 로그인 | `/login` | Draft | U-01 |
| [SCR-USER-02](./SCR-USER-02-profile.md) | 프로필 대시보드 | `/profile` | Draft | U-03 |
| [SCR-USER-03](./SCR-USER-03-activity.md) | 활동 내역 | `/profile/activity` | Draft | U-04 |
| [SCR-USER-04](./SCR-USER-04-earnings.md) | 수익/출금 | `/profile/earnings` | Draft | U-05 |
| [SCR-USER-05](./SCR-USER-05-settings.md) | 설정 | `/profile/settings` | Draft | U-02 |

## 화면 흐름도

```
                    ┌─────────────────┐
                    │  비로그인 상태   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  SCR-USER-01    │
                    │  로그인         │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │          로그인 성공         │
              │                             │
              ▼                             ▼
     ┌─────────────────┐           ┌─────────────────┐
     │  홈 피드        │◄──────────│  SCR-USER-02    │
     │  (DISC-01)      │           │  프로필 대시보드 │
     └─────────────────┘           └────────┬────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
           ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
           │  SCR-USER-03    │     │  SCR-USER-04    │     │  SCR-USER-05    │
           │  활동 내역      │     │  수익/출금      │     │  설정           │
           └─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 인증 요구사항

| 화면 | 인증 필요 | 권한 |
|:---|:---:|:---|
| SCR-USER-01 | No | - |
| SCR-USER-02 | Yes | 로그인 사용자 |
| SCR-USER-03 | Yes | 로그인 사용자 |
| SCR-USER-04 | Yes | 로그인 사용자 + 수익 활성화 |
| SCR-USER-05 | Yes | 로그인 사용자 |

## 관련 기능 명세

- [U-01: 소셜 로그인](../spec.md#u-01-소셜-로그인-social-authentication)
- [U-02: 다국어 지원](../spec.md#u-02-다국어-지원-multi-language)
- [U-03: 프로필 대시보드](../spec.md#u-03-프로필-대시보드-profile-dashboard)
- [U-04: 활동 내역](../spec.md#u-04-활동-내역-activity-history)
- [U-05: 수익 출금](../spec.md#u-05-수익-출금-earnings-withdrawal)
