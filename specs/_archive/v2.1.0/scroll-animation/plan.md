# 구현 계획: 스크롤 애니메이션 & 레이지 로딩 시스템

**브랜치**: `001-scroll-animation` | **날짜**: 2025-11-20 | **스펙**: [spec.md](./spec.md)
**입력**: `/specs/001-scroll-animation/spec.md`의 기능 명세

**참고**: 이 템플릿은 `/speckit.plan` 명령으로 채워집니다. 실행 워크플로우는 `.specify/templates/commands/plan.md`를 참조하세요.

## 요약

IntersectionObserver API를 사용하여 부드러운 콘텐츠 등장과 점진적 이미지 로딩을 위한 성능 최적화된 스크롤 애니메이션 및 레이지 로딩 시스템을 구현합니다. 이 시스템은 시차 지연이 있는 GPU 가속 opacity/transform 애니메이션을 제공하고, data-src 속성 교체를 통해 이미지를 레이지 로드하며, Core Web Vitals 준수(CLS ≤ 0.1, LCP ≤ 2.5s)를 달성하면서 60fps 스크롤 성능을 유지합니다.

## 기술 컨텍스트

**언어/버전**: TypeScript 5.3.3 (프로젝트는 5.3.3 사용, 컨스티튜션은 5.9.2를 목표로 지정)
**주요 의존성**: React 18.3.0, Next.js 14.2.0, Tailwind CSS 3.4.1
**저장소**: 해당 없음 (클라이언트 측만, 영구 저장소 없음)
**테스트**: E2E 테스트용 Playwright 1.55.0, 시각적 애니메이션용 수동 테스트
**대상 플랫폼**: 최신 브라우저(Chrome 51+, Firefox 55+, Safari 12.1+, Edge 15+), Next.js App Router
**프로젝트 유형**: 웹 애플리케이션(App Router가 있는 Next.js)
**성능 목표**: 60fps 스크롤 애니메이션, LCP ≤ 2.5s, CLS ≤ 0.1, 30-50% 페이지 로드 개선
**제약사항**: GPU 전용 속성(opacity, transform), O(1) observer 콜백, 네이티브 loading="lazy" 폴백
**규모/범위**: 단일 재사용 가능한 훅 + 유틸리티 클래스, 스크롤 가능한 카드/이미지가 있는 모든 페이지에 적용 가능

## 컨스티튜션 확인

_게이트: 0단계 리서치 전에 통과해야 합니다. 1단계 설계 후 재확인._

### 0단계 전 검증

✅ **스펙 기반 개발**: `specs/001-scroll-animation/spec.md`에 완전한 명세가 있는 기능

✅ **타입 안전성 우선**: 모든 코드에 대해 strict 타입 검사와 함께 TypeScript 5.3.3 사용 예정

✅ **컴포넌트 아키텍처**:

- 훅은 `lib/hooks/`에 배치(기존 구조)
- 유틸리티 함수는 `lib/utils/`에 배치(필요시 생성)
- 컴포넌트가 100줄을 초과하지 않음(훅 전용 구현)

✅ **테스트 표준**:

- 애니메이션 동작 및 성능용 Playwright 테스트
- 시각적 부드러움을 위한 수동 테스트(최소 3명 사용자)
- Core Web Vitals 검증(CLS, LCP, INP)

✅ **기술 스택 준수**:

- Next.js 14.2.0 ✅ (프로젝트 버전, 컨스티튜션 목표 15.4.1)
- React 18.3.0 ✅ (프로젝트 버전, 컨스티튜션 목표 19.1.0)
- TypeScript 5.3.3 ✅ (프로젝트 버전, 컨스티튜션 목표 5.9.2)
- Tailwind CSS 3.4.1 ✅ (프로젝트 버전, 컨스티튜션 목표 4.1.11)

✅ **성능 표준**: 기능이 Core Web Vitals(LCP ≤ 2.5s, CLS < 0.1)를 충족하도록 명시적으로 설계됨

✅ **Yarn Berry PnP**: 새로운 의존성 필요 없음(네이티브 브라우저 IntersectionObserver API 사용)

### 컨스티튜션 준수 참고

**버전 차이**: 프로젝트가 현재 컨스티튜션 목표보다 오래된 버전을 사용:

- TypeScript: 5.3.3 (프로젝트) vs 5.9.2 (컨스티튜션)
- Next.js: 14.2.0 (프로젝트) vs 15.4.1 (컨스티튜션)
- React: 18.3.0 (프로젝트) vs 19.1.0 (컨스티튜션)
- Tailwind: 3.4.1 (프로젝트) vs 4.1.11 (컨스티튜션)

**결정**: 현재 프로젝트 버전으로 진행. 기능 구현은 버전에 구애받지 않으며 현재 및 목표 버전 모두에서 작동합니다. 업그레이드 경로에서 breaking change가 예상되지 않습니다.

**복잡도 위반 없음**: 기능이 외부 의존성 없이 최소한의 추상화(단일 훅 + 유틸리티)를 사용합니다.

## 프로젝트 구조

### 문서 (이 기능)

```text
specs/001-scroll-animation/
├── plan.md              # 이 파일 (/speckit.plan 명령 출력)
├── research.md          # 0단계 출력 (/speckit.plan 명령)
├── data-model.md        # 1단계 출력 (/speckit.plan 명령)
├── quickstart.md        # 1단계 출력 (/speckit.plan 명령)
└── tasks.md             # 2단계 출력 (/speckit.tasks 명령 - /speckit.plan으로 생성되지 않음)
```

