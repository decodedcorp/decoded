# [SCR-ADMN-02] 콘텐츠 모더레이션 (Content Moderation)

| 항목 | 내용 |
|------|------|
| **문서 ID** | SCR-ADMN-02 |
| **화면명** | 콘텐츠 모더레이션 |
| **경로** | `/admin/content` |
| **작성일** | 2025-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: 사용자 제출 콘텐츠 검토, 승인/거절, 부적절 콘텐츠 플래그, 태그 요청 관리
- **선행 조건**: 관리자 권한 (content_moderator 이상)
- **후속 화면**: 게시물 상세, 사용자 관리
- **관련 기능 ID**: A-01 Tag Management, A-02 Content/Payout Management

---

## 2. UI 와이어프레임

### 2.1 콘텐츠 모더레이션 메인

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ≡  Content Moderation                                        🔔 (3)  [Admin ▼]   │
├──────────────┬──────────────────────────────────────────────────────────────────────┤
│              │                                                                       │
│  📊 Dashboard│  Content Moderation                                                  │
│              │                                                                       │
│  🏷️ Tags     │  ┌────────────────────────────────────────────────────────────────┐ │
│     (sub)    │  │ [Pending (23)] [Published] [Rejected] [Flagged (3)]           │ │
│   • Media    │  │  ━━━━━━━━━━━━━━                                                │ │
│   • Cast     │  └────────────────────────────────────────────────────────────────┘ │
│   • Requests │                                                                       │
│              │  ┌────────────────────────────────────────────────────────────────┐ │
│  📝 Content  │  │ 🔍 Search posts...          [Type ▼] [Date ▼] [User ▼]       │ │
│     (active) │  └────────────────────────────────────────────────────────────────┘ │
│   • Posts    │                                                                       │
│   • Users    │  ┌────────────────────────────────────────────────────────────────┐ │
│              │  │                                                                │ │
│  💰 Payouts  │  │  ┌───────────────────────────────────────────────────────────┐│ │
│              │  │  │ [IMG]  Post #4521                      Jan 8, 2:34 PM     ││ │
│  ⚙️ Settings │  │  │        By: user123 (user123@email.com)                    ││ │
│              │  │  │        Tags: BLACKPINK > Jennie > Airport                 ││ │
│              │  │  │        Items: 3 (Top, Bag, Shoes)                         ││ │
│              │  │  │                                                           ││ │
│              │  │  │        [View Details] [✓ Approve] [✗ Reject] [🚩 Flag]  ││ │
│              │  │  │        [CARD-POST-01]                                     ││ │
│              │  │  └───────────────────────────────────────────────────────────┘│ │
│              │  │                                                                │ │
│              │  │  ┌───────────────────────────────────────────────────────────┐│ │
│              │  │  │ [IMG]  Post #4520                      Jan 8, 2:12 PM     ││ │
│              │  │  │        By: fashionista                                    ││ │
│              │  │  │        Tags: IVE > Wonyoung > Stage                       ││ │
│              │  │  │        Items: 5 (Top, Bottom, Bag, Shoes, Accessory)      ││ │
│              │  │  │                                                           ││ │
│              │  │  │        [View Details] [✓ Approve] [✗ Reject] [🚩 Flag]  ││ │
│              │  │  │        [CARD-POST-02]                                     ││ │
│              │  │  └───────────────────────────────────────────────────────────┘│ │
│              │  │                                                                │ │
│              │  │  ┌───────────────────────────────────────────────────────────┐│ │
│              │  │  │ [IMG]  Post #4519                      Jan 8, 1:45 PM     ││ │
│              │  │  │        By: kpop_fan                                       ││ │
│              │  │  │        Tags: NewJeans > Haerin > Daily                    ││ │
│              │  │  │        Items: 2 (Dress, Bag)                              ││ │
│              │  │  │                                                           ││ │
│              │  │  │        [View Details] [✓ Approve] [✗ Reject] [🚩 Flag]  ││ │
│              │  │  └───────────────────────────────────────────────────────────┘│ │
│              │  │                                                                │ │
│              │  └────────────────────────────────────────────────────────────────┘ │
│              │                                                                       │
│              │  Bulk Actions: [□ Select All]  [✓ Approve Selected] [✗ Reject]     │
│              │                                                                       │
│              │  Showing 1-20 of 23          [1] [2] [>]    [PAGINATION]             │
│              │                                                                       │
└──────────────┴──────────────────────────────────────────────────────────────────────┘
```

### 2.2 게시물 상세 모달

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Post #4521 - Review                                                  [✕]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────┐  Submitted: Jan 8, 2026, 2:34 PM     │
│  │                                  │  User: user123                        │
│  │                                  │  Email: user123@email.com             │
│  │      [Main Image with Spots]     │  Account Age: 3 months                │
│  │                                  │  Previous Posts: 47 (45 approved)     │
│  │          ●① Top                  │                                       │
│  │                                  │  ───────────────────────────────────  │
│  │              ●② Bag              │                                       │
│  │                                  │  Tags                                 │
│  │         ●③ Shoes                 │  Media: BLACKPINK (K-POP Group)       │
│  │                                  │  Cast: Jennie                         │
│  │                                  │  Context: Airport                     │
│  └──────────────────────────────────┘                                       │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Detected Items (3)                                                         │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ ①  Top                                                                 ││
│  │    ┌────────┐                                                          ││
│  │    │ [crop] │  Original: Celine Triomphe Jacket                       ││
│  │    └────────┘  Price: ₩2,850,000                                      ││
│  │               URL: celine.com/... ✓                                   ││
│  │                                                                        ││
│  │               Vibe: Zara Structured Blazer                            ││
│  │               Price: ₩139,000                                         ││
│  │               URL: zara.com/... ✓                                     ││
│  │                                                    [Edit] [Remove]     ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ ②  Bag                                                                 ││
│  │    ┌────────┐                                                          ││
│  │    │ [crop] │  Original: Not added                                    ││
│  │    └────────┘  Vibe: Not added                                        ││
│  │                                                    [Add Product]       ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ ③  Shoes                                                               ││
│  │    ┌────────┐                                                          ││
│  │    │ [crop] │  Original: Nike Air Force 1                             ││
│  │    └────────┘  Price: ₩139,000                                        ││
│  │               URL: nike.com/... ✓                                     ││
│  │                                                    [Edit] [Remove]     ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Moderation Notes (optional)                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ Add internal notes...                                                  ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                                                                        ││
│  │  [🚩 Flag for Review]   [✗ Reject]   [✓ Approve & Publish]          ││
│  │                                                                        ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 태그 관리 (서브메뉴)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Tag Management                                                    [+ Add New]     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  [Media] [Cast] [Pending Requests (5)]                                              │
│   ━━━━━━                                                                            │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │ 🔍 Search tags...                              Type: [All ▼]  Sort: [A-Z ▼]   │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                │ │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ 🎵 BLACKPINK                                                 [MEDIA-01] │ │ │
│  │  │    블랙핑크                                                             │ │ │
│  │  │    Category: K-POP • Type: Group                                        │ │ │
│  │  │    Cast: Jisoo, Jennie, Rosé, Lisa                                     │ │ │
│  │  │    Posts: 1,234 • Items: 3,456 • Created: Jan 2024                     │ │ │
│  │  │                                                                          │ │ │
│  │  │    [Edit] [View Posts] [Manage Cast] [Archive]                         │ │ │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                │ │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ 🎬 Squid Game                                                [MEDIA-02] │ │ │
│  │  │    오징어 게임                                                          │ │ │
│  │  │    Category: K-Drama • Type: Drama                                      │ │ │
│  │  │    Cast: Lee Jung-jae, Jung Ho-yeon, +12 more                          │ │ │
│  │  │    Posts: 567 • Items: 1,890 • Created: Sep 2021                       │ │ │
│  │  │                                                                          │ │ │
│  │  │    [Edit] [View Posts] [Manage Cast] [Archive]                         │ │ │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  Showing 1-20 of 289                                    [1] [2] [3] ... [15]       │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 태그 요청 검토

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Tag Management > Pending Requests (5)                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  [Media] [Cast] [Pending Requests (5)]                                              │
│                  ━━━━━━━━━━━━━━━━━━━━━                                              │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                │ │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ Request #127                                         Jan 8, 2026, 10:23 AM│ │ │
│  │  │                                                                          │ │ │
│  │  │ Type: Cast                                                               │ │ │
│  │  │ Name (EN): Kim Chaewon                                                   │ │ │
│  │  │ Name (KO): 김채원                                                        │ │ │
│  │  │ Related Media: LE SSERAFIM                                              │ │ │
│  │  │                                                                          │ │ │
│  │  │ Submitted by: user@example.com                                          │ │ │
│  │  │ Reason: "Member of LE SSERAFIM, was leader of IZ*ONE"                  │ │ │
│  │  │                                                                          │ │ │
│  │  │ Similar existing: Kim Chaewon (IZ*ONE) ← possible duplicate?           │ │ │
│  │  │                                                                          │ │ │
│  │  │ [✓ Approve] [✗ Reject] [✏️ Edit & Approve] [🔗 Merge with Existing]  │ │ │
│  │  │ [REQ-01]                                                                 │ │ │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                │ │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ Request #126                                         Jan 7, 2026, 4:56 PM│ │ │
│  │  │                                                                          │ │ │
│  │  │ Type: Media                                                              │ │ │
│  │  │ Name (EN): Lovely Runner                                                 │ │ │
│  │  │ Name (KO): 선재 업고 튀어                                               │ │ │
│  │  │ Media Type: Drama                                                        │ │ │
│  │  │                                                                          │ │ │
│  │  │ Submitted by: another@example.com                                       │ │ │
│  │  │ Reason: "Popular 2024 K-Drama"                                          │ │ │
│  │  │                                                                          │ │ │
│  │  │ No similar tags found                                                    │ │ │
│  │  │                                                                          │ │ │
│  │  │ [✓ Approve] [✗ Reject] [✏️ Edit & Approve]                            │ │ │
│  │  │ [REQ-02]                                                                 │ │ │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.5 거절 사유 모달

```
┌─────────────────────────────────────────────────────────────────┐
│  Reject Post #4521                                        [✕]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Please select a reason for rejection:                         │
│                                                                 │
│  [○] Inappropriate content                                     │
│  [○] Low quality image                                         │
│  [○] Incorrect tags                                            │
│  [○] Duplicate content                                         │
│  [○] Copyright violation                                       │
│  [●] Other (specify below)                                     │
│                                                                 │
│  Additional notes:                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ The product links are invalid...                         │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ ] Notify user via email                                     │
│  [ ] Ban user (serious violation)                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Cancel]                             [Reject Post]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. UI 요소 정의

