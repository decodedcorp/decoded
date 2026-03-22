"use client";

import { useState } from "react";
import Image from "next/image";

const SAMPLES = [
  { id: "00", label: "BLACKPINK Rosé" },
  { id: "01", label: "BLACKPINK" },
  { id: "02", label: "NewJeans" },
  { id: "03", label: "Celebrity" },
];

const STEPS = [
  { file: "00_original.png", label: "Original", desc: "원본 이미지" },
  {
    file: "01_transparent.png",
    label: "Transparent",
    desc: "Gemini → 배경 제거 (1회 API 호출)",
  },
  {
    file: "02_neon_glow.png",
    label: "Neon Glow",
    desc: "네온 윤곽선 글로우 효과",
  },
];

export default function NeonGlowLab() {
  const [sampleIdx, setSampleIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(2);
  const [showOverlay, setShowOverlay] = useState(false);
  const [glowColor, setGlowColor] = useState("#eafd67");

  const sample = SAMPLES[sampleIdx];
  const step = STEPS[stepIdx];
  const basePath = `/lab-assets/neon-test/${sample.id}`;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Neon Glow Lab</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Nano Banana Pro 2 — Gemini 3.1 Flash → Background Removal → Neon Edge
          Glow
        </p>

        {/* Sample Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {SAMPLES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSampleIdx(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-all ${
                sampleIdx === i
                  ? "bg-[#eafd67] text-black font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Main Preview */}
        <div className="relative aspect-square max-w-lg mx-auto mb-6 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
          <Image
            src={`${basePath}/${step.file}`}
            alt={step.label}
            fill
            className="object-contain"
            unoptimized
          />

          {/* CSS glow overlay on transparent image */}
          {showOverlay && stepIdx === 1 && (
            <div className="absolute inset-0">
              <Image
                src={`${basePath}/01_transparent.png`}
                alt="CSS Glow"
                fill
                className="object-contain"
                style={{
                  filter: `drop-shadow(0 0 6px ${glowColor}) drop-shadow(0 0 15px ${glowColor}) drop-shadow(0 0 30px ${glowColor})`,
                }}
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Step Selector */}
        <div className="flex gap-2 mb-4">
          {STEPS.map((s, i) => (
            <button
              key={s.file}
              onClick={() => setStepIdx(i)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm transition-all ${
                stepIdx === i
                  ? "bg-white text-black font-medium"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="bg-zinc-900 rounded-xl p-4 mb-4">
          <div className="text-sm text-zinc-400">
            Step {stepIdx + 1}/{STEPS.length}: {step.desc}
          </div>
        </div>

        {/* CSS Glow Toggle (only on transparent step) */}
        {stepIdx === 1 && (
          <div className="bg-zinc-900 rounded-xl p-4 mb-4 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOverlay}
                onChange={(e) => setShowOverlay(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">CSS drop-shadow 글로우</span>
            </label>
            <input
              type="color"
              value={glowColor}
              onChange={(e) => setGlowColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent"
            />
            <span className="text-xs text-zinc-500">{glowColor}</span>
          </div>
        )}

        {/* Thumbnail Grid — 3 steps */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {STEPS.map((s, i) => (
            <button
              key={s.file}
              onClick={() => setStepIdx(i)}
              className={`aspect-square relative rounded-lg overflow-hidden border-2 transition-all ${
                stepIdx === i
                  ? "border-white"
                  : "border-zinc-800 hover:border-zinc-600"
              } ${i >= 1 ? "bg-zinc-950" : "bg-zinc-900"}`}
            >
              <Image
                src={`${basePath}/${s.file}`}
                alt={s.label}
                fill
                className="object-contain p-1"
                unoptimized
              />
              <span className="absolute bottom-1 left-1 right-1 text-[10px] text-zinc-400 text-center truncate">
                {s.label}
              </span>
            </button>
          ))}
        </div>

        {/* All Samples Grid */}
        <h2 className="text-lg font-semibold mb-4">All Results</h2>
        <div className="grid grid-cols-4 gap-4">
          {SAMPLES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                setSampleIdx(i);
                setStepIdx(2);
              }}
              className={`rounded-xl overflow-hidden border-2 transition-all ${
                sampleIdx === i
                  ? "border-[#eafd67]"
                  : "border-zinc-800 hover:border-zinc-600"
              }`}
            >
              <div className="aspect-square relative bg-zinc-950">
                <Image
                  src={`/lab-assets/neon-test/${s.id}/02_neon_glow.png`}
                  alt={s.label}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="p-2 bg-zinc-900 text-xs text-zinc-400 text-center">
                {s.label}
              </div>
            </button>
          ))}
        </div>

        {/* Pipeline Info */}
        <div className="mt-8 text-xs text-zinc-600 space-y-1">
          <p>Pipeline: Image → Gemini (transparent bg) → Neon Edge Glow</p>
          <p>
            Model: gemini-3.1-flash-image-preview | Cost: ~$0.07/image (1 API
            call)
          </p>
        </div>
      </div>
    </div>
  );
}
