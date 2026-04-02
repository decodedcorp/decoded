"use client";

import React, { Component } from "react";
import { ThiingsGridPhysics } from "./ThiingsGridPhysics";
import {
  type ObserverState,
  initializeIntersectionObserver,
  initializeImageObserver,
  observeCardElements,
  observeImages,
} from "./ThiingsGridObservers";

const VIEWPORT_BUFFER = 1.2;
const MAX_RENDER_CELLS = 300;

// --- Exported types (consumed by ExploreClient, PostBadge, ExploreCardCell) ---

export type Position = { x: number; y: number };
export type PostSource = "post" | "legacy";

export type GridItem = {
  id: string;
  imageUrl?: string | null;
  status?: "pending" | "extracted" | "skipped" | string;
  hasItems?: boolean;
  postId: string;
  postSource: PostSource;
  postAccount: string;
  postCreatedAt: string;
  editorialTitle?: string | null;
  spotCount?: number;
};

type GridItemInternal = { position: Position; gridIndex: number };

export type ItemConfig = {
  isMoving: boolean;
  position: Position;
  gridIndex: number;
  item?: GridItem;
};

export type ThiingsGridProps = {
  gridSize: number | { width: number; height: number };
  renderItem: (itemConfig: ItemConfig) => React.ReactNode;
  className?: string;
  initialPosition?: Position;
  items?: GridItem[];
  onReachEnd?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
};

type State = {
  gridItems: GridItemInternal[];
  isMoving: boolean;
  maxVisibleIndex: number;
  isDragging: boolean;
};

class ThiingsGrid extends Component<ThiingsGridProps, State> {
  private containerRef: React.RefObject<HTMLElement | null>;
  private contentRef: React.RefObject<HTMLDivElement | null>;
  private physicsEngine: ThiingsGridPhysics;
  private intersectionObserver: IntersectionObserver | null = null;
  private imageObserver: IntersectionObserver | null = null;
  private imageObserverRef = { current: null as IntersectionObserver | null };
  private resizeObserver: ResizeObserver | null = null;
  private observerState: ObserverState;

  constructor(props: ThiingsGridProps) {
    super(props);
    this.state = { gridItems: [], isMoving: false, maxVisibleIndex: 0, isDragging: false };
    this.containerRef = React.createRef();
    this.contentRef = React.createRef();
    this.observerState = {
      staggerPositionCache: new WeakMap(),
      staggerDelayMap: new WeakMap(),
      staggerTick: 0,
    };
    this.physicsEngine = new ThiingsGridPhysics(
      props.initialPosition ?? { x: 0, y: 0 },
      {
        onStateUpdate: this.updateGridItems,
        onReachEnd: props.onReachEnd,
        getHasMore: () => this.props.hasMore,
        getIsLoadingMore: () => this.props.isLoadingMore,
        getItemCount: () => this.props.items?.length ?? 0,
        getMaxVisibleIndex: () => this.state.maxVisibleIndex,
      },
      this.contentRef
    );
  }