### 3.1 탭/필터 영역

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| TAB-PENDING | 탭 | 대기 중 | Badge: 대기 수 | 상태 필터 적용 |
| TAB-PUBLISHED | 탭 | 게시됨 | - | 상태 필터 적용 |
| TAB-REJECTED | 탭 | 거절됨 | - | 상태 필터 적용 |
| TAB-FLAGGED | 탭 | 플래그 | Badge: 플래그 수 | 상태 필터 적용 |
| INP-SEARCH | 입력 | 검색 | placeholder: "Search posts..." | 포스트 ID, 사용자명 검색 |
| SEL-TYPE | 선택 | 타입 필터 | All, Image, Video | 콘텐츠 타입 필터 |
| SEL-DATE | 선택 | 날짜 필터 | Today, 7 days, 30 days, Custom | 기간 필터 |
| SEL-USER | 선택 | 사용자 필터 | 자동완성 | 특정 사용자 필터 |

### 3.2 포스트 카드

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| CARD-POST-n | 카드 | 포스트 카드 | 썸네일 + 메타데이터 | 클릭 시 상세 모달 |
| IMG-THUMB | 이미지 | 썸네일 | 80x80px, object-cover | - |
| TXT-POST-ID | 텍스트 | 포스트 ID | "Post #4521" | 클릭 시 상세 |
| TXT-USER | 텍스트 | 사용자 | 사용자명 (이메일) | 클릭 시 사용자 상세 |
| TXT-TAGS | 텍스트 | 태그 경로 | Media > Cast > Context | - |
| TXT-ITEMS | 텍스트 | 아이템 수 | "Items: 3 (Top, Bag, Shoes)" | - |
| TXT-TIME | 텍스트 | 제출 시간 | 상대 시간 또는 절대 | - |
| BTN-VIEW | 버튼 | 상세 보기 | variant: ghost | 상세 모달 열기 |
| BTN-APPROVE | 버튼 | 승인 | variant: success, Icon: Check | 승인 처리 |
| BTN-REJECT | 버튼 | 거절 | variant: destructive, Icon: X | 거절 모달 열기 |
| BTN-FLAG | 버튼 | 플래그 | variant: warning, Icon: Flag | 플래그 처리 |
| CHK-SELECT | 체크박스 | 선택 | - | 대량 처리용 선택 |

