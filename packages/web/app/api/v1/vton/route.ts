import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = process.env.GCP_PROJECT_ID || "decoded-editorial";
const LOCATION = process.env.GCP_LOCATION || "us-central1";
const MODEL = "virtual-try-on-001";

function getEndpoint() {
  return `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;
}

async function getAccessToken(): Promise<string> {
  // 1. Try explicit env var first
  if (process.env.GCP_ACCESS_TOKEN) {
    return process.env.GCP_ACCESS_TOKEN;
  }

  // 2. Try gcloud CLI
  const { execSync } = await import("child_process");
  const home = process.env.HOME || "~";
  const gcloudPath = `${home}/google-cloud-sdk/bin/gcloud`;

  try {
    return execSync(
      `CLOUDSDK_PYTHON=/Library/Frameworks/Python.framework/Versions/3.12/bin/python3 ${gcloudPath} auth application-default print-access-token`,
      { timeout: 10000 }
    )
      .toString()
      .trim();
  } catch {
    throw new Error(
      "Failed to get GCP access token. Set GCP_ACCESS_TOKEN or configure gcloud CLI."
    );
  }
}

async function callVtonApi(
  accessToken: string,
  personBase64: string,
  productBase64: string
): Promise<{ resultBase64: string; mimeType: string }> {
  const response = await fetch(getEndpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instances: [
        {
          personImage: {
            image: { bytesBase64Encoded: personBase64 },
          },
          productImages: [{ image: { bytesBase64Encoded: productBase64 } }],
        },
      ],
      parameters: {
        sampleCount: 1,
        baseSteps: 16,
        personGeneration: "allow_all",
        safetySetting: "block_only_high",
        addWatermark: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vertex AI error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const prediction = data.predictions?.[0];

  if (!prediction?.bytesBase64Encoded) {
    throw new Error("No result from VTON API");
  }

  return {
    resultBase64: prediction.bytesBase64Encoded,
    mimeType: prediction.mimeType || "image/png",
  };
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url} (${res.status})`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const body = await request.json();
    const {
      personImageBase64,
      productImageBase64,
      productImageUrl,
      productImageUrls,
    } = body;

    if (!personImageBase64) {
      return NextResponse.json(
        { error: "personImageBase64 is required" },
        { status: 400 }
      );
    }

    // Collect all product image URLs
    const urls: string[] =
      productImageUrls || (productImageUrl ? [productImageUrl] : []);

    // Resolve all product images to base64
    const productImages: string[] = [];
    for (const url of urls) {
      productImages.push(await fetchImageAsBase64(url));
    }
    if (productImageBase64) {
      productImages.push(productImageBase64);
    }

    if (productImages.length === 0) {
      return NextResponse.json(
        { error: "At least one product image is required" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    // Estimate token usage (base64 bytes ≈ image bytes * 4/3)
    const personTokens = Math.ceil((personImageBase64.length * 0.75) / 1024);
    const productTokensArr = productImages.map((b64) =>
      Math.ceil((b64.length * 0.75) / 1024)
    );
    const totalInputKB =
      personTokens + productTokensArr.reduce((a, b) => a + b, 0);

    console.log(`[VTON] ──── Request Start ────`);
    console.log(
      `[VTON] Items: ${productImages.length} | Person: ${personTokens}KB | Products: ${productTokensArr.map((k) => `${k}KB`).join(", ")}`
    );
    console.log(
      `[VTON] Total input size: ${totalInputKB}KB (${(totalInputKB / 1024).toFixed(1)}MB)`
    );

    // Chain requests: each result becomes the person image for the next item
    let currentPersonBase64 = personImageBase64;
    let lastMimeType = "image/png";

    for (let i = 0; i < productImages.length; i++) {
      const stepStart = Date.now();
      console.log(`[VTON] Processing item ${i + 1}/${productImages.length}...`);
      const result = await callVtonApi(
        accessToken,
        currentPersonBase64,
        productImages[i]
      );
      const stepMs = Date.now() - stepStart;
      const resultKB = Math.ceil((result.resultBase64.length * 0.75) / 1024);
      console.log(
        `[VTON] Item ${i + 1} done: ${(stepMs / 1000).toFixed(1)}s | Result: ${resultKB}KB`
      );
      currentPersonBase64 = result.resultBase64;
      lastMimeType = result.mimeType;
    }

    const latencyMs = Date.now() - start;
    const outputKB = Math.ceil((currentPersonBase64.length * 0.75) / 1024);
    console.log(`[VTON] ──── Complete ────`);
    console.log(
      `[VTON] Total: ${(latencyMs / 1000).toFixed(1)}s | Output: ${outputKB}KB (${(outputKB / 1024).toFixed(1)}MB)`
    );

    return NextResponse.json({
      resultImage: currentPersonBase64,
      mimeType: lastMimeType,
      latencyMs,
      itemCount: productImages.length,
    });
  } catch (err) {
    const latencyMs = Date.now() - start;
    console.error(`[VTON] ──── Error (${(latencyMs / 1000).toFixed(1)}s) ────`);
    console.error(`[VTON]`, (err as Error).message);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
