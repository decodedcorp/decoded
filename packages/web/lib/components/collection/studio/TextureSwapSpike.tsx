"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { Application } from "@splinetool/runtime";

const Spline = dynamic(
  () => import("@splinetool/react-spline").then((mod) => mod.default),
  { ssr: false }
);

const SCENE_URL =
  "https://prod.spline.design/o9G6bAmpXYYxRQxh/scene.splinecode";

const TEST_IMAGES = [
  "https://picsum.photos/seed/spike-1/512/512",
  "https://picsum.photos/seed/spike-2/512/512",
  "https://picsum.photos/seed/spike-3/512/512",
];

interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "error";
}

/**
 * Spike test component for validating Spline texture swap via material.layers API.
 * Mount at /lab/texture-swap or similar route for isolated testing.
 *
 * Tests 3 approaches in order:
 * 1. material.layers[].image.data (documented approach)
 * 2. material.layers[].image = { data, name } (object assignment)
 * 3. setVariable fallback (if variables exist in scene)
 */
export function TextureSwapSpike() {
  const [app, setApp] = useState<Application | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [objectNames, setObjectNames] = useState<string[]>([]);

  const log = useCallback(
    (message: string, type: LogEntry["type"] = "info") => {
      setLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), message, type },
      ]);
    },
    []
  );

  const handleLoad = useCallback(
    (splineApp: Application) => {
      setApp(splineApp);
      log("Scene loaded successfully", "success");

      // Enumerate all objects to find magazine-like objects
      try {
        const allObjects =
          (splineApp as unknown as { _scene?: { children?: unknown[] } })._scene
            ?.children || [];
        const names: string[] = [];

        function walk(obj: unknown, depth = 0) {
          const o = obj as { name?: string; children?: unknown[] };
          if (o.name) names.push("  ".repeat(depth) + o.name);
          if (o.children)
            o.children.forEach((c: unknown) => walk(c, depth + 1));
        }

        allObjects.forEach((obj: unknown) => walk(obj));
        setObjectNames(names);
        log(`Found ${names.length} objects in scene`, "info");
      } catch (err) {
        log(`Object enumeration failed: ${err}`, "error");
      }
    },
    [log]
  );

  const testFindObject = useCallback(
    (objectName: string) => {
      if (!app) return;
      try {
        const obj = app.findObjectByName(objectName);
        if (obj) {
          log(
            `Found "${objectName}" at (${obj.position.x.toFixed(1)}, ${obj.position.y.toFixed(1)}, ${obj.position.z.toFixed(1)})`,
            "success"
          );

          // Inspect material
          const mat = (
            obj as unknown as {
              material?: {
                layers?: {
                  type?: string;
                  image?: { data?: unknown; name?: string };
                }[];
              };
            }
          ).material;
          if (mat) {
            log(
              `  Material found. Layers: ${mat.layers?.length ?? "none"}`,
              "info"
            );
            mat.layers?.forEach(
              (
                layer: {
                  type?: string;
                  image?: { data?: unknown; name?: string };
                },
                i: number
              ) => {
                const hasImage = layer.image !== undefined;
                log(
                  `  Layer[${i}]: type=${layer.type ?? "?"}, hasImage=${hasImage}`,
                  "info"
                );
                if (hasImage) {
                  log(
                    `    image.data type: ${typeof layer.image?.data}`,
                    "info"
                  );
                  log(`    image.name: ${layer.image?.name ?? "none"}`, "info");
                }
              }
            );
          } else {
            log(`  No material on object`, "error");
          }
        } else {
          log(`Object "${objectName}" not found`, "error");
        }
      } catch (err) {
        log(`findObjectByName error: ${err}`, "error");
      }
    },
    [app, log]
  );

  const testTextureSwap = useCallback(
    (objectName: string, imageUrl: string) => {
      if (!app) return;
      try {
        const obj = app.findObjectByName(objectName);
        if (!obj) {
          log(`Object "${objectName}" not found`, "error");
          return;
        }

        const mat = (
          obj as unknown as {
            material?: {
              layers?: { image?: { data?: unknown; name?: string } }[];
            };
          }
        ).material;
        if (!mat?.layers) {
          log(`No material layers on "${objectName}"`, "error");
          return;
        }

        // Approach 1: Find texture layer and set image.data
        const texLayer = mat.layers.find(
          (layer: { image?: { data?: unknown; name?: string } }) =>
            layer.image !== undefined
        );
        if (!texLayer) {
          log(`No texture layer found on "${objectName}"`, "error");
          return;
        }

        log(`Attempting texture swap on "${objectName}"...`, "info");
        log(`  Before: image.data = ${typeof texLayer.image?.data}`, "info");

        // Try direct data assignment
        texLayer.image = { data: imageUrl, name: "cover-test" };
        app.requestRender();

        log(
          `Texture swap attempted (object assignment). Check visually.`,
          "success"
        );
      } catch (err) {
        log(`Texture swap error: ${err}`, "error");
      }
    },
    [app, log]
  );

  const testVariableSwap = useCallback(() => {
    if (!app) return;
    try {
      // Test setting variables that may or may not exist in the scene
      const testVars = [
        { name: "Vol_Label_1", value: "Vol.99" },
        { name: "Title_1", value: "Test Title" },
        { name: "Visible_1", value: true },
        { name: "active_book_index", value: 0 },
      ];

      for (const { name, value } of testVars) {
        try {
          app.setVariable(name, value);
          log(
            `setVariable("${name}", ${JSON.stringify(value)}) - OK`,
            "success"
          );
        } catch {
          log(`setVariable("${name}") - variable not found in scene`, "error");
        }
      }
    } catch (err) {
      log(`Variable test error: ${err}`, "error");
    }
  }, [app, log]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Left: Spline scene */}
      <div className="flex-1 relative">
        <Spline
          scene={SCENE_URL}
          onLoad={handleLoad}
          style={{ width: "100%", height: "100vh" }}
        />
      </div>

      {/* Right: Debug panel */}
      <div className="w-[400px] bg-[#111] border-l border-white/10 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-[#eafd67] uppercase tracking-wider">
            Texture Swap Spike
          </h2>
          <p className="text-xs text-white/40 mt-1">
            Test material.layers texture swap API
          </p>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3 border-b border-white/10">
          <div className="space-y-2">
            <label className="text-xs text-white/60 block">Find Object</label>
            <div className="flex gap-2">
              {["Magazine_1", "Magazine_2", "Magazine_3"].map((name) => (
                <button
                  key={name}
                  onClick={() => testFindObject(name)}
                  className="px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20 transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/60 block">
              Texture Swap (Magazine_1)
            </label>
            <div className="flex gap-2">
              {TEST_IMAGES.map((url, i) => (
                <button
                  key={url}
                  onClick={() => testTextureSwap("Magazine_1", url)}
                  className="px-2 py-1 text-xs bg-blue-600/30 rounded hover:bg-blue-600/50 transition-colors"
                >
                  Image {i + 1}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={testVariableSwap}
            className="w-full px-3 py-1.5 text-xs bg-purple-600/30 rounded hover:bg-purple-600/50 transition-colors"
          >
            Test Variables
          </button>

          <button
            onClick={() => setLogs([])}
            className="w-full px-3 py-1.5 text-xs bg-white/5 rounded hover:bg-white/10 transition-colors text-white/40"
          >
            Clear Logs
          </button>
        </div>

        {/* Scene Objects */}
        {objectNames.length > 0 && (
          <div className="p-4 border-b border-white/10 max-h-[200px] overflow-y-auto">
            <h3 className="text-xs text-white/60 mb-2">
              Scene Objects ({objectNames.length})
            </h3>
            <pre className="text-[10px] text-white/40 whitespace-pre font-mono">
              {objectNames.join("\n")}
            </pre>
          </div>
        )}

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs text-white/60 mb-2">Logs</h3>
          <div className="space-y-1">
            {logs.map((entry, i) => (
              <div key={i} className="text-[11px] font-mono">
                <span className="text-white/30">{entry.time}</span>{" "}
                <span
                  className={
                    entry.type === "success"
                      ? "text-green-400"
                      : entry.type === "error"
                        ? "text-red-400"
                        : "text-white/60"
                  }
                >
                  {entry.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