### 3.3 상세 모달

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| MODAL-DETAIL | 모달 | 상세 모달 | max-width: 800px | - |
| IMG-MAIN | 이미지 | 메인 이미지 | 스팟 마커 오버레이 | 스팟 클릭 시 아이템 포커스 |
| SECTION-USER | 섹션 | 사용자 정보 | 가입일, 이전 포스트 통계 | 위험 신호 표시 |
| SECTION-TAGS | 섹션 | 태그 정보 | Media, Cast, Context | 수정 가능 |
| SECTION-ITEMS | 섹션 | 아이템 목록 | 각 아이템별 상세 | 개별 수정/삭제 |
| INP-NOTES | 입력 | 내부 메모 | 관리자 전용 | 감사 로그 기록 |

### 3.4 태그 관리

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| TAB-MEDIA | 탭 | 미디어 탭 | Media 태그 목록 | - |
| TAB-CAST | 탭 | 캐스트 탭 | Cast 태그 목록 | - |
| TAB-REQUESTS | 탭 | 요청 탭 | Badge: 대기 수 | 요청 검토 |
| MEDIA-n | 카드 | 미디어 카드 | 이름, 타입, 통계 | - |
| BTN-EDIT-TAG | 버튼 | 수정 | variant: ghost | 수정 모달 |
| BTN-VIEW-POSTS | 버튼 | 포스트 보기 | variant: ghost | 해당 태그 포스트 필터 |
| BTN-MANAGE-CAST | 버튼 | 캐스트 관리 | variant: ghost | 연결된 캐스트 관리 |
| BTN-ARCHIVE | 버튼 | 보관 | variant: ghost, color: warning | 소프트 삭제 |

