"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { prepare, layout } from "@chenglou/pretext";

const vertexShader = `
varying vec2 vUv;
uniform float uTime;
uniform float mouse;
uniform float uEnableWaves;

void main() {
    vUv = uv;
    float time = uTime * 5.;

    float waveFactor = uEnableWaves;

    vec3 transformed = position;

    transformed.x += sin(time + position.y) * 0.5 * waveFactor;
    transformed.y += cos(time + position.z) * 0.15 * waveFactor;
    transformed.z += sin(time + position.x) * waveFactor;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float uTime;
uniform sampler2D uTexture;

void main() {
    float time = uTime;
    vec2 pos = vUv;

    float r = texture2D(uTexture, pos + cos(time + pos.x) * .01).r;
    float g = texture2D(uTexture, pos + sin(pos.x - time * .5) * .01).g;
    float b = texture2D(uTexture, pos - cos(time + pos.y) * .01).b;
    float a = texture2D(uTexture, pos).a;
    gl_FragColor = vec4(r, g, b, a);
}
`;

function map(
  n: number,
  start: number,
  stop: number,
  start2: number,
  stop2: number
) {
  return ((n - start) / (stop - start)) * (stop2 - start2) + start2;
}

const PX_RATIO = typeof window !== "undefined" ? window.devicePixelRatio : 1;

interface AsciiFilterOptions {
  fontSize?: number;
  fontFamily?: string;
  charset?: string;
  invert?: boolean;
  enableHueRotate?: boolean;
}

class AsciiFilter {
  renderer: THREE.WebGLRenderer;
  domElement: HTMLDivElement;
  pre: HTMLPreElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  deg: number;
  invert: boolean;
  fontSize: number;
  fontFamily: string;
  charset: string;
  enableHueRotate: boolean;
  width: number = 0;
  height: number = 0;
  center: { x: number; y: number } = { x: 0, y: 0 };
  mouse: { x: number; y: number } = { x: 0, y: 0 };
  cols: number = 0;
  rows: number = 0;

  constructor(
    renderer: THREE.WebGLRenderer,
    {
      fontSize,
      fontFamily,
      charset,
      invert,
      enableHueRotate,
    }: AsciiFilterOptions = {}
  ) {
    this.renderer = renderer;
    this.domElement = document.createElement("div");
    this.domElement.style.position = "absolute";
    this.domElement.style.top = "0";
    this.domElement.style.left = "0";
    this.domElement.style.width = "100%";
    this.domElement.style.height = "100%";

    this.pre = document.createElement("pre");
    this.domElement.appendChild(this.pre);

    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    this.domElement.appendChild(this.canvas);

    this.deg = 0;
    this.invert = invert ?? true;
    this.fontSize = fontSize ?? 12;
    this.fontFamily = fontFamily ?? "'Courier New', monospace";
    this.charset =
      charset ??
      " .'`^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
    this.enableHueRotate = enableHueRotate ?? false;

    if (this.context) {
      this.context.imageSmoothingEnabled = false;
      this.context.imageSmoothingEnabled = false;
    }

    this.onMouseMove = this.onMouseMove.bind(this);
    document.addEventListener("mousemove", this.onMouseMove);
  }

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height);
    this.reset();

    this.center = { x: width / 2, y: height / 2 };
    this.mouse = { x: this.center.x, y: this.center.y };
  }

  resetCallCount = 0;

  reset() {
    if (this.context) {
      this.resetCallCount++;
      this.context.font = `${this.fontSize}px ${this.fontFamily}`;
      const charWidth = this.context.measureText("A").width;

      const prevCols = this.cols;
      this.cols = Math.floor(
        this.width / (this.fontSize * (charWidth / this.fontSize))
      );
      this.rows = Math.floor(this.height / this.fontSize);

      this.canvas.width = this.cols;
      this.canvas.height = this.rows;
      this.pre.style.fontFamily = this.fontFamily;
      this.pre.style.fontSize = `${this.fontSize}px`;
      this.pre.style.margin = "0";
      this.pre.style.padding = "0";
      this.pre.style.lineHeight = "1em";
      this.pre.style.position = "absolute";
      this.pre.style.left = "0";
      this.pre.style.top = "0";
      this.pre.style.transform = "none";
      this.pre.style.zIndex = "9";
      this.pre.style.backgroundAttachment = "fixed";
      this.pre.style.mixBlendMode = "difference";
      this.pre.style.overflow = "hidden";
      this.pre.style.width = "100%";
      this.pre.style.height = "100%";
    }
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.render(scene, camera);

    const w = this.canvas.width;
    const h = this.canvas.height;
    if (this.context) {
      this.context.clearRect(0, 0, w, h);
      if (this.context && w && h) {
        this.context.drawImage(this.renderer.domElement, 0, 0, w, h);
      }

      this.asciify(this.context, w, h);
      if (this.enableHueRotate) {
        this.hue();
      }
    }
  }

  onMouseMove(e: MouseEvent) {
    this.mouse = { x: e.clientX * PX_RATIO, y: e.clientY * PX_RATIO };
  }

  get dx() {
    return this.mouse.x - this.center.x;
  }

  get dy() {
    return this.mouse.y - this.center.y;
  }

  hue() {
    const deg = (Math.atan2(this.dy, this.dx) * 180) / Math.PI;
    this.deg += (deg - this.deg) * 0.075;
    this.domElement.style.filter = `hue-rotate(${this.deg.toFixed(1)}deg)`;
  }

  asciify(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (w && h) {
      const imgData = ctx.getImageData(0, 0, w, h).data;
      let str = "";
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = x * 4 + y * 4 * w;
          const [r, g, b, a] = [
            imgData[i],
            imgData[i + 1],
            imgData[i + 2],
            imgData[i + 3],
          ];

          if (a === 0) {
            str += " ";
            continue;
          }

          const gray = (0.3 * r + 0.6 * g + 0.1 * b) / 255;
          let idx = Math.floor((1 - gray) * (this.charset.length - 1));
          if (this.invert) idx = this.charset.length - idx - 1;
          str += this.charset[idx];
        }
        str += "\n";
      }
      this.pre.innerHTML = str;
    }
  }

  dispose() {
    document.removeEventListener("mousemove", this.onMouseMove);
  }
}

