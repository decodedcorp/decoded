---
id: "006"
type: quick
description: "데스크탑에서 request 페이지를 모달로 띄우기"
wave: 1
autonomous: true
files_modified:
  - packages/web/app/@modal/(.)request/upload/page.tsx
  - packages/web/lib/components/request/RequestFlowModal.tsx
---

<objective>
데스크탑에서 request 페이지(/request/upload, /request/detect)를 전체 페이지가 아닌 모달 오버레이로 표시

Purpose: 이미지 그리드에서 request 플로우를 시작할 때 컨텍스트를 유지하면서 업로드 경험 제공
Output: Next.js 병렬 라우트를 활용한 데스크탑 모달 request 플로우
</objective>

<context>
@packages/web/app/@modal/(.)images/[id]/page.tsx - 기존 이미지 모달 인터셉팅 라우트 패턴
@packages/web/lib/components/detail/ImageDetailModal.tsx - 기존 모달 컴포넌트 패턴 (GSAP 애니메이션)
@packages/web/app/request/upload/page.tsx - 현재 request upload 페이지
@packages/web/app/request/detect/page.tsx - 현재 request detect 페이지
@packages/web/lib/components/request/RequestFlowHeader.tsx - request 플로우 헤더
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create RequestFlowModal component</name>
  <files>packages/web/lib/components/request/RequestFlowModal.tsx</files>
  <action>
데스크탑에서 request 플로우를 모달로 표시하는 래퍼 컴포넌트 생성:

1. ImageDetailModal.tsx 패턴 참고하여 구현:
   - 고정 오버레이 (fixed inset-0 z-[10000])
   - 백드롭 (bg-black/80 backdrop-blur-sm)
   - ESC 키로 닫기
   - 백드롭 클릭으로 닫기

2. 모달 컨테이너:
   - 중앙 정렬 (flex items-center justify-center)
   - 최대 너비 max-w-xl, 최대 높이 max-h-[90vh]
   - 둥근 모서리 (rounded-2xl)
   - 배경색 bg-background

3. 닫기 동작:
   - router.back() 사용 (인터셉팅 라우트 특성)
   - requestStore.resetRequestFlow() 호출

4. Props:
   - children: React.ReactNode (upload/detect 페이지 콘텐츠)

참고: 모바일에서는 이 모달이 사용되지 않음 - 인터셉팅 라우트는 데스크탑에서만 모달로 동작하고, 모바일에서는 기존 전체 페이지로 동작
  </action>
  <verify>
TypeScript 컴파일 에러 없음:
cd packages/web && npx tsc --noEmit --skipLibCheck
  </verify>
  <done>RequestFlowModal 컴포넌트가 생성되고 모달 UI 패턴 구현됨</done>
</task>

<task type="auto">
  <name>Task 2: Create intercepting route for /request/upload</name>
  <files>packages/web/app/@modal/(.)request/upload/page.tsx</files>
  <action>
Next.js 인터셉팅 라우트 생성:

1. 파일 위치: app/@modal/(.)request/upload/page.tsx
   - (.) 는 현재 레벨에서 인터셉트
   - @modal 병렬 라우트 슬롯 사용 (layout.tsx에서 이미 설정됨)

2. 페이지 구현:
```tsx
"use client";

import { RequestFlowModal } from "@/lib/components/request/RequestFlowModal";
import { useRequestStore, selectCurrentStep, selectHasImages, selectCanProceed } from "@/lib/stores/requestStore";
import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { RequestFlowHeader } from "@/lib/components/request/RequestFlowHeader";
import { DropZone } from "@/lib/components/request/DropZone";
import { ImagePreviewGrid } from "@/lib/components/request/ImagePreviewGrid";
import { useRouter } from "next/navigation";

export default function ModalRequestUploadPage() {
  // 기존 upload/page.tsx 로직 재사용
  // RequestFlowModal로 래핑
  return (
    <RequestFlowModal>
      {/* upload 콘텐츠 */}
    </RequestFlowModal>
  );
}
```

3. 닫기 동작:
   - RequestFlowModal의 onClose에서 resetRequestFlow + router.back()

4. 다음 단계(detect) 이동:
   - router.push("/request/detect") 사용 (모달 내에서 전환)
  </action>
  <verify>
- 폴더 구조 확인: ls -la packages/web/app/@modal/
- TypeScript 컴파일: cd packages/web && npx tsc --noEmit --skipLibCheck
- 개발 서버에서 /request/upload 접근 시 모달로 표시 확인 (데스크탑)
  </verify>
  <done>데스크탑에서 /request/upload 접근 시 모달 오버레이로 표시됨</done>
</task>

<task type="auto">
  <name>Task 3: Create intercepting route for /request/detect</name>
  <files>packages/web/app/@modal/(.)request/detect/page.tsx</files>
  <action>
detect 페이지 인터셉팅 라우트 생성:

1. 파일 위치: app/@modal/(.)request/detect/page.tsx

2. 기존 detect/page.tsx 로직을 모달 내에서 동작하도록 조정:
   - RequestFlowModal로 래핑
   - DesktopDetectionLayout만 사용 (모달이므로 데스크탑 전용)
   - 모달 높이에 맞게 레이아웃 조정

3. 이미지 없을 경우 처리:
   - router.push("/request/upload")로 리다이렉트하되
   - 모달 컨텍스트 유지
  </action>
  <verify>
- TypeScript 컴파일: cd packages/web && npx tsc --noEmit --skipLibCheck
- upload에서 다음으로 넘어갈 때 detect 모달로 전환 확인
  </verify>
  <done>upload -> detect 전환이 모달 내에서 원활하게 동작</done>
</task>

</tasks>

<verification>
1. 데스크탑에서 /request/upload 접근 시 모달로 표시
2. 모달 백드롭 클릭 시 닫힘
3. ESC 키로 모달 닫힘
4. 이미지 업로드 후 다음 버튼 클릭 시 detect 모달로 전환
5. 모바일에서는 기존대로 전체 페이지로 동작 (인터셉팅 라우트 특성)
</verification>

<success_criteria>
- 데스크탑: request 플로우가 모달 오버레이로 동작
- 모바일: 기존 전체 페이지 동작 유지
- 모달 닫기 시 이전 페이지로 복귀 (컨텍스트 유지)
- TypeScript 컴파일 에러 없음
</success_criteria>

<output>
완료 후 `.planning/quick/006-desktop-request-page-modal/006-SUMMARY.md` 생성
</output>
