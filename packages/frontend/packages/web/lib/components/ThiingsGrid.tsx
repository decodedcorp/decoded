"use client";

import React, { Component } from "react";

// Grid physics constants
const MIN_VELOCITY = 0.2;
const UPDATE_INTERVAL = 16;
const VELOCITY_HISTORY_SIZE = 5;
const FRICTION = 0.9;
const VELOCITY_THRESHOLD = 0.3;
const INFINITE_SCROLL_THRESHOLD = 50; // Items before end to trigger load
const VIEWPORT_BUFFER = 1.2; // Render 1.5x viewport for smooth scrolling
const MAX_RENDER_CELLS = 300; // Limit rendering DOM nodes for performance

// Custom debounce implementation
function debounce<T extends (...args: unknown[]) => unknown>(
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
function throttle<T extends (...args: unknown[]) => unknown>(
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

function getDistance(p1: Position, p2: Position) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export type Position = {
  x: number;
  y: number;
};

// Post source discriminator for type-safe UI logic
export type PostSource = "post" | "legacy";

// Generic grid item type for ThiingsGrid (now post-centric)
export type GridItem = {
  id: string;
  imageUrl?: string | null;
  status?: "pending" | "extracted" | "skipped" | string;
  hasItems?: boolean;
  // Post metadata (REQUIRED for post-centric architecture)
  postId: string; // Required: either real post ID or synthetic "legacy:${imageId}"
  postSource: PostSource; // Discriminator: "post" | "legacy"
  postAccount: string; // Account name for badge display (e.g., "newjeanscloset", "Legacy")
  postCreatedAt: string; // Post timestamp for context/sorting
  /** 에디토리얼 그리드 카드 오버레이 표시용 */
  editorialTitle?: string | null;
};

type GridItemInternal = {
  position: Position;
  gridIndex: number;
};

// Physics state separated from React state
type PhysicsState = {
  offset: Position;
  startPos: Position;
  velocity: Position;
  isDragging: boolean;
  lastMoveTime: number;
  velocityHistory: Position[];
};

type State = {
  // Only state that affects rendering remains here
  gridItems: GridItemInternal[];
  isMoving: boolean;
  maxVisibleIndex: number;
  isDragging: boolean;
};

export type ItemConfig = {
  isMoving: boolean;
  position: Position;
  gridIndex: number;
  item?: GridItem; // Optional: actual data item (Supabase-independent)
};

// Props 타입 변경
export type ThiingsGridProps = {
  gridSize: number | { width: number; height: number };
  renderItem: (itemConfig: ItemConfig) => React.ReactNode;
  className?: string;
  initialPosition?: Position;
  /**
   * Array of items to display in the grid.
   */
  items?: GridItem[];
  /**
   * Callback triggers when scrolling nears end of loaded items
   */
  onReachEnd?: () => void;
  /**
   * Whether more items are available to load
   */
  hasMore?: boolean;
  /**
   * Whether items are currently loading
   */
  isLoadingMore?: boolean;
};

class ThiingsGrid extends Component<ThiingsGridProps, State> {
  private containerRef: React.RefObject<HTMLElement | null>;
  private contentRef: React.RefObject<HTMLDivElement | null>;
  private lastPos: Position;
  private animationFrame: number | null;
  private isComponentMounted: boolean;
  private lastUpdateTime: number;
  private debouncedUpdateGridItems: ReturnType<typeof throttle>;
  private intersectionObserver: IntersectionObserver | null;
  private imageObserver: IntersectionObserver | null;
  private staggerPositionCache: WeakMap<Element, number>; // Cache top position for stagger calculation
  private staggerDelayMap: WeakMap<Element, number>; // Cache stagger delay value
  private staggerTick: number; // Counter for stagger assignment

  // Physics state stored in a ref-like property to avoid re-renders
  private physics: PhysicsState;

  // Cache for spiral positions
  private spiralPositions: Position[] = [];

  constructor(props: ThiingsGridProps) {
    super(props);
    const offset = this.props.initialPosition || { x: 0, y: 0 };

    // Initialize physics state
    this.physics = {
      offset: { ...offset },
      startPos: { ...offset },
      velocity: { x: 0, y: 0 },
      isDragging: false,
      lastMoveTime: 0,
      velocityHistory: [],
    };

    // Minimal React state
    this.state = {
      gridItems: [],
      isMoving: false,
      maxVisibleIndex: 0,
      isDragging: false,
    };

    this.containerRef = React.createRef();
    this.contentRef = React.createRef();
    this.lastPos = { x: 0, y: 0 };
    this.animationFrame = null;
    this.isComponentMounted = false;
    this.lastUpdateTime = 0;
    this.intersectionObserver = null;
    this.imageObserver = null;
    this.staggerPositionCache = new WeakMap();
    this.staggerDelayMap = new WeakMap();
    this.staggerTick = 0;

    // Precompute initial batch of spiral positions
    this.ensureSpiralPositions(1000);

    this.debouncedUpdateGridItems = throttle(
      this.updateGridItems,
      32, // Reverted to 32ms for better responsiveness
      {
        leading: true,
        trailing: true,
      }
    );
  }

  componentDidMount() {
    this.isComponentMounted = true;
    this.updateGridItems();
    this.initializeIntersectionObserver();
    this.initializeImageObserver();

    // Add non-passive event listener
    if (this.containerRef.current) {
      this.containerRef.current.addEventListener("wheel", this.handleWheel, {
        passive: false,
      });
      this.containerRef.current.addEventListener(
        "touchmove",
        this.handleTouchMove,
        { passive: false }
      );
    }

    // Start the physics loop
    this.startPhysicsLoop();
  }

  componentDidUpdate(prevProps: ThiingsGridProps, prevState: State) {
    // Re-observe elements when items prop changes
    if (prevProps.items !== this.props.items) {
      this.updateGridItems();
    }

    // Check for infinite scroll trigger on state update or props update
    if (
      prevState.maxVisibleIndex !== this.state.maxVisibleIndex ||
      prevProps.items?.length !== this.props.items?.length
    ) {
      this.checkInfiniteScroll();
    }

    // Observe new card elements when grid items update
    this.observeCardElements();
    // Observe new images when grid items update
    this.observeImages();
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.debouncedUpdateGridItems.cancel();

    // Disconnect IntersectionObservers
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    if (this.imageObserver) {
      this.imageObserver.disconnect();
      this.imageObserver = null;
    }

    // Remove event listeners
    if (this.containerRef.current) {
      this.containerRef.current.removeEventListener("wheel", this.handleWheel);
      this.containerRef.current.removeEventListener(
        "touchmove",
        this.handleTouchMove
      );
    }
  }

  public publicGetCurrentPosition = () => {
    return this.physics.offset;
  };

  // Precompute/Cache spiral positions
  private ensureSpiralPositions = (count: number) => {
    if (this.spiralPositions.length >= count) return;

    for (let i = this.spiralPositions.length; i < count; i++) {
      this.spiralPositions.push(this.computeSpiralPosition(i));
    }
  };

  // Pure math calculation for spiral position
  private computeSpiralPosition = (n: number): Position => {
    if (n === 0) return { x: 0, y: 0 };

    // Approximation of inverse spiral mapping (index -> x,y)
    // This is computationally expensive, so we cache it

    // Layer calculation
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
  };

  // Check if we need to load more items
  private checkInfiniteScroll = () => {
    const { items, hasMore, isLoadingMore, onReachEnd } = this.props;
    const { maxVisibleIndex } = this.state;

    if (!items || !hasMore || isLoadingMore || !onReachEnd) return;

    // Use PRELOAD_MARGIN (approx 0.7 * PAGE_SIZE, where PAGE_SIZE is 80)
    // Increased to prevent starvation during fast scroll
    const PRELOAD_MARGIN = 50;
    const loadedMaxIndex = items.length - 1;

    // Trigger if we are approaching the end of the list based on visible index
    if (loadedMaxIndex - maxVisibleIndex < PRELOAD_MARGIN) {
      onReachEnd();
    }
  };

  // Initialize IntersectionObserver for scroll animations
  private initializeIntersectionObserver = () => {
    if (typeof IntersectionObserver === "undefined") {
      return; // Fallback for browsers without IntersectionObserver support
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        // Use requestAnimationFrame to batch DOM updates
        requestAnimationFrame(() => {
          // First pass: cache positions for new entries (only on first appearance)
          entries.forEach((entry) => {
            if (
              entry.isIntersecting &&
              !this.staggerPositionCache.has(entry.target)
            ) {
              const rect = entry.target.getBoundingClientRect();
              this.staggerPositionCache.set(entry.target, rect.top);
            }
          });

          // Second pass: sort by cached position and assign stagger delays
          // Limit processing to visible entries to reduce work
          const intersectingEntries = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => {
              const topA = this.staggerPositionCache.get(a.target) ?? 0;
              const topB = this.staggerPositionCache.get(b.target) ?? 0;
              return topA - topB;
            });

          // Assign stagger delays (max 240ms)
          intersectingEntries.forEach((entry) => {
            const el = entry.target as HTMLElement;
            if (!this.staggerDelayMap.has(el)) {
              const delay = Math.min((this.staggerTick++ % 6) * 40, 240); // Max 240ms
              this.staggerDelayMap.set(el, delay);
            }
            const delay = this.staggerDelayMap.get(el) ?? 0;
            el.style.setProperty("--stagger", `${delay}ms`);
          });

          // Third pass: handle visibility classes with hysteresis
          entries.forEach((entry) => {
            const el = entry.target as HTMLElement;
            const intersectionRatio = entry.intersectionRatio;

            if (entry.isIntersecting && intersectionRatio >= 0.15) {
              // Entry: only trigger at 0.15 threshold
              el.classList.add("is-visible");
              el.classList.remove("is-hidden");
            } else if (!entry.isIntersecting || intersectionRatio < 0.05) {
              // Exit: trigger at 0.0 threshold (or very low ratio)
              el.classList.add("is-hidden");
              el.classList.remove("is-visible");
            }
          });
        });
      },
      {
        threshold: [0, 0.15, 0.3], // Multiple thresholds for hysteresis
        rootMargin: "20% 0px -20% 0px", // Increased buffer for earlier triggering
      }
    );

    // Observe existing card elements
    this.observeCardElements();
  };

  // Initialize separate IntersectionObserver for faster image loading
  private initializeImageObserver = () => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    // Calculate viewport height in pixels for rootMargin (0.8-1.2x range, default 1.0x)
    // Tune based on WebPageTest/DevTools Network waterfall: if concurrent requests > 6-8, reduce to 0.6-0.8x
    const viewportHeight =
      typeof window !== "undefined" ? window.innerHeight : 1000;
    const rootMarginMultiplier = 1.0; // Tune between 0.6-1.2 based on network/main thread balance
    const rootMarginValue = `${Math.round(viewportHeight * rootMarginMultiplier)}px`;

    this.imageObserver = new IntersectionObserver(
      (entries) => {
        // Use requestAnimationFrame to optimize image loading triggers
        requestAnimationFrame(() => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const alreadyLoaded =
                img.dataset.loaded === "true" ||
                img.getAttribute("data-loaded") === "true";
              if (!alreadyLoaded && img.dataset.src) {
                img.src = img.dataset.src;
                img.dataset.loaded = "true";
                // Stop observing once loaded to reduce observer overhead
                this.imageObserver?.unobserve(img);
              }
            }
          });
        });
      },
      {
        threshold: 0, // Trigger immediately when any pixel enters
        rootMargin: "50% 0px", // Load images well before they appear (50% viewport height buffer)
      }
    );

    // Observe existing images
    this.observeImages();
  };

  // Observe all card elements with js-observe class
  private observeCardElements = () => {
    if (!this.intersectionObserver || !this.containerRef.current) {
      return;
    }

    // Use requestAnimationFrame instead of setTimeout for better rendering sync
    requestAnimationFrame(() => {
      const cardElements =
        this.containerRef.current?.querySelectorAll(".js-observe");
      // Batch observations if there are many elements
      cardElements?.forEach((el) => {
        this.intersectionObserver?.observe(el);
      });
    });
  };

  // Observe all images with data-src for faster loading
  private observeImages = () => {
    if (!this.imageObserver || !this.containerRef.current) {
      return;
    }

    // Use requestAnimationFrame batching for performance
    requestAnimationFrame(() => {
      const images =
        this.containerRef.current?.querySelectorAll("img[data-src]");
      images?.forEach((img) => {
        const alreadyLoaded = img.getAttribute("data-loaded") === "true";
        if (!alreadyLoaded) {
          // Let IntersectionObserver handle visibility check (no getBoundingClientRect)
          this.imageObserver?.observe(img);
        }
      });
    });
  };

  // Helper method 추가
  private getGridSize = () => {
    const { gridSize } = this.props;
    if (typeof gridSize === "number") {
      return { width: gridSize, height: gridSize };
    }
    return gridSize;
  };

  // calculateVisiblePositions 수정
  private calculateVisiblePositions = (): Position[] => {
    if (!this.containerRef.current) return [];

    const rect = this.containerRef.current.getBoundingClientRect();
    const width = rect.width * VIEWPORT_BUFFER; // Apply buffer
    const height = rect.height * VIEWPORT_BUFFER; // Apply buffer
    const { width: gridWidth, height: gridHeight } = this.getGridSize();

    const cellsX = Math.ceil(width / gridWidth);
    const cellsY = Math.ceil(height / gridHeight);

    // Use physics offset instead of state offset
    const centerX = -Math.round(this.physics.offset.x / gridWidth);
    const centerY = -Math.round(this.physics.offset.y / gridHeight);

    const positions: Position[] = [];
    const halfCellsX = Math.ceil(cellsX / 2);
    const halfCellsY = Math.ceil(cellsY / 2);

    for (let y = centerY - halfCellsY; y <= centerY + halfCellsY; y++) {
      for (let x = centerX - halfCellsX; x <= centerX + halfCellsX; x++) {
        positions.push({ x, y });
      }
    }

    return positions;
  };

  // getItemIndexForPosition is now deprecated in favor of using precomputed spiralPositions
  // But we need inverse mapping (pos -> index) for spiral.
  // Since we iterate positions (x,y) and want index, we can use the math formula from getItemIndexForPosition.
  // Let's keep it but optimize if possible. For now, it's simple arithmetic.
  private getItemIndexForPosition = (x: number, y: number): number => {
    // Special case for center
    if (x === 0 && y === 0) return 0;

    // Determine which layer of the spiral we're in
    const layer = Math.max(Math.abs(x), Math.abs(y));

    // Calculate the size of all inner layers
    const innerLayersSize = Math.pow(2 * layer - 1, 2);

    // Calculate position within current layer
    let positionInLayer = 0;

    if (y === 0 && x === layer) {
      // Starting position (middle right)
      positionInLayer = 0;
    } else if (y < 0 && x === layer) {
      // Right side, bottom half
      positionInLayer = -y;
    } else if (y === -layer && x > -layer) {
      // Bottom side
      positionInLayer = layer + (layer - x);
    } else if (x === -layer && y < layer) {
      // Left side
      positionInLayer = 3 * layer + (layer + y);
    } else if (y === layer && x < layer) {
      // Top side
      positionInLayer = 5 * layer + (layer + x);
    } else {
      // Right side, top half (y > 0 && x === layer)
      positionInLayer = 7 * layer + (layer - y);
    }

    const index = innerLayersSize + positionInLayer;
    return index;
  };

  private updateGridItems = () => {
    if (!this.isComponentMounted) return;

    const positions = this.calculateVisiblePositions();
    let maxVisibleIndex = 0;

    // Generate grid positions
    // The grid simply renders the positions and maps them to items from props
    let allItems = positions
      .map((position) => {
        // Use cached spiral position mapping if available, otherwise compute (and cache if needed)
        // Here we need inverse: (x,y) -> index
        // Since we iterate viewport positions, we calculate index on the fly.
        // Caching (x,y) -> index is also possible but maybe less critical than index -> (x,y)
        // However, we can optimize getItemIndexForPosition later.

        const gridIndex = this.getItemIndexForPosition(position.x, position.y);

        // Skip indices that are out of bounds if items are provided
        // This stops the infinite spiral from rendering empty cells or repeating
        // But allow rendering "future" items as skeletons if hasMore is true
        if (this.props.items) {
          const isItemLoaded = gridIndex < this.props.items.length;
          const isPendingItem = this.props.hasMore && !isItemLoaded;

          if (!isItemLoaded && !isPendingItem) {
            return null;
          }
        }

        maxVisibleIndex = Math.max(maxVisibleIndex, gridIndex);

        return {
          position,
          gridIndex,
        };
      })
      .filter((item): item is GridItemInternal => item !== null);

    // Limit rendered items to avoid excessive DOM nodes
    if (allItems.length > MAX_RENDER_CELLS) {
      // Sort by distance from center (approximate prioritization)
      // Use offset to calculate relative distance to viewport center
      // Center of viewport in grid coords:
      const centerX = -this.physics.offset.x / this.getGridSize().width;
      const centerY = -this.physics.offset.y / this.getGridSize().height;

      allItems.sort((a, b) => {
        const distA =
          Math.pow(a.position.x - centerX, 2) +
          Math.pow(a.position.y - centerY, 2);
        const distB =
          Math.pow(b.position.x - centerX, 2) +
          Math.pow(b.position.y - centerY, 2);
        return distA - distB;
      });
      allItems = allItems.slice(0, MAX_RENDER_CELLS);
    }

    // Only update state if grid items changed significantly
    // This reduces re-renders during high-frequency scroll events
    // We check length or a sample of indices
    // For now, simpler equality check is skipped for performance, assuming throttle handles it

    // Check if we need to update state
    const isStateUpdateNeeded =
      allItems.length !== this.state.gridItems.length ||
      maxVisibleIndex !== this.state.maxVisibleIndex ||
      this.physics.isDragging !== this.state.isDragging; // Sync dragging state if needed

    if (isStateUpdateNeeded) {
      this.setState(
        {
          gridItems: allItems,
          isMoving:
            Math.abs(this.physics.velocity.x) > 0.01 ||
            Math.abs(this.physics.velocity.y) > 0.01,
          maxVisibleIndex,
        },
        () => {
          // Observe images immediately after state update
          this.observeImages();
        }
      );
    }
  };

  private startPhysicsLoop = () => {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.loop();
  };

  private loop = () => {
    if (!this.isComponentMounted) return;

    // Apply physics
    const { velocity, offset } = this.physics;

    // Friction
    velocity.x *= FRICTION;
    velocity.y *= FRICTION;

    // Stop if velocity is negligible and not dragging
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (speed < 0.01 && !this.physics.isDragging) {
      // Clean stop
      this.physics.velocity = { x: 0, y: 0 };
      // One last render update if needed? handled by debounced update
    } else {
      // Update position
      offset.x += velocity.x;
      offset.y += velocity.y;

      // Direct DOM manipulation for high performance
      if (this.contentRef.current) {
        this.contentRef.current.style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0)`;
      }

      // Schedule React state update (throttled)
      this.debouncedUpdateGridItems();

      // Continue loop
      this.animationFrame = requestAnimationFrame(this.loop);
    }
  };

  private handleDown = (p: Position) => {
    // Resume loop if stopped
    if (!this.animationFrame) {
      this.startPhysicsLoop();
    }

    this.physics.isDragging = true;
    this.physics.startPos = {
      x: p.x - this.physics.offset.x,
      y: p.y - this.physics.offset.y,
    };
    this.physics.velocity = { x: 0, y: 0 };
    this.lastPos = { x: p.x, y: p.y };
    this.physics.lastMoveTime = performance.now();

    // Force restart loop if it was idle
    this.startPhysicsLoop();
  };

  private handleMove = (p: Position) => {
    if (!this.physics.isDragging) return;

    const currentTime = performance.now();
    const timeDelta = currentTime - this.physics.lastMoveTime;

    // Calculate raw velocity based on position and time
    const rawVelocity = {
      x: (p.x - this.lastPos.x) / (timeDelta || 16),
      y: (p.y - this.lastPos.y) / (timeDelta || 16),
    };

    // Add to velocity history and maintain fixed size
    this.physics.velocityHistory.push(rawVelocity);
    if (this.physics.velocityHistory.length > VELOCITY_HISTORY_SIZE) {
      this.physics.velocityHistory.shift();
    }

    // Calculate smoothed velocity using moving average
    const smoothedVelocity = this.physics.velocityHistory.reduce(
      (acc, vel) => ({
        x: acc.x + vel.x / this.physics.velocityHistory.length,
        y: acc.y + vel.y / this.physics.velocityHistory.length,
      }),
      { x: 0, y: 0 }
    );

    this.physics.velocity = smoothedVelocity;
    this.physics.offset = {
      x: p.x - this.physics.startPos.x,
      y: p.y - this.physics.startPos.y,
    };
    this.physics.lastMoveTime = currentTime;

    // Direct update during drag
    if (this.contentRef.current) {
      this.contentRef.current.style.transform = `translate3d(${this.physics.offset.x}px, ${this.physics.offset.y}px, 0)`;
    }

    this.lastPos = { x: p.x, y: p.y };
    this.debouncedUpdateGridItems();
  };

  private handleUp = () => {
    this.physics.isDragging = false;
    // Loop continues to handle momentum
  };

  private handleMouseDown = (e: React.MouseEvent) => {
    this.handleDown({
      x: e.clientX,
      y: e.clientY,
    });
  };

  private handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    this.handleMove({
      x: e.clientX,
      y: e.clientY,
    });
  };

  private handleMouseUp = () => {
    this.handleUp();
  };

  private handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];

    if (!touch) return;

    this.handleDown({
      x: touch.clientX,
      y: touch.clientY,
    });
  };

  private handleTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];

    if (!touch) return;

    e.preventDefault();
    this.handleMove({
      x: touch.clientX,
      y: touch.clientY,
    });
  };

  private handleTouchEnd = () => {
    this.handleUp();
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    // Get the scroll deltas
    const deltaX = e.deltaX;
    const deltaY = e.deltaY;

    this.physics.offset.x -= deltaX;
    this.physics.offset.y -= deltaY;

    // Reset velocity on wheel to avoid conflict
    this.physics.velocity = { x: 0, y: 0 };

    // Direct update
    if (this.contentRef.current) {
      this.contentRef.current.style.transform = `translate3d(${this.physics.offset.x}px, ${this.physics.offset.y}px, 0)`;
    }

    this.debouncedUpdateGridItems();

    // Ensure loop is running to apply any lingering effects if needed (or minimal overhead)
    this.startPhysicsLoop();
  };

  render() {
    // offset is no longer used from state for the main container transform
    // But we use it for initial render or fallback
    const { gridItems, isMoving } = this.state;
    const { className } = this.props;
    const { width: gridWidth, height: gridHeight } = this.getGridSize();

    // Get container dimensions
    const containerRect = this.containerRef.current?.getBoundingClientRect();
    const containerWidth = containerRect?.width || 0;
    const containerHeight = containerRect?.height || 0;

    return (
      <div
        ref={this.containerRef as React.RefObject<HTMLDivElement>}
        className={className}
        style={{
          position: "absolute",
          inset: 0,
          touchAction: "none",
          overflow: "hidden",
          cursor: this.physics?.isDragging ? "grabbing" : "grab",
          zIndex: 0,
        }}
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
        onMouseUp={this.handleMouseUp}
        onMouseLeave={this.handleMouseUp}
        onTouchStart={this.handleTouchStart}
        onTouchEnd={this.handleTouchEnd}
        onTouchCancel={this.handleTouchEnd}
      >
        <div
          ref={this.contentRef as React.RefObject<HTMLDivElement>}
          style={{
            position: "absolute",
            inset: 0,
            // Initial transform, subsequent updates via direct DOM manipulation
            transform: `translate3d(${this.physics.offset.x}px, ${this.physics.offset.y}px, 0)`,
            willChange: "transform",
          }}
        >
          {gridItems.map((item) => {
            const x = item.position.x * gridWidth + containerWidth / 2;
            const y = item.position.y * gridHeight + containerHeight / 2;

            return (
              <div
                key={`${item.position.x}-${item.position.y}`}
                className="js-observe"
                style={{
                  contentVisibility: "auto",
                  containIntrinsicSize: `${gridWidth}px ${gridHeight}px`,
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  userSelect: "none",
                  width: gridWidth,
                  height: gridHeight,
                  transform: `translate3d(${x}px, ${y}px, 0)`,
                  marginLeft: `-${gridWidth / 2}px`,
                  marginTop: `-${gridHeight / 2}px`,
                  willChange: "transform",
                }}
              >
                {typeof this.props.renderItem === "function"
                  ? this.props.renderItem({
                      gridIndex: item.gridIndex,
                      position: item.position,
                      isMoving,
                      // Access items safely without modulo looping
                      item: this.props.items
                        ? this.props.items[item.gridIndex]
                        : undefined,
                    })
                  : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default ThiingsGrid;
