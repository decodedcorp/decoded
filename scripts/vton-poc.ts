/**
 * VTON PoC — Google Vertex AI Virtual Try-On API test
 *
 * Usage:
 *   npx tsx scripts/vton-poc.ts
 *
 * Prerequisites:
 *   - gcloud auth application-default login
 *   - Vertex AI API enabled on decoded-editorial project
 */

const PROJECT_ID = "decoded-editorial";
const LOCATION = "us-central1";
const MODEL = "virtual-try-on-001";

const ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;

// DB item images (cropped garment images from R2 CDN)
const TEST_ITEMS = [
  {
    id: 13093,
    name: "white lace sleeveless mini dress",
    url: "https://pub-6354054b117b46b9a0fe99e4a546e681.r2.dev/items/9665846b-157e-4575-a7fd-2a7a059701fa/13093.jpg",
  },
  {
    id: 13096,
    name: "black lace mock neck sleeveless mini dress",
    url: "https://pub-6354054b117b46b9a0fe99e4a546e681.r2.dev/items/9665846b-157e-4575-a7fd-2a7a059701fa/13096.jpg",
  },
  {
    id: 13090,
    name: "navy blue high neck sleeveless lace mini dress",
    url: "https://pub-6354054b117b46b9a0fe99e4a546e681.r2.dev/items/9665846b-157e-4575-a7fd-2a7a059701fa/13090.jpg",
  },
];

// Person image for testing — use a local file or accessible URL
// To use your own photo: place it at scripts/vton-person.jpg
const PERSON_IMAGE_PATH = process.env.PERSON_IMAGE || "scripts/vton-person.jpg";

async function getAccessToken(): Promise<string> {
  const { execSync } = await import("child_process");
  const home = process.env.HOME || "~";
  return execSync(
    `CLOUDSDK_PYTHON=/Library/Frameworks/Python.framework/Versions/3.12/bin/python3 ${home}/google-cloud-sdk/bin/gcloud auth application-default print-access-token`
  )
    .toString()
    .trim();
}

async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${url} (${response.status})`);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

async function tryOn(
  personImageBase64: string,
  productImageBase64: string,
  accessToken: string
): Promise<{ base64: string; mimeType: string; latencyMs: number }> {
  const start = Date.now();

  const body = {
    instances: [
      {
        personImage: {
          image: {
            bytesBase64Encoded: personImageBase64,
          },
        },
        productImages: [
          {
            image: {
              bytesBase64Encoded: productImageBase64,
            },
          },
        ],
      },
    ],
    parameters: {
      sampleCount: 1,
      baseSteps: 32,
      personGeneration: "allow_adult",
      addWatermark: true,
    },
  };

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const latencyMs = Date.now() - start;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const prediction = data.predictions?.[0];

  if (!prediction) {
    throw new Error("No prediction in response");
  }

  return {
    base64: prediction.bytesBase64Encoded,
    mimeType: prediction.mimeType || "image/png",
    latencyMs,
  };
}

async function saveResult(
  base64: string,
  mimeType: string,
  itemId: number,
  itemName: string
): Promise<string> {
  const ext = mimeType.includes("jpeg") ? "jpg" : "png";
  const filename = `scripts/vton-results/item-${itemId}-${itemName.replace(/\s+/g, "-").slice(0, 30)}.${ext}`;

  const { mkdirSync, writeFileSync } = await import("fs");
  mkdirSync("scripts/vton-results", { recursive: true });
  writeFileSync(filename, Buffer.from(base64, "base64"));

  return filename;
}

async function main() {
  console.log("🔑 Getting access token...");
  const accessToken = await getAccessToken();

  console.log("🧑 Loading person image...");
  const { existsSync, readFileSync } = await import("fs");

  if (!existsSync(PERSON_IMAGE_PATH)) {
    console.error(`❌ Person image not found: ${PERSON_IMAGE_PATH}`);
    console.log(`\n📸 Please provide a person image:`);
    console.log(`   Option 1: Place a photo at scripts/vton-person.jpg`);
    console.log(`   Option 2: PERSON_IMAGE=/path/to/photo.jpg npx tsx scripts/vton-poc.ts`);
    process.exit(1);
  }

  const personBase64 = readFileSync(PERSON_IMAGE_PATH).toString("base64");
  console.log(`  Person image: ${(personBase64.length / 1024).toFixed(0)}KB base64`);

  // Test all items
  for (const item of TEST_ITEMS) {
    console.log(`\n👗 Testing item #${item.id}: ${item.name}`);
    console.log(`  Fetching garment image...`);

    const productBase64 = await imageUrlToBase64(item.url);
    console.log(`  Garment image: ${(productBase64.length / 1024).toFixed(0)}KB base64`);

    console.log(`  Calling Virtual Try-On API...`);
    try {
      const result = await tryOn(personBase64, productBase64, accessToken);
      const savedPath = await saveResult(result.base64, result.mimeType, item.id, item.name);

      console.log(`  ✅ Success!`);
      console.log(`  ⏱  Latency: ${result.latencyMs}ms (${(result.latencyMs / 1000).toFixed(1)}s)`);
      console.log(`  📁 Saved: ${savedPath}`);
      console.log(`  📐 Result size: ${(result.base64.length / 1024).toFixed(0)}KB base64`);
    } catch (err) {
      console.error(`  ❌ Failed:`, (err as Error).message);
    }
  }

  console.log("\n--- PoC Complete ---");
}

main().catch(console.error);