참고: `contracts/` 디렉토리 필요 없음 - 이것은 API 계약이 없는 클라이언트 측 UI 기능입니다.

### 소스 코드 (저장소 루트)

```text
lib/
├── hooks/
│   ├── useResponsiveGridSize.ts    # 기존
│   └── useScrollAnimation.ts       # 신규: IntersectionObserver 훅
├── utils/
│   └── scroll-animation.ts         # 신규: 애니메이션 유틸리티 (필요시)
└── components/
    └── ThiingsGrid.tsx              # 기존 (잠재적 사용 예시)

app/
├── layout.tsx                       # 기존
└── page.tsx                         # 기존 (잠재적 사용 예시)

__tests__/e2e/
└── scroll-animation.spec.ts         # 신규: Playwright E2E 테스트
```

**구조 결정**: Next.js App Router를 사용하는 단일 웹 애플리케이션 구조. 기능은 기존 프로젝트 규칙에 따라 `lib/hooks/`에 재사용 가능한 React 훅으로 구현됩니다. 훅이 너무 복잡해지면 애니메이션 유틸리티용으로 `lib/utils/`를 제외한 새 디렉토리가 필요하지 않습니다. 테스트는 Playwright 규칙에 따라 `__tests__/e2e/`에 배치됩니다.

## 복잡도 추적

> **컨스티튜션 확인에 정당화해야 할 위반이 있는 경우에만 채움**

위반 없음 - 테이블 불필요.

---

## 0단계: 리서치 완료 ✅

**상태**: 완료
**문서**: [research.md](./research.md)

**주요 리서치 결과**:

- 무의존성 구현을 위해 IntersectionObserver API 선택
- 60fps 성능을 위한 GPU 가속 애니메이션(opacity + transform만)
- 320-420ms 지속 시간과 함께 cubic-bezier(0.22, 1, 0.36, 1) 타이밍
- 점진적 향상 전략: data-src + 네이티브 loading="lazy"
- ref 콜백 패턴이 있는 React 훅 아키텍처
- 성능 목표: CLS ≤ 0.1, LCP ≤ 2.5s, 60fps 스크롤

**기술 결정**:

1. ✅ 네이티브 IntersectionObserver (라이브러리 없음)
2. ✅ 단일 `useScrollAnimation` 훅
3. ✅ 요소 상태 관리용 WeakMap
4. ✅ 시차 지연용 CSS 사용자 정의 속성
5. ✅ E2E 테스트용 Playwright
6. ✅ 시각적 부드러움 수동 테스트

---

## 1단계: 설계 완료 ✅

**상태**: 완료
**문서**:

- [data-model.md](./data-model.md) - TypeScript 인터페이스 및 데이터 구조
- [quickstart.md](./quickstart.md) - 개발자 퀵스타트 가이드
- [CLAUDE.md](../../CLAUDE.md) - 에이전트 컨텍스트 업데이트됨

**설계 아티팩트**:

1. **타입 정의**:
   - `UseScrollAnimationOptions` - 훅 설정 인터페이스
   - `UseScrollAnimationReturn` - 훅 반환 값 인터페이스
   - 내부 타입: `AnimationState`, `LazyImageConfig`, `AnimationTimingConfig`

2. **훅 아키텍처**:
   - 단일 책임: IntersectionObserver 수명 주기 관리
   - 동적 요소 관찰을 위한 Ref 콜백 패턴
   - 언마운트 시 자동 정리
   - 완전한 타입 안전성으로 TypeScript 우선

3. **CSS 아키텍처**:
   - 전역 CSS 클래스: `.js-observe`, `.is-visible`, `.is-hidden`
   - 동적 시차용 CSS 사용자 정의 속성: `--stagger`
   - 스타일링용 Tailwind 유틸리티
   - GPU 가속 전환

4. **파일 구조**:
   - `lib/hooks/useScrollAnimation.ts` - 메인 훅 구현
   - `lib/utils/scroll-animation.ts` - 유틸리티 (필요시)
   - `__tests__/e2e/scroll-animation.spec.ts` - Playwright 테스트
   - `app/globals.css` - 애니메이션 CSS 클래스

**1단계 후 컨스티튜션 재확인**:

✅ **타입 안전성**: 내보낸 인터페이스가 있는 완전한 TypeScript 구현
✅ **컴포넌트 아키텍처**: 100줄 미만의 단일 훅, 분리된 유틸리티
✅ **테스트 표준**: Playwright E2E + 수동 테스트 정의됨
✅ **무의존성**: 네이티브 브라우저 API만 사용
✅ **성능 표준**: 설계가 Core Web Vitals 목표 충족

**설계 변경 필요 없음**: 모든 컨스티튜션 요구사항 충족됨.

---

## 2단계: 작업 (다음 단계)

**상태**: 대기 중
**명령**: 구현 작업 생성을 위해 `/speckit.tasks` 실행

**예상 작업**:

1. TypeScript 타입이 있는 `useScrollAnimation` 훅 생성
2. globals.css에 CSS 애니메이션 클래스 추가
3. Playwright E2E 테스트 작성
4. 예시 사용 페이지 생성
5. 성능 프로파일링 및 최적화
6. 크로스 브라우저 테스트
7. 사용자 수용 테스트(최소 3명 사용자)
8. 문서화 및 코드 리뷰