interface CanvasTxtOptions {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

class CanvasTxt {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  txt: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  font: string;

  constructor(
    txt: string,
    {
      fontSize = 200,
      fontFamily = "Arial",
      color = "#fdf9f3",
    }: CanvasTxtOptions = {}
  ) {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    this.txt = txt;
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;
    this.color = color;

    this.font = `600 ${this.fontSize}px ${this.fontFamily}`;
  }

  resize() {
    if (this.context) {
      this.context.font = this.font;
      const metrics = this.context.measureText(this.txt);

      // Use measureText width + 2px buffer for sub-pixel rounding safety
      const textWidth = Math.ceil(metrics.width) + 22;

      // Use pretext for accurate cross-browser height measurement
      const handle = prepare(this.txt, this.font);
      const { height: pretextHeight } = layout(handle, Infinity, this.fontSize);
      const textHeight = Math.ceil(pretextHeight) + 20;

      this.canvas.width = textWidth;
      this.canvas.height = textHeight;
    }
  }

  render() {
    if (this.context) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.fillStyle = this.color;
      this.context.font = this.font;

      // Use pretext-measured height for consistent cross-browser vertical positioning
      const handle = prepare(this.txt, this.font);
      const { height } = layout(handle, Infinity, this.fontSize);
      const yPos = height - 10;

      this.context.fillText(this.txt, 10, yPos);
    }
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  get texture() {
    return this.canvas;
  }
}

interface CanvAsciiOptions {
  text: string;
  asciiFontSize: number;
  textFontSize: number;
  textColor: string;
  planeBaseHeight: number;
  enableWaves: boolean;
  enableHueRotate: boolean;
  enableMouseInteraction: boolean;
}

class CanvAscii {
  textString: string;
  asciiFontSize: number;
  textFontSize: number;
  textColor: string;
  planeBaseHeight: number;
  container: HTMLElement;
  width: number;
  height: number;
  enableWaves: boolean;
  enableHueRotate: boolean;
  enableMouseInteraction: boolean;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  mouse: { x: number; y: number };
  textCanvas!: CanvasTxt;
  texture!: THREE.CanvasTexture;
  geometry!: THREE.PlaneGeometry;
  material!: THREE.ShaderMaterial;
  mesh!: THREE.Mesh;
  renderer!: THREE.WebGLRenderer;
  filter!: AsciiFilter;
  center!: { x: number; y: number };
  animationFrameId: number = 0;
  private isDisposed: boolean = false;

