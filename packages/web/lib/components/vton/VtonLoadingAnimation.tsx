"use client";

interface VtonLoadingAnimationProps {
  stage: number;
}

const LOADING_STAGES = [
  { label: "Analyzing your photo", icon: "\u{1F50D}", progress: 10 },
  { label: "Mapping body structure", icon: "\u{1F4D0}", progress: 25 },
  { label: "Fitting first item", icon: "\u{1F455}", progress: 40 },
  { label: "Fitting next item", icon: "\u{1F456}", progress: 60 },
  { label: "Refining details", icon: "\u2728", progress: 80 },
  { label: "Almost there", icon: "\u{1F3A8}", progress: 95 },
];

export function VtonLoadingAnimation({ stage }: VtonLoadingAnimationProps) {
  const current = LOADING_STAGES[Math.min(stage, LOADING_STAGES.length - 1)];

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-xl">
      <div className="relative mb-8 h-32 w-32">
        <div
          className="absolute inset-0 rounded-full border-2 border-[#eafd67]/20"
          style={{ animation: "vton-spin 3s linear infinite" }}
        />
        <div
          className="absolute inset-2 rounded-full border-2 border-[#eafd67]/40"
          style={{ animation: "vton-spin 2s linear infinite reverse" }}
        />
        <div
          className="absolute inset-4 rounded-full border-t-2 border-[#eafd67]"
          style={{ animation: "vton-spin 1s linear infinite" }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          {current.icon}
        </div>
      </div>
      <p
        className="mb-4 text-lg font-medium text-white transition-opacity duration-500"
        key={stage}
      >
        {current.label}
      </p>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#eafd67] transition-all duration-1000 ease-out"
          style={{ width: `${current.progress}%` }}
        />
      </div>
      <p className="mt-6 text-xs text-white/40">
        You can close this modal — we&apos;ll notify you when it&apos;s ready
      </p>
      <style jsx>{`
        @keyframes vton-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