### 3.5 태그 요청

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| REQ-n | 카드 | 요청 카드 | 요청 정보 + 유사 태그 | - |
| TXT-SIMILAR | 텍스트 | 유사 태그 | 중복 가능성 경고 | - |
| BTN-APPROVE-REQ | 버튼 | 승인 | variant: success | 태그 생성 |
| BTN-REJECT-REQ | 버튼 | 거절 | variant: destructive | 요청 거절 |
| BTN-EDIT-APPROVE | 버튼 | 수정 후 승인 | variant: outline | 수정 모달 후 승인 |
| BTN-MERGE | 버튼 | 병합 | variant: outline | 기존 태그와 병합 |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|------|------|--------|
| 로딩 | 데이터 패칭 중 | 스켈레톤 카드 표시 |
| 빈 목록 | 해당 상태 포스트 0개 | 빈 상태 메시지 |
| 선택 중 | 1개 이상 체크 | 대량 처리 버튼 활성화 |
| 처리 중 | 승인/거절 API 호출 | 버튼 로딩 + 비활성화 |
| 완료 | 처리 성공 | 토스트 + 목록에서 제거 |

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 |
|-----|--------|----------|----------|
| 포스트 목록 | GET | `/api/admin/posts?status={status}&page={page}` | 페이지 로드, 필터 변경 |
| 포스트 상세 | GET | `/api/admin/posts/{id}` | 상세 모달 열기 |
| 포스트 승인 | PUT | `/api/admin/posts/{id}/status` | 승인 버튼 클릭 |
| 포스트 거절 | PUT | `/api/admin/posts/{id}/status` | 거절 확인 |
| 포스트 플래그 | POST | `/api/admin/posts/{id}/flag` | 플래그 버튼 클릭 |
| 대량 처리 | POST | `/api/admin/posts/bulk` | 선택 후 대량 처리 |
| 태그 목록 | GET | `/api/admin/tags?type={type}&page={page}` | 태그 탭 |
| 태그 생성 | POST | `/api/admin/tags/{type}` | 태그 추가 |
| 태그 수정 | PUT | `/api/admin/tags/{type}/{id}` | 태그 수정 |
| 태그 보관 | DELETE | `/api/admin/tags/{type}/{id}` | 보관 처리 |
| 태그 요청 목록 | GET | `/api/admin/tags/requests` | 요청 탭 |
| 태그 요청 승인 | POST | `/api/admin/tags/requests/{id}/approve` | 승인 |
| 태그 요청 거절 | POST | `/api/admin/tags/requests/{id}/reject` | 거절 |

### 5.2 요청/응답 스키마

