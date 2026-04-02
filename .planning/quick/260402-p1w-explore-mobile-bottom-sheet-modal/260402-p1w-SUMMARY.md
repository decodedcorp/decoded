# Quick Task 260402-p1w: Explore 모바일 모달 바텀시트 스타일 변경

**Date:** 2026-04-02
**Commit:** d9953e0c

## Changes

| File | Change |
|------|--------|
| `packages/web/lib/components/detail/ImageDetailModal.tsx` | Mobile: h-full → h-[90vh], rounded-t-[20px], drag handle, safe area padding |

## What Changed

- **Mobile drawer height**: `h-full` → `h-[90vh] md:h-full`
- **Rounded corners**: `rounded-t-[20px] md:rounded-none`
- **Drag handle**: 40x4px #3D3D3D bar (design system convention)
- **Safe area**: `pb-[env(safe-area-inset-bottom,0px)]`
- **Desktop**: unchanged
- **Animation hook**: no changes needed
