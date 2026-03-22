# Quick Task 021 Summary

## Task
Fix request upload spot creation missing - spot clicking functionality was broken.

## Root Cause
Invalid Tailwind CSS class `z-5` in DetectionView.tsx. Tailwind only supports `z-0, z-10, z-20...z-50` by default, so `z-5` was silently ignored, causing the click area to have no z-index and fail to capture events.

## Changes Made

### 1. DetectionView.tsx
```diff
-  className="absolute inset-0 z-5 cursor-crosshair"
+  className="absolute inset-0 z-[1] cursor-crosshair"
```

### 2. SpotMarker.tsx
```diff
-  absolute w-7 h-7
+  absolute z-10 w-7 h-7
```

## Result
- Click area now has valid `z-[1]` (below markers)
- SpotMarkers now have explicit `z-10` (above click area)
- Spot creation on image click works correctly
