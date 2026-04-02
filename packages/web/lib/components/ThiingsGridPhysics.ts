// Physics constants for ThiingsGrid
const FRICTION = 0.9;
const VELOCITY_HISTORY_SIZE = 5;

export type Position = {
  x: number;
  y: number;
};

// Physics state separated from React state
export type PhysicsState = {
  offset: Position;
  startPos: Position;
  velocity: Position;
  isDragging: boolean;
  lastMoveTime: number;
  velocityHistory: Position[];
};

// Callbacks the physics engine invokes to notify the React component
export type PhysicsCallbacks = {
  onStateUpdate: () => void;
  onReachEnd?: () => void;
  getHasMore: () => boolean | undefined;
  getIsLoadingMore: () => boolean | undefined;
  getItemCount: () => number;
  getMaxVisibleIndex: () => number;
};

// Custom debounce implementation
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

  const debouncedFn = function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = undefined;
    }, wait);
  };

  debouncedFn.cancel = function () {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  };

  return debouncedFn;
}

// Custom throttle implementation
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
  options: { leading?: boolean; trailing?: boolean } = {}
) {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
  const { leading = true, trailing = true } = options;

  const throttledFn = function (...args: Parameters<T>) {
    const now = Date.now();

    if (!lastCall && !leading) {
      lastCall = now;
    }

    const remaining = limit - (now - lastCall);

    if (remaining <= 0 || remaining > limit) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
      lastCall = now;
      func(...args);
    } else if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        lastCall = leading ? Date.now() : 0;
        timeoutId = undefined;
        func(...args);
      }, remaining);
    }
  };

  throttledFn.cancel = function () {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return throttledFn;
}

export function getDistance(p1: Position, p2: Position) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Infinite scroll config
const INFINITE_SCROLL_PRELOAD_MARGIN = 50;

export class ThiingsGridPhysics {
  // Physics state
  public offset: Position;
  public startPos: Position;
  public velocity: Position;
  public isDragging: boolean;
  public lastMoveTime: number;
  public velocityHistory: Position[];

  // Spiral position cache
  private spiralPositions: Position[] = [];

  // RAF handle
  private animationFrame: number | null = null;

  // Lifecycle flag
  public isComponentMounted: boolean = false;

  // Callbacks
  private callbacks: PhysicsCallbacks;

  // Content element ref for direct DOM manipulation
  public contentRef: React.RefObject<HTMLDivElement | null> | null = null;

  // Debounced grid items updater
  public debouncedUpdateGridItems: ReturnType<typeof throttle>;

  // Last pointer position (used in move tracking)
  private lastPos: Position = { x: 0, y: 0 };

  constructor(
    initialOffset: Position,
    callbacks: PhysicsCallbacks,
    contentRef: React.RefObject<HTMLDivElement | null>
  ) {
    this.offset = { ...initialOffset };
    this.startPos = { ...initialOffset };
    this.velocity = { x: 0, y: 0 };
    this.isDragging = false;
    this.lastMoveTime = 0;
    this.velocityHistory = [];
    this.callbacks = callbacks;
    this.contentRef = contentRef;

    // Precompute initial batch of spiral positions
    this.ensureSpiralPositions(1000);

    this.debouncedUpdateGridItems = throttle(
      () => this.callbacks.onStateUpdate(),
      32,
      { leading: true, trailing: true }
    );
  }

  // --- Spiral math ---

  ensureSpiralPositions(count: number): void {
    if (this.spiralPositions.length >= count) return;
    for (let i = this.spiralPositions.length; i < count; i++) {
      this.spiralPositions.push(this.computeSpiralPosition(i));
    }
  }

  getSpiralPosition(index: number): Position {
    this.ensureSpiralPositions(index + 1);
    return this.spiralPositions[index];
  }