  componentDidMount() {
    this.physicsEngine.isComponentMounted = true;
    this.physicsEngine.start();
    this.updateGridItems();

    this.intersectionObserver = initializeIntersectionObserver(this.observerState);
    this.imageObserver = initializeImageObserver(this.imageObserverRef);
    this.imageObserverRef.current = this.imageObserver;

    const container = this.containerRef.current as HTMLElement | null;
    observeCardElements(container, this.intersectionObserver);
    observeImages(container, this.imageObserver);

    if (container) {
      // passive:false required so handlers can call preventDefault()
      container.addEventListener("wheel", this.handleWheel, { passive: false });
      container.addEventListener("touchmove", this.handleTouchMove, { passive: false });
    }

    // Recalculate grid when container resizes (e.g., TrendingArtistsSection loads and shifts layout)
    if (typeof ResizeObserver !== "undefined" && container) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateGridItems();
      });
      this.resizeObserver.observe(container);
    }
  }

  componentDidUpdate(prevProps: ThiingsGridProps, prevState: State) {
    if (prevProps.onReachEnd !== this.props.onReachEnd) {
      (this.physicsEngine as unknown as { callbacks: { onReachEnd?: () => void } })
        .callbacks.onReachEnd = this.props.onReachEnd;
    }
    if (prevProps.items !== this.props.items) this.updateGridItems();
    if (
      prevState.maxVisibleIndex !== this.state.maxVisibleIndex ||
      prevProps.items?.length !== this.props.items?.length
    ) {
      this.physicsEngine.checkInfiniteScroll(this.state.maxVisibleIndex);
    }
    const container = this.containerRef.current as HTMLElement | null;
    observeCardElements(container, this.intersectionObserver);
    observeImages(container, this.imageObserver);
  }

  componentWillUnmount() {
    this.physicsEngine.destroy();
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.imageObserver?.disconnect();
    this.imageObserver = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    const container = this.containerRef.current;
    if (container) {
      container.removeEventListener("wheel", this.handleWheel);
      container.removeEventListener("touchmove", this.handleTouchMove);
    }
  }

  public publicGetCurrentPosition = () => this.physicsEngine.offset;

  private getGridSize = () => {
    const { gridSize } = this.props;
    return typeof gridSize === "number" ? { width: gridSize, height: gridSize } : gridSize;
  };

  private updateGridItems = () => {
    if (!this.physicsEngine.isComponentMounted || !this.containerRef.current) return;
    const { width: gw, height: gh } = this.getGridSize();
    const { items: allItems, maxVisibleIndex } = this.physicsEngine.calculateGridItems(
      this.containerRef.current as HTMLElement,
      gw, gh, VIEWPORT_BUFFER, MAX_RENDER_CELLS,
      this.props.items?.length,
      this.props.hasMore
    );
    const needsUpdate =
      allItems.length !== this.state.gridItems.length ||
      maxVisibleIndex !== this.state.maxVisibleIndex ||
      this.physicsEngine.isDragging !== this.state.isDragging;
    if (needsUpdate) {
      this.setState(
        {
          gridItems: allItems,
          isMoving: Math.abs(this.physicsEngine.velocity.x) > 0.01 || Math.abs(this.physicsEngine.velocity.y) > 0.01,
          maxVisibleIndex,
          isDragging: this.physicsEngine.isDragging,
        },
        () => observeImages(this.containerRef.current as HTMLElement | null, this.imageObserver)
      );
    }
  };

  // --- Event handler bridges ---

  private handleMouseDown = (e: React.MouseEvent) =>
    this.physicsEngine.handleDown({ x: e.clientX, y: e.clientY });

  private handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    this.physicsEngine.handleMove({ x: e.clientX, y: e.clientY });
  };

  private handleMouseUp = () => this.physicsEngine.handleUp();

  private handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) this.physicsEngine.handleDown({ x: t.clientX, y: t.clientY });
  };

  private handleTouchMove = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    e.preventDefault();
    this.physicsEngine.handleMove({ x: t.clientX, y: t.clientY });
  };

  private handleTouchEnd = () => this.physicsEngine.handleUp();

  private handleWheel = (e: WheelEvent) => this.physicsEngine.handleWheel(e);

  render() {
    const { gridItems, isMoving } = this.state;
    const { className } = this.props;
    const { width: gw, height: gh } = this.getGridSize();
    const rect = this.containerRef.current?.getBoundingClientRect();
    const cw = rect?.width ?? 0;
    const ch = rect?.height ?? 0;

    return (
      <div
        ref={this.containerRef as React.RefObject<HTMLDivElement>}
        data-testid="thiings-grid"
        className={className}
        style={{ position: "absolute", inset: 0, touchAction: "none", overflow: "hidden", cursor: this.physicsEngine?.isDragging ? "grabbing" : "grab", zIndex: 0 }}
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
            transform: `translate3d(${this.physicsEngine.offset.x}px, ${this.physicsEngine.offset.y}px, 0)`,
            willChange: "transform",
          }}
        >
          {gridItems.map((item) => (
            <div
              key={`${item.position.x}-${item.position.y}`}
              data-testid="thiings-grid-item"
              className="js-observe"
              style={{
                contentVisibility: "auto",
                containIntrinsicSize: `${gw}px ${gh}px`,
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
                width: gw,
                height: gh,
                transform: `translate3d(${item.position.x * gw + cw / 2}px, ${item.position.y * gh + ch / 2}px, 0)`,
                marginLeft: `-${gw / 2}px`,
                marginTop: `-${gh / 2}px`,
                willChange: "transform",
              }}
            >
              {typeof this.props.renderItem === "function"
                ? this.props.renderItem({
                    gridIndex: item.gridIndex,
                    position: item.position,
                    isMoving,
                    item: this.props.items?.[item.gridIndex],
                  })
                : null}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default ThiingsGrid;
