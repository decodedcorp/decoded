# ThiingsGrid Best Practices

This document outlines best practices for using the ThiingsGrid component effectively and with optimal performance.

## Cell Positioning

Always use absolute positioning within your cell components for optimal performance.

### ✅ Good

```tsx
const MyCell = ({ gridIndex }: ItemConfig) => (
  <div className="absolute inset-1 ...">{gridIndex}</div>
);
```

### ❌ Avoid

Using `w-full h-full` can cause layout issues:

```tsx
const MyCell = ({ gridIndex }: ItemConfig) => (
  <div className="w-full h-full ...">{gridIndex}</div>
);
```

## Performance Optimization

For better performance with complex cells, use `React.memo` and `useMemo`:

```tsx
import { memo, useMemo } from "react";
import { type ItemConfig } from "@/lib/components/ThiingsGrid";

const OptimizedCell = memo(({ gridIndex, isMoving }: ItemConfig) => {
  // Expensive calculations memoized
  const computedValue = useMemo(() => {
    return expensiveCalculation(gridIndex);
  }, [gridIndex]);

  return <div className="absolute inset-1 ...">{computedValue}</div>;
});

OptimizedCell.displayName = "OptimizedCell";
```

### Benefits

- **React.memo**: Prevents unnecessary re-renders when props haven't changed
- **useMemo**: Caches expensive calculations and only recomputes when dependencies change
- **displayName**: Helps with React DevTools debugging

## Container Setup

Ensure the ThiingsGrid has a defined container size.

### ✅ Good - Explicit Container Size

```tsx
<div style={{ width: "100vw", height: "100vh" }}>
  <ThiingsGrid gridSize={80} renderItem={MyCell} />
</div>
```

### ✅ Good - CSS Classes with Defined Dimensions

```tsx
<div className="w-screen h-screen">
  <ThiingsGrid gridSize={80} renderItem={MyCell} />
</div>
```

### ✅ Good - Relative Container with Absolute Positioning

```tsx
<main className="relative w-screen h-screen overflow-hidden">
  <div className="absolute inset-0">
    <ThiingsGrid gridSize={80} renderItem={MyCell} />
  </div>
</main>
```

## Complete Example

Here's a complete example combining all best practices:

```tsx
"use client";

import { useRef, memo, useMemo } from "react";
import ThiingsGrid, { type ItemConfig } from "@/lib/components/ThiingsGrid";

// Expensive calculation function
const expensiveCalculation = (gridIndex: number): number => {
  let result = 0;
  for (let i = 0; i < gridIndex % 1000; i++) {
    result += Math.sqrt(i);
  }
  return Math.floor(result);
};

// Optimized cell component
const OptimizedCell = memo(({ gridIndex, isMoving }: ItemConfig) => {
  const computedValue = useMemo(() => {
    return expensiveCalculation(gridIndex);
  }, [gridIndex]);

  return (
    <div
      className={`absolute inset-1 flex items-center justify-center bg-blue-50 border border-blue-500 rounded transition-shadow ${
        isMoving ? "shadow-lg" : "shadow-sm"
      }`}
    >
      <div className="flex flex-col items-center">
        <span className="text-sm font-bold">{gridIndex}</span>
        <span className="text-[10px] text-blue-600 opacity-70">
          {computedValue}
        </span>
      </div>
    </div>
  );
});

OptimizedCell.displayName = "OptimizedCell";

export default function MyPage() {
  const gridRef = useRef<ThiingsGrid>(null);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <div className="absolute inset-0">
        <ThiingsGrid
          ref={gridRef}
          gridSize={80}
          renderItem={OptimizedCell}
          initialPosition={{ x: 0, y: 0 }}
        />
      </div>
    </main>
  );
}
```

## Performance Tips

1. **Memoize expensive calculations**: Use `useMemo` for any computation that depends on `gridIndex`
2. **Memoize cell components**: Wrap cell components with `React.memo` to prevent unnecessary re-renders
3. **Avoid inline functions**: Don't create functions inside the render method
4. **Use absolute positioning**: Always use `absolute inset-*` for cell positioning
5. **Define container size**: Always provide explicit dimensions for the container

## Common Pitfalls

1. **Forgetting to memoize**: Complex cells without memoization can cause performance issues
2. **Inline styles in cells**: Prefer className over inline styles for better performance
3. **Undefined container size**: Grid won't render correctly without container dimensions
4. **Using relative positioning**: Can cause layout shifts and performance issues