  private computeSpiralPosition(n: number): Position {
    if (n === 0) return { x: 0, y: 0 };

    const layer = Math.floor((Math.sqrt(n) + 1) / 2);
    const sideLen = 2 * layer;
    const layerArea = (2 * layer - 1) ** 2;
    const posInLayer = n - layerArea;
    const side = Math.floor(posInLayer / sideLen);
    const offset = posInLayer % sideLen;

    let x = 0,
      y = 0;

    switch (side) {
      case 0: // Right side
        x = layer;
        y = offset - layer + 1;
        break;
      case 1: // Top side
        x = layer - offset - 1;
        y = layer;
        break;
      case 2: // Left side
        x = -layer;
        y = layer - offset - 1;
        break;
      case 3: // Bottom side
        x = -layer + offset + 1;
        y = -layer;
        break;
    }

    return { x, y };
  }

  // --- RAF physics loop ---

  start(): void {
    this.isComponentMounted = true;
    this.startPhysicsLoop();
  }

  private startPhysicsLoop(): void {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.loop();
  }

  private loop = (): void => {
    if (!this.isComponentMounted) return;

    const { velocity, offset } = this;

    // Friction
    velocity.x *= FRICTION;
    velocity.y *= FRICTION;

    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (speed < 0.01 && !this.isDragging) {
      this.velocity = { x: 0, y: 0 };
    } else {
      offset.x += velocity.x;
      offset.y += velocity.y;

      // Direct DOM manipulation for high performance
      if (this.contentRef?.current) {
        this.contentRef.current.style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0)`;
      }

      this.debouncedUpdateGridItems();
      this.animationFrame = requestAnimationFrame(this.loop);
    }
  };

  resumeLoop(): void {
    if (!this.animationFrame) {
      this.startPhysicsLoop();
    }
  }

  // --- Pointer event handlers ---

  handleDown(p: Position): void {
    this.resumeLoop();

    this.isDragging = true;
    this.startPos = {
      x: p.x - this.offset.x,
      y: p.y - this.offset.y,
    };
    this.velocity = { x: 0, y: 0 };
    this.lastPos = { x: p.x, y: p.y };
    this.lastMoveTime = performance.now();

    // Force restart loop if it was idle
    this.startPhysicsLoop();
  }

  handleMove(p: Position): void {
    if (!this.isDragging) return;

    const currentTime = performance.now();
    const timeDelta = currentTime - this.lastMoveTime;

    const rawVelocity = {
      x: (p.x - this.lastPos.x) / (timeDelta || 16),
      y: (p.y - this.lastPos.y) / (timeDelta || 16),
    };

    this.velocityHistory.push(rawVelocity);
    if (this.velocityHistory.length > VELOCITY_HISTORY_SIZE) {
      this.velocityHistory.shift();
    }

    const smoothedVelocity = this.velocityHistory.reduce(
      (acc, vel) => ({
        x: acc.x + vel.x / this.velocityHistory.length,
        y: acc.y + vel.y / this.velocityHistory.length,
      }),
      { x: 0, y: 0 }
    );

    this.velocity = smoothedVelocity;
    this.offset = {
      x: p.x - this.startPos.x,
      y: p.y - this.startPos.y,
    };
    this.lastMoveTime = currentTime;

    if (this.contentRef?.current) {
      this.contentRef.current.style.transform = `translate3d(${this.offset.x}px, ${this.offset.y}px, 0)`;
    }

    this.lastPos = { x: p.x, y: p.y };
    this.debouncedUpdateGridItems();
  }

  handleUp(): void {
    this.isDragging = false;
    // Loop continues to handle momentum
  }

  handleWheel(e: WheelEvent): void {
    e.preventDefault();

    this.offset.x -= e.deltaX;
    this.offset.y -= e.deltaY;

    // Reset velocity on wheel to avoid conflict
    this.velocity = { x: 0, y: 0 };

    if (this.contentRef?.current) {
      this.contentRef.current.style.transform = `translate3d(${this.offset.x}px, ${this.offset.y}px, 0)`;
    }

    this.debouncedUpdateGridItems();
    this.startPhysicsLoop();
  }

  // --- Infinite scroll ---

  checkInfiniteScroll(maxVisibleIndex: number): void {
    const hasMore = this.callbacks.getHasMore();
    const isLoadingMore = this.callbacks.getIsLoadingMore();
    const itemCount = this.callbacks.getItemCount();
    const onReachEnd = this.callbacks.onReachEnd;

    if (!hasMore || isLoadingMore || !onReachEnd || itemCount === 0) return;

    const loadedMaxIndex = itemCount - 1;
    if (loadedMaxIndex - maxVisibleIndex < INFINITE_SCROLL_PRELOAD_MARGIN) {
      onReachEnd();
    }
  }

  // --- Grid position helpers ---

  /**
   * Calculate which grid cell positions are visible given the current physics offset
   * and the container dimensions.
   */
  calculateVisiblePositions(
    containerEl: HTMLElement,
    gridWidth: number,
    gridHeight: number,
    viewportBuffer: number
  ): Position[] {
    const rect = containerEl.getBoundingClientRect();
    const width = rect.width * viewportBuffer;
    const height = rect.height * viewportBuffer;

    const cellsX = Math.ceil(width / gridWidth);
    const cellsY = Math.ceil(height / gridHeight);

    const centerX = -Math.round(this.offset.x / gridWidth);
    const centerY = -Math.round(this.offset.y / gridHeight);

    const positions: Position[] = [];
    const halfCellsX = Math.ceil(cellsX / 2);
    const halfCellsY = Math.ceil(cellsY / 2);

    for (let y = centerY - halfCellsY; y <= centerY + halfCellsY; y++) {
      for (let x = centerX - halfCellsX; x <= centerX + halfCellsX; x++) {
        positions.push({ x, y });
      }
    }

    return positions;
  }

  /**
   * Map a grid (x, y) coordinate to its spiral index.
   */
  getItemIndexForPosition(x: number, y: number): number {
    if (x === 0 && y === 0) return 0;

    const layer = Math.max(Math.abs(x), Math.abs(y));
    const innerLayersSize = Math.pow(2 * layer - 1, 2);

    let positionInLayer: number;

    if (y === 0 && x === layer) {
      positionInLayer = 0;
    } else if (y < 0 && x === layer) {
      positionInLayer = -y;
    } else if (y === -layer && x > -layer) {
      positionInLayer = layer + (layer - x);
    } else if (x === -layer && y < layer) {
      positionInLayer = 3 * layer + (layer + y);
    } else if (y === layer && x < layer) {
      positionInLayer = 5 * layer + (layer + x);
    } else {
      positionInLayer = 7 * layer + (layer - y);
    }

    return innerLayersSize + positionInLayer;
  }

  /**
   * Calculate the full set of grid items to render, applying viewport culling,
   * item bounds checking, and MAX_RENDER_CELLS prioritization by distance.
   */
  calculateGridItems(
    containerEl: HTMLElement,
    gridWidth: number,
    gridHeight: number,
    viewportBuffer: number,
    maxRenderCells: number,
    itemCount: number | undefined,
    hasMore: boolean | undefined
  ): {
    items: Array<{ position: Position; gridIndex: number }>;
    maxVisibleIndex: number;
  } {
    const positions = this.calculateVisiblePositions(
      containerEl,
      gridWidth,
      gridHeight,
      viewportBuffer
    );
    let maxVisibleIndex = 0;

    let allItems = positions
      .map((position) => {
        const gridIndex = this.getItemIndexForPosition(position.x, position.y);

        if (itemCount !== undefined) {
          const isLoaded = gridIndex < itemCount;
          if (!isLoaded && !hasMore) return null;
        }

        maxVisibleIndex = Math.max(maxVisibleIndex, gridIndex);
        return { position, gridIndex };
      })
      .filter(
        (item): item is { position: Position; gridIndex: number } =>
          item !== null
      );

    if (allItems.length > maxRenderCells) {
      const cx = -this.offset.x / gridWidth;
      const cy = -this.offset.y / gridHeight;
      allItems.sort(
        (a, b) =>
          Math.pow(a.position.x - cx, 2) +
          Math.pow(a.position.y - cy, 2) -
          (Math.pow(b.position.x - cx, 2) + Math.pow(b.position.y - cy, 2))
      );
      allItems = allItems.slice(0, maxRenderCells);
    }

    return { items: allItems, maxVisibleIndex };
  }

  // --- Cleanup ---

  destroy(): void {
    this.isComponentMounted = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.debouncedUpdateGridItems.cancel();
    this.velocity = { x: 0, y: 0 };
    this.isDragging = false;
    this.velocityHistory = [];
  }
}
