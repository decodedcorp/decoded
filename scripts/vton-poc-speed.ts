/**
 * VTON Speed Test — Compare baseSteps 16 vs 32
 * Usage: npx tsx scripts/vton-poc-speed.ts
 */

const PROJECT_ID = "decoded-editorial";
const LOCATION = "us-central1";
const MODEL = "virtual-try-on-001";
const ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;

const PERSON_IMAGE_PATH = "scripts/vton-person.jpg";
// white lace dress — known working item
const ITEM_URL = "https://pub-6354054b117b46b9a0fe99e4a546e681.r2.dev/items/9665846b-157e-4575-a7fd-2a7a059701fa/13093.jpg";
// handbag — test non-clothing item
const HANDBAG_URL = "https://pub-6354054b117b46b9a0fe99e4a546e681.r2.dev/items/9665846b-157e-4575-a7fd-2a7a059701fa/13091.jpg";
// stockings
const STOCKINGS_URL = "https://pub-6354054b117b46b9a0fe99e4a546e681.r2.dev/items/9665846b-157e-4575-a7fd-2a7a059701fa/13092.jpg";

async function getAccessToken(): Promise<string> {
  const { execSync } = await import("child_process");
  const home = process.env.HOME || "~";
  return execSync(
    `CLOUDSDK_PYTHON=/Library/Frameworks/Python.framework/Versions/3.12/bin/python3 ${home}/google-cloud-sdk/bin/gcloud auth application-default print-access-token`
  ).toString().trim();
}

async function imageUrlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url} (${res.status})`);
  return Buffer.from(await res.arrayBuffer()).toString("base64");
}

async function tryOn(
  personB64: string, productB64: string, token: string, baseSteps: number
): Promise<{ latencyMs: number; resultB64: string }> {
  const start = Date.now();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{
        personImage: { image: { bytesBase64Encoded: personB64 } },
        productImages: [{ image: { bytesBase64Encoded: productB64 } }],
      }],
      parameters: { sampleCount: 1, baseSteps, personGeneration: "allow_adult", addWatermark: true },
    }),
  });
  const latencyMs = Date.now() - start;
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  const data = await res.json();
  return { latencyMs, resultB64: data.predictions?.[0]?.bytesBase64Encoded || "" };
}

async function main() {
  const { readFileSync, mkdirSync, writeFileSync } = await import("fs");

  console.log("=== VTON Speed & Compatibility Test ===\n");
  const token = await getAccessToken();
  const personB64 = readFileSync(PERSON_IMAGE_PATH).toString("base64");

  // --- Test 1: baseSteps comparison ---
  console.log("--- Test 1: baseSteps Speed Comparison (dress item) ---");
  const dressB64 = await imageUrlToBase64(ITEM_URL);

  for (const steps of [16, 24, 32]) {
    console.log(`  baseSteps=${steps}...`);
    const result = await tryOn(personB64, dressB64, token, steps);
    mkdirSync("scripts/vton-results", { recursive: true });
    writeFileSync(`scripts/vton-results/speed-steps${steps}.png`, Buffer.from(result.resultB64, "base64"));
    console.log(`    ⏱  ${result.latencyMs}ms (${(result.latencyMs / 1000).toFixed(1)}s) | saved: speed-steps${steps}.png`);
  }

  // --- Test 2: Non-clothing items ---
  console.log("\n--- Test 2: Non-Clothing Item Compatibility ---");

  const items = [
    { name: "handbag", url: HANDBAG_URL },
    { name: "stockings", url: STOCKINGS_URL },
  ];

  for (const item of items) {
    console.log(`  ${item.name}...`);
    const itemB64 = await imageUrlToBase64(item.url);
    try {
      const result = await tryOn(personB64, itemB64, token, 32);
      writeFileSync(`scripts/vton-results/compat-${item.name}.png`, Buffer.from(result.resultB64, "base64"));
      console.log(`    ✅ ${result.latencyMs}ms | saved: compat-${item.name}.png`);
    } catch (err) {
      console.log(`    ❌ ${(err as Error).message}`);
    }
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
