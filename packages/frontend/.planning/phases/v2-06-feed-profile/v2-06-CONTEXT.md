# Phase v2-06: Feed & Profile Pages - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply decoded.pen design to Feed page (content streams) and Profile page (user profiles) while maintaining all existing functionality. This phase focuses on visual design updates only - no new features or capabilities.

</domain>

<decisions>
## Implementation Decisions

### Feed Layout & Density
- **Grid**: 반응형 2-3열 (md: 2열, lg: 3열)
- **Card Height**: 이미지 원본 비율 유지 (가변 높이)
- **Loading**: 무한 스크롤 시 스켈레톤 카드 표시
- **Card Info**: decoded.pen 그대로 적용
  - 상단: 소스 배지 (Instagram/TikTok gradient) + 아이템 개수 배지
  - 하단: 계정명 (Inter 16px/600) + 시간 (Inter 12px, muted)
- **Desktop**: "Latest Feed" 타이틀 (Playfair Display 36px), padding 48px 64px
- **Mobile**: 풀 너비 카드, 세로 스크롤

### Profile Header & Stats
- **Desktop Layout**: 2컬럼 구조
  - 좌측 320px: Profile Card (avatar, name, email, Edit Profile) + Stats Row
  - 우측: Activity 콘텐츠 (Badges, 탭 콘텐츠)
- **Stats Items**: Posts, Solutions, Points (Items → Solutions로 변경하여 기여도 강조)
- **Mobile Header**: 뒤로 버튼 (arrow-left) + "Profile" 타이틀 + 설정 버튼 (settings)
- **Badge Section**: decoded.pen 그대로 표시
  - 획득/전체 카운트 (4/12 형식)
  - 획득 배지: 컬러 원형 아이콘
  - 미획득 배지: secondary 배경 + lock 아이콘 + muted stroke

### Activity Tabs Behavior
- **Tab Items**: Posts, Spots, Solutions, Saved (4개 탭 유지)
- **Tab Animation**: fade 트랜지션 (AnimatePresence mode='wait', 0.2s)
- **Empty State**: 아이콘 + 메시지 + CTA 버튼
  - Posts: "아직 게시물이 없습니다" + "첫 게시물 작성하기"
  - Solutions: "아직 솔루션이 없습니다" + "솔루션 제안하기"
- **Loading**: 탭별 콘텐츠에 맞는 스켈레톤 그리드 표시

### Engagement Actions Styling
- **Button Position**: 카드 내부 오버레이 하단에 배치
- **Like Animation**: scale up (1.2x) + primary 색상 전환
- **Count Display**: 아이콘 옆에 숫자 (Heart 12 / Comment 3 형식)
- **Share Behavior**: 네이티브 Share API 사용
  - 모바일: OS 공유 시트 (navigator.share)
  - 데스크톱: URL 클립보드 복사 + 토스트 알림

### Claude's Discretion
- 정확한 스켈레톤 애니메이션 타이밍
- 그리드 카드 간격 세부 조정
- 탭 underline indicator 스타일
- 에러 상태 UI 처리

</decisions>

<specifics>
## Specific Ideas

- Feed 카드 그라데이션 오버레이: 하단 60%부터 시작, #000000 → #000000AA
- 소스 배지 스타일:
  - Instagram: linear-gradient 45deg (#F58529 → #DD2A7B → #8134AF)
  - TikTok: solid black (#000000)
  - 기타: decoded.pen 참조
- Profile 아바타 크기: 모바일 80px, 데스크톱 120px
- Stats Card: cornerRadius --radius-xl, padding 16px(mobile)/20px(desktop)
- Edit Profile 버튼: secondary 배경, radius-full

</specifics>

<deferred>
## Deferred Ideas

없음 — 논의가 페이즈 범위 내에서 진행됨

</deferred>

---

*Phase: v2-06-feed-profile*
*Context gathered: 2026-01-29*