  constructor(
    {
      text,
      asciiFontSize,
      textFontSize,
      textColor,
      planeBaseHeight,
      enableWaves,
      enableHueRotate,
      enableMouseInteraction,
    }: CanvAsciiOptions,
    containerElem: HTMLElement,
    width: number,
    height: number
  ) {
    this.textString = text;
    this.asciiFontSize = asciiFontSize;
    this.textFontSize = textFontSize;
    this.textColor = textColor;
    this.planeBaseHeight = planeBaseHeight;
    this.container = containerElem;
    this.width = width;
    this.height = height;
    this.enableWaves = enableWaves;
    this.enableHueRotate = enableHueRotate;
    this.enableMouseInteraction = enableMouseInteraction;

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      1,
      1000
    );
    this.camera.position.z = 30;

    this.scene = new THREE.Scene();
    this.mouse = { x: 0, y: 0 };

    this.onMouseMove = this.onMouseMove.bind(this);
  }

  async init(): Promise<boolean> {
    // Wait for font to be loaded before measuring text
    await document.fonts.ready;

    if (this.isDisposed) return false;

    this.setMesh();
    return this.setRenderer();
  }

  setMesh() {
    this.textCanvas = new CanvasTxt(this.textString, {
      fontSize: this.textFontSize,
      fontFamily: "IBM Plex Mono",
      color: this.textColor,
    });
    this.textCanvas.resize();
    this.textCanvas.render();

    this.texture = new THREE.CanvasTexture(this.textCanvas.texture);
    this.texture.minFilter = THREE.NearestFilter;

    const textAspect = this.textCanvas.width / this.textCanvas.height;
    const baseH = this.planeBaseHeight;
    const planeW = baseH * textAspect;
    const planeH = baseH;

    this.geometry = new THREE.PlaneGeometry(planeW, planeH, 36, 36);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: this.texture },
        uEnableWaves: { value: this.enableWaves ? 1.0 : 0.0 },
      },
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  setRenderer(): boolean {
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    } catch {
      // WebGL not available — skip rendering silently
      return false;
    }
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, 0);

    this.filter = new AsciiFilter(this.renderer, {
      fontFamily: "IBM Plex Mono",
      fontSize: this.asciiFontSize,
      invert: true,
      enableHueRotate: this.enableHueRotate,
    });

    this.container.appendChild(this.filter.domElement);
    this.setSize(this.width, this.height);

    if (this.enableMouseInteraction) {
      this.container.addEventListener("mousemove", this.onMouseMove);
      this.container.addEventListener("touchmove", this.onMouseMove);
    }
    return true;
  }

  setSize(w: number, h: number) {
    this.width = w;
    this.height = h;

    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }

    if (this.filter) {
      this.filter.setSize(w, h);
    }

    this.center = { x: w / 2, y: h / 2 };
  }

  async load() {
    const ok = await this.init();
    if (!ok || this.isDisposed) return;
    this.animate();
  }

  onMouseMove(evt: MouseEvent | TouchEvent) {
    const e = (evt as TouchEvent).touches
      ? (evt as TouchEvent).touches[0]
      : (evt as MouseEvent);
    const bounds = this.container.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    this.mouse = { x, y };
  }

  animate() {
    const animateFrame = () => {
      this.animationFrameId = requestAnimationFrame(animateFrame);
      this.render();
    };
    animateFrame();
  }

  render() {
    if (this.isDisposed || !this.textCanvas || !this.filter || !this.mesh)
      return;

    const time = new Date().getTime() * 0.001;

    this.textCanvas.render();
    if (this.texture) {
      this.texture.needsUpdate = true;
    }

    if (this.mesh.material) {
      (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value =
        Math.sin(time);
    }

    if (this.enableMouseInteraction) {
      this.updateRotation();
    }
    this.filter.render(this.scene, this.camera);
  }

  updateRotation() {
    const x = map(this.mouse.y, 0, this.height, 0.5, -0.5);
    const y = map(this.mouse.x, 0, this.width, -0.5, 0.5);

    this.mesh.rotation.x += (x - this.mesh.rotation.x) * 0.05;
    this.mesh.rotation.y += (y - this.mesh.rotation.y) * 0.05;
  }

  clear() {
    this.scene.traverse((object) => {
      const obj = object as unknown as THREE.Mesh;
      if (!obj.isMesh) return;
      [obj.material].flat().forEach((material) => {
        material.dispose();
        Object.keys(material).forEach((key) => {
          const matProp = material[key as keyof typeof material];
          if (
            matProp &&
            typeof matProp === "object" &&
            "dispose" in matProp &&
            typeof matProp.dispose === "function"
          ) {
            matProp.dispose();
          }
        });
      });
      obj.geometry.dispose();
    });
    this.scene.clear();
  }

  dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.animationFrameId);

    if (this.filter) {
      this.filter.dispose();
      if (
        this.filter.domElement &&
        this.container.contains(this.filter.domElement)
      ) {
        this.container.removeChild(this.filter.domElement);
      }
    }

    if (this.enableMouseInteraction) {
      this.container.removeEventListener("mousemove", this.onMouseMove);
      this.container.removeEventListener("touchmove", this.onMouseMove);
    }

    this.clear();

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