```typescript
// 포스트 상태 변경
interface UpdatePostStatusRequest {
  status: 'published' | 'rejected';
  reason?: string;      // 거절 시 필수
  notifyUser?: boolean;
  banUser?: boolean;    // 심각한 위반 시
}

// 대량 처리
interface BulkPostActionRequest {
  postIds: string[];
  action: 'approve' | 'reject';
  reason?: string;
}

// 태그 요청 승인
interface ApproveTagRequest {
  edits?: {
    name?: string;
    nameKo?: string;
    mediaType?: string;
    relatedMediaId?: string;
  };
  mergeWithId?: string;  // 기존 태그와 병합
}
```

---

## 6. 에러 처리

| 에러 상황 | 사용자 메시지 | 처리 방법 |
|----------|-------------|----------|
| 동시 수정 충돌 | "This post was already processed by another admin." | 새로고침 안내 |
| 권한 없음 | "You don't have permission for this action." | 에러 토스트 |
| 태그 중복 | "A tag with this name already exists." | 병합 옵션 제안 |
| 처리 실패 | "Failed to process. Please try again." | 재시도 버튼 |

---

## 7. 접근성 (A11y)

### 7.1 키보드 네비게이션
- `Tab`: 탭 → 검색 → 카드들 → 페이지네이션
- `Enter`: 카드에서 상세 모달 열기
- `Escape`: 모달 닫기
- `Space`: 체크박스 토글

### 7.2 스크린 리더
- 포스트 카드: `aria-label="Post 4521 by user123, pending review, 3 items"`
- 승인/거절 버튼: `aria-label="Approve post 4521"` / `aria-label="Reject post 4521"`
- 상태 탭: `role="tablist"`, 각 탭 `role="tab"`, `aria-selected`

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|--------|---------|----------|
| 페이지 | AdminContentPage | `app/admin/content/page.tsx` |
| 포스트 목록 | PostModerationList | `lib/components/admin/PostModerationList.tsx` |
| 포스트 카드 | PostModerationCard | `lib/components/admin/PostModerationCard.tsx` |
| 상세 모달 | PostDetailModal | `lib/components/admin/PostDetailModal.tsx` |
| 거절 모달 | RejectReasonModal | `lib/components/admin/RejectReasonModal.tsx` |
| 태그 목록 | TagTable | `lib/components/admin/TagTable.tsx` |
| 태그 폼 | TagForm | `lib/components/admin/TagForm.tsx` |
| 태그 요청 | TagRequestList | `lib/components/admin/TagRequestList.tsx` |
| 태그 요청 카드 | TagRequestCard | `lib/components/admin/TagRequestCard.tsx` |

---

## 9. 구현 체크리스트

- [ ] 콘텐츠 모더레이션 메인 페이지
- [ ] 상태별 탭 필터링 (Pending/Published/Rejected/Flagged)
- [ ] 검색 및 고급 필터
- [ ] PostModerationCard (썸네일 + 메타)
- [ ] PostDetailModal (상세 정보 + 아이템)
- [ ] 승인/거절/플래그 기능
- [ ] 거절 사유 선택 모달
- [ ] 대량 처리 기능
- [ ] 태그 관리 (CRUD)
- [ ] 태그 요청 검토 (승인/거절/병합)
- [ ] 중복 태그 감지
- [ ] 감사 로그 기록
- [ ] 페이지네이션
- [ ] 접근성 테스트

---

## 10. 참고 사항

### 10.1 거절 사유 프리셋
```typescript
const REJECTION_REASONS = [
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'low_quality', label: 'Low quality image' },
  { id: 'incorrect_tags', label: 'Incorrect tags' },
  { id: 'duplicate', label: 'Duplicate content' },
  { id: 'copyright', label: 'Copyright violation' },
  { id: 'spam', label: 'Spam or promotional content' },
  { id: 'other', label: 'Other (specify below)' },
];
```

### 10.2 사용자 위험 신호
```typescript
// 사용자 프로필에서 위험 신호 표시
const riskIndicators = {
  newAccount: accountAge < 7,        // 7일 미만 계정
  highRejectionRate: rejectedPosts / totalPosts > 0.3,
  flaggedBefore: previousFlags > 0,
  rapidPosting: postsToday > 10,     // 하루 10개 이상
};
```

### 10.3 미디어 타입
```typescript
type MediaType = 'group' | 'drama' | 'movie' | 'variety' | 'show';
type MediaCategory = 'K-POP' | 'K-Drama' | 'K-Movie' | 'K-Variety' | 'Other';
```
