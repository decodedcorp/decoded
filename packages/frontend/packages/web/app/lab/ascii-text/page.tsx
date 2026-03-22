"use client";

import { useState } from "react";
import ASCIIText from "@/lib/components/ASCIIText";
import Link from "next/link";

export default function ASCIITextPage() {
  const [text, setText] = useState("DECODED");
  const [asciiFontSize, setAsciiFontSize] = useState(8);
  const [textFontSize, setTextFontSize] = useState(200);
  const [enableWaves, setEnableWaves] = useState(true);
  const [textColor, setTextColor] = useState("#fdf9f3");

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between">
        <Link
          href="/lab"
          className="px-4 py-2 rounded border border-zinc-600 bg-zinc-800 hover:border-[#d9fc69]/50 transition-colors"
        >
          ← Back to Lab
        </Link>
        <h1 className="text-xl font-semibold">ASCII Text Animation</h1>
      </div>

      {/* ASCII Text Container */}
      <div className="w-full h-screen relative">
        <ASCIIText
          text={text}
          asciiFontSize={asciiFontSize}
          textFontSize={textFontSize}
          textColor={textColor}
          enableWaves={enableWaves}
          planeBaseHeight={8}
        />
      </div>

      {/* Controls Panel */}
      <div className="absolute bottom-0 left-0 right-0 z-50 p-6 bg-black/80 backdrop-blur-sm border-t border-zinc-800">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Text</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white focus:outline-none focus:border-[#d9fc69]"
                placeholder="Enter text..."
              />
            </div>

            {/* ASCII Font Size */}
            <div>
              <label className="block text-sm font-medium mb-2">
                ASCII Font Size: {asciiFontSize}
              </label>
              <input
                type="range"
                min="4"
                max="16"
                value={asciiFontSize}
                onChange={(e) => setAsciiFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Text Font Size */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Text Font Size: {textFontSize}
              </label>
              <input
                type="range"
                min="100"
                max="400"
                step="10"
                value={textFontSize}
                onChange={(e) => setTextFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Text Color
              </label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Toggle Waves */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableWaves"
              checked={enableWaves}
              onChange={(e) => setEnableWaves(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#d9fc69] focus:ring-[#d9fc69]"
            />
            <label
              htmlFor="enableWaves"
              className="text-sm font-medium cursor-pointer"
            >
              Enable Waves Animation
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
