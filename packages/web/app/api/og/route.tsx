import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "Decoded";
  const artist = searchParams.get("artist") || "";
  const image = searchParams.get("image") || "";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: "#050505",
        fontFamily: "sans-serif",
      }}
    >
      {/* Background image with overlay */}
      {image && (
        <img
          src={image}
          alt=""
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.4,
          }}
        />
      )}

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "linear-gradient(180deg, rgba(5,5,5,0.3) 0%, rgba(5,5,5,0.8) 100%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        {/* Logo / Brand */}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          DECODED
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 40 ? 42 : 56,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.2,
            marginBottom: artist ? 16 : 0,
            maxWidth: "80%",
          }}
        >
          {title.length > 80 ? title.slice(0, 77) + "..." : title}
        </div>

        {/* Artist */}
        {artist && (
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {artist}
          </div>
        )}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}