interface DecodedLogoProps {
  text?: string;
  textColor?: string;
  asciiFontSize?: number;
  textFontSize?: number;
  planeBaseHeight?: number;
  enableWaves?: boolean;
  enableHueRotate?: boolean;
  enableMouseInteraction?: boolean;
}

export default function DecodedLogo({
  text = "decoded",
  textColor = "#d9fc69",
  asciiFontSize = 8,
  textFontSize = 200,
  planeBaseHeight = 8,
  enableWaves = true,
  enableHueRotate = false,
  enableMouseInteraction = false,
}: DecodedLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const asciiRef = useRef<CanvAscii | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up any existing instance first
    if (asciiRef.current) {
      asciiRef.current.dispose();
      asciiRef.current = null;
    }
    // Also clear container children to ensure clean state
    while (containerRef.current.firstChild) {
      if (containerRef.current.firstChild.nodeName !== "STYLE") {
        containerRef.current.removeChild(containerRef.current.firstChild);
      } else {
        break;
      }
    }

    const disposed = false;

    const { width, height } = containerRef.current.getBoundingClientRect();

    if (width === 0 || height === 0) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (
            entry.isIntersecting &&
            entry.boundingClientRect.width > 0 &&
            entry.boundingClientRect.height > 0
          ) {
            const { width: w, height: h } = entry.boundingClientRect;

            asciiRef.current = new CanvAscii(
              {
                text,
                asciiFontSize,
                textFontSize,
                textColor,
                planeBaseHeight,
                enableWaves,
                enableHueRotate,
                enableMouseInteraction,
              },
              containerRef.current!,
              w,
              h
            );
            asciiRef.current.load();

            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(containerRef.current);

      return () => {
        observer.disconnect();
        if (asciiRef.current) {
          asciiRef.current.dispose();
        }
      };
    }

    asciiRef.current = new CanvAscii(
      {
        text,
        asciiFontSize,
        textFontSize,
        textColor,
        planeBaseHeight,
        enableWaves,
        enableHueRotate,
        enableMouseInteraction,
      },
      containerRef.current,
      width,
      height
    );
    asciiRef.current.load();

    const ro = new ResizeObserver((entries) => {
      if (!entries[0] || !asciiRef.current) return;
      const { width: w, height: h } = entries[0].contentRect;

      if (w > 0 && h > 0) {
        asciiRef.current.setSize(w, h);
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (asciiRef.current) {
        asciiRef.current.dispose();
      }
    };
  }, [
    text,
    textColor,
    asciiFontSize,
    textFontSize,
    planeBaseHeight,
    enableWaves,
    enableHueRotate,
    enableMouseInteraction,
  ]);

  return (
    <div
      ref={containerRef}
      className="decoded-logo-container"
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&display=swap');

        body {
          margin: 0;
          padding: 0;
        }

        .decoded-logo-container canvas {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          image-rendering: optimizeSpeed;
          image-rendering: -moz-crisp-edges;
          image-rendering: -o-crisp-edges;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: optimize-contrast;
          image-rendering: crisp-edges;
          image-rendering: pixelated;
        }

        .decoded-logo-container pre {
          margin: 0;
          user-select: none;
          padding: 0;
          line-height: 1em;
          text-align: left;
          position: absolute;
          left: 0;
          top: 0;
          overflow: hidden;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(circle, #d9fc69 0%, #b8d855 50%, #9ab842 100%);
          background-attachment: fixed;
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          z-index: 9;
          mix-blend-mode: difference;
        }
      `}</style>
    </div>
  );
}
