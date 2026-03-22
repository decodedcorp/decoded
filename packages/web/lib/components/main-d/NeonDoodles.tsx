"use client";

import { DraggableDoodle } from "./DraggableDoodle";

/**
 * MAXIMUM neon doodle decorations — ALL DRAGGABLE.
 * Every SVG, pill, and text label can be grabbed and thrown around.
 * z-[22] base, jumps to z-[60] when grabbed.
 */
export function NeonDoodles() {
  const n = "#eafd67";

  return (
    <div className="absolute inset-0 z-[22] pointer-events-none [&>*]:pointer-events-auto">
      {/* ════ Giant cursor arrow ════ */}
      <DraggableDoodle style={{ top: "1%", left: "-1%" }}>
        <svg
          style={{ width: "clamp(40px, 6vw, 75px)" }}
          viewBox="0 0 80 100"
          fill="none"
        >
          <path
            d="M10 5 L10 75 L28 58 L45 85 L55 78 L38 52 L60 52 Z"
            fill={n}
            stroke="#000"
            strokeWidth="2.5"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ "DRAG ANYTHING TO REMIX!" ════ */}
      <DraggableDoodle style={{ top: "-1%", left: "0%" }}>
        <div
          style={{
            color: n,
            fontFamily: "'Courier New', monospace",
            fontSize: "clamp(6px, 0.85vw, 11px)",
            fontWeight: 800,
            transform: "rotate(-5deg)",
            lineHeight: 1.3,
            textShadow: "1px 1px 0 #000",
          }}
        >
          DRAG ANYTHING
          <br />
          TO REMIX!
        </div>
      </DraggableDoodle>

      {/* ════ Lightning bolt 1 ════ */}
      <DraggableDoodle style={{ top: "5%", left: "10%" }}>
        <svg
          style={{
            width: "clamp(18px, 2.5vw, 32px)",
            transform: "rotate(-8deg)",
          }}
          viewBox="0 0 30 60"
          fill="none"
        >
          <path
            d="M20 0 L5 26 L14 26 L8 55 L26 22 L16 22 Z"
            fill={n}
            stroke="#000"
            strokeWidth="1.2"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ Small star 1 ════ */}
      <DraggableDoodle style={{ top: "22%", left: "12%" }}>
        <svg
          style={{ width: "clamp(14px, 2vw, 22px)" }}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M10 0 L12 7 L20 7 L14 12 L16 20 L10 15 L4 20 L6 12 L0 7 L8 7 Z"
            fill={n}
            stroke="#000"
            strokeWidth="0.5"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ Squiggly line ════ */}
      <DraggableDoodle style={{ top: "45%", left: "2%" }}>
        <svg
          style={{
            width: "clamp(30px, 4vw, 50px)",
            transform: "rotate(-3deg)",
          }}
          viewBox="0 0 50 14"
          fill="none"
        >
          <path
            d="M3 7 Q10 2 17 7 Q24 12 31 7 Q38 2 45 7"
            stroke={n}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ Cross / X mark ════ */}
      <DraggableDoodle style={{ top: "68%", left: "5%" }}>
        <svg
          style={{
            width: "clamp(16px, 2vw, 26px)",
            transform: "rotate(15deg)",
          }}
          viewBox="0 0 20 20"
          fill="none"
        >
          <line
            x1="3"
            y1="3"
            x2="17"
            y2="17"
            stroke={n}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="17"
            y1="3"
            x2="3"
            y2="17"
            stroke={n}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ TRENDING ITEMS bubble ════ */}
      <DraggableDoodle
        className="hidden md:block"
        style={{ top: "0%", left: "30%" }}
      >
        <div
          className="relative px-3 py-1.5"
          style={{
            background: "#fff",
            borderRadius: "50%/45%",
            border: "2.5px solid #111",
            boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
            transform: "rotate(1deg)",
          }}
        >
          <span
            style={{
              fontFamily: "'Impact', sans-serif",
              fontSize: "clamp(8px, 1.1vw, 14px)",
              fontWeight: 900,
              color: "#111",
              lineHeight: 1.2,
              textAlign: "center",
              display: "block",
            }}
          >
            TRENDING
            <br />
            ITEMS
          </span>
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "10px solid #fff",
            }}
          />
        </div>
      </DraggableDoodle>

      {/* ════ Starburst 1 ════ */}
      <DraggableDoodle style={{ top: "-2%", left: "46%" }}>
        <svg
          style={{ width: "clamp(22px, 3vw, 38px)" }}
          viewBox="0 0 40 40"
          fill="none"
        >
          <path
            d="M20 0 L23 14 L37 10 L27 20 L40 25 L26 27 L30 40 L20 30 L10 40 L14 27 L0 25 L13 20 L3 10 L17 14 Z"
            fill={n}
            stroke="#000"
            strokeWidth="0.8"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ Zigzag ════ */}
      <DraggableDoodle style={{ top: "28%", left: "40%" }}>
        <svg
          style={{
            width: "clamp(20px, 3vw, 35px)",
            transform: "rotate(10deg)",
          }}
          viewBox="0 0 30 20"
          fill="none"
        >
          <path
            d="M2 18 L8 2 L14 18 L20 2 L26 18"
            stroke={n}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ "STREET STYLE — HOT" pill ════ */}
      <DraggableDoodle
        className="hidden md:block"
        style={{ top: "35%", left: "25%" }}
      >
        <div
          className="px-2 py-1"
          style={{
            background: "#fff",
            border: "2px solid #111",
            borderRadius: "16px",
            boxShadow: "2px 2px 0 rgba(0,0,0,0.25)",
            transform: "rotate(-2deg)",
          }}
        >
          <span
            style={{
              fontFamily: "'Impact', sans-serif",
              fontSize: "clamp(7px, 0.9vw, 12px)",
              fontWeight: 900,
              color: "#111",
            }}
          >
            STREET STYLE — HOT
          </span>
        </div>
      </DraggableDoodle>

      {/* ════ Spiral ════ */}
      <DraggableDoodle style={{ top: "50%", left: "42%" }}>
        <svg
          style={{
            width: "clamp(20px, 3vw, 35px)",
            transform: "rotate(-5deg)",
          }}
          viewBox="0 0 30 30"
          fill="none"
        >
          <path
            d="M15 15 C15 12 18 10 20 12 C22 14 20 18 17 18 C14 18 11 15 12 12 C13 9 17 7 20 9 C23 11 22 17 19 19 C16 21 11 19 10 15"
            stroke={n}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ "DECODED PICK" pill ════ */}
      <DraggableDoodle
        className="hidden md:block"
        style={{ top: "52%", left: "56%" }}
      >
        <div
          className="px-2 py-1"
          style={{
            background: "#fff",
            border: "2px solid #111",
            borderRadius: "16px",
            boxShadow: "2px 2px 0 rgba(0,0,0,0.25)",
            transform: "rotate(3deg)",
          }}
        >
          <span
            style={{
              fontFamily: "'Impact', sans-serif",
              fontSize: "clamp(7px, 0.9vw, 12px)",
              fontWeight: 900,
              color: "#111",
            }}
          >
            DECODED PICK ✦
          </span>
        </div>
      </DraggableDoodle>

      {/* ════ Neon glasses ════ */}
      <DraggableDoodle
        className="hidden md:block"
        style={{ top: "20%", left: "22%" }}
      >
        <svg
          style={{ width: "clamp(25px, 3.5vw, 42px)" }}
          viewBox="0 0 50 20"
          fill="none"
        >
          <rect
            x="2"
            y="4"
            width="17"
            height="11"
            rx="3"
            stroke={n}
            strokeWidth="2.5"
            fill="none"
          />
          <rect
            x="27"
            y="4"
            width="17"
            height="11"
            rx="3"
            stroke={n}
            strokeWidth="2.5"
            fill="none"
          />
          <line x1="19" y1="9" x2="27" y2="9" stroke={n} strokeWidth="2" />
        </svg>
      </DraggableDoodle>

      {/* ════ "LTD EDTN DROPS" ════ */}
      <DraggableDoodle
        className="hidden md:block"
        style={{ top: "-2%", right: "0%" }}
      >
        <div
          style={{
            color: n,
            fontFamily: "'Impact', sans-serif",
            fontSize: "clamp(8px, 1.2vw, 15px)",
            fontWeight: 900,
            transform: "rotate(4deg)",
            letterSpacing: "0.08em",
            lineHeight: 1.15,
            textShadow: "2px 2px 0 rgba(0,0,0,0.5)",
          }}
        >
          LTD EDTN
          <br />
          DROPS
        </div>
      </DraggableDoodle>

      {/* ════ Curved arrow ════ */}
      <DraggableDoodle style={{ top: "2%", right: "6%" }}>
        <svg
          style={{
            width: "clamp(30px, 4vw, 50px)",
            transform: "rotate(18deg)",
          }}
          viewBox="0 0 50 55"
          fill="none"
        >
          <path
            d="M40 5 C28 2, 10 15, 14 40"
            stroke={n}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M7 34 L14 44 L21 34" fill={n} />
        </svg>
      </DraggableDoodle>

      {/* ════ Lightning bolt 2 ════ */}
      <DraggableDoodle style={{ top: "30%", right: "2%" }}>
        <svg
          style={{
            width: "clamp(16px, 2.2vw, 28px)",
            transform: "rotate(10deg)",
          }}
          viewBox="0 0 24 50"
          fill="none"
        >
          <path
            d="M15 0 L4 22 L11 22 L6 46 L21 18 L13 18 Z"
            fill={n}
            stroke="#000"
            strokeWidth="1"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ Starburst 2 ════ */}
      <DraggableDoodle style={{ top: "15%", right: "14%" }}>
        <svg
          style={{ width: "clamp(16px, 2.2vw, 28px)" }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 0 L14 8 L22 6 L16 12 L24 15 L16 16 L18 24 L12 18 L6 24 L8 16 L0 15 L8 12 L2 6 L10 8 Z"
            fill={n}
            stroke="#000"
            strokeWidth="0.5"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ Double underlines ════ */}
      <DraggableDoodle
        className="hidden md:block"
        style={{ top: "42%", right: "0%" }}
      >
        <svg
          style={{
            width: "clamp(35px, 5vw, 55px)",
            transform: "rotate(-3deg)",
          }}
          viewBox="0 0 50 8"
          fill="none"
        >
          <line
            x1="0"
            y1="2"
            x2="45"
            y2="2"
            stroke={n}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="3"
            y1="6"
            x2="40"
            y2="6"
            stroke={n}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ Dashed circle ════ */}
      <DraggableDoodle style={{ bottom: "18%", left: "18%" }}>
        <svg
          style={{ width: "clamp(35px, 5vw, 55px)", transform: "rotate(3deg)" }}
          viewBox="0 0 40 25"
          fill="none"
        >
          <ellipse
            cx="20"
            cy="12"
            rx="18"
            ry="10"
            stroke={n}
            strokeWidth="2"
            strokeDasharray="4 3"
            fill="none"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ Arrow up ════ */}
      <DraggableDoodle
        className="hidden md:block"
        style={{ bottom: "25%", left: "38%" }}
      >
        <svg
          style={{
            width: "clamp(18px, 2.5vw, 30px)",
            transform: "rotate(5deg)",
          }}
          viewBox="0 0 24 40"
          fill="none"
        >
          <path
            d="M12 38 L12 8 M5 14 L12 2 L19 14"
            stroke={n}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ "NEW IN ★" pill (neon bg) ════ */}
      <DraggableDoodle
        className="hidden md:block"
        style={{ bottom: "10%", left: "32%" }}
      >
        <div
          className="px-2 py-0.5"
          style={{
            background: n,
            border: "2px solid #111",
            borderRadius: "12px",
            transform: "rotate(-4deg)",
          }}
        >
          <span
            style={{
              fontFamily: "'Impact', sans-serif",
              fontSize: "clamp(7px, 0.8vw, 11px)",
              fontWeight: 900,
              color: "#111",
            }}
          >
            NEW IN ★
          </span>
        </div>
      </DraggableDoodle>

      {/* ════ Wavy line ════ */}
      <DraggableDoodle style={{ bottom: "5%", left: "45%" }}>
        <svg
          style={{ width: "clamp(40px, 6vw, 65px)", transform: "rotate(2deg)" }}
          viewBox="0 0 60 12"
          fill="none"
        >
          <path
            d="M2 6 Q8 1 14 6 Q20 11 26 6 Q32 1 38 6 Q44 11 50 6 Q56 1 58 6"
            stroke={n}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ Dashed circle 2 ════ */}
      <DraggableDoodle style={{ bottom: "8%", right: "10%" }}>
        <svg
          style={{ width: "clamp(40px, 6vw, 65px)", transform: "rotate(5deg)" }}
          viewBox="0 0 50 30"
          fill="none"
        >
          <ellipse
            cx="25"
            cy="15"
            rx="22"
            ry="12"
            stroke={n}
            strokeWidth="2"
            strokeDasharray="4 3"
            fill="none"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ Down arrow ════ */}
      <DraggableDoodle style={{ bottom: "3%", right: "5%" }}>
        <svg
          style={{
            width: "clamp(18px, 2.5vw, 30px)",
            transform: "rotate(-12deg)",
          }}
          viewBox="0 0 24 40"
          fill="none"
        >
          <path
            d="M12 0 L12 28 M4 22 L12 34 L20 22"
            stroke={n}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ Lightning bolt 3 ════ */}
      <DraggableDoodle style={{ bottom: "15%", right: "3%" }}>
        <svg
          style={{
            width: "clamp(14px, 2vw, 24px)",
            transform: "rotate(-8deg)",
          }}
          viewBox="0 0 20 40"
          fill="none"
        >
          <path
            d="M13 0 L3 18 L9 18 L5 38 L18 15 L11 15 Z"
            fill={n}
            stroke="#000"
            strokeWidth="0.8"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ Heart ════ */}
      <DraggableDoodle
        className="hidden md:block"
        style={{ bottom: "30%", right: "20%" }}
      >
        <svg
          style={{
            width: "clamp(14px, 2vw, 22px)",
            transform: "rotate(10deg)",
          }}
          viewBox="0 0 20 18"
          fill="none"
        >
          <path
            d="M10 17 C6 13 0 9 0 5 C0 2 2 0 5 0 C7 0 9 1 10 3 C11 1 13 0 15 0 C18 0 20 2 20 5 C20 9 14 13 10 17Z"
            fill={n}
            stroke="#000"
            strokeWidth="0.5"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ "HOT DROP" pill (neon bg) ════ */}
      <DraggableDoodle
        className="hidden md:block"
        style={{ bottom: "20%", right: "30%" }}
      >
        <div
          className="px-2 py-0.5"
          style={{
            background: n,
            border: "2px solid #111",
            borderRadius: "12px",
            transform: "rotate(6deg)",
          }}
        >
          <span
            style={{
              fontFamily: "'Impact', sans-serif",
              fontSize: "clamp(7px, 0.8vw, 11px)",
              fontWeight: 900,
              color: "#111",
            }}
          >
            HOT DROP
          </span>
        </div>
      </DraggableDoodle>

      {/* ════ Cross mark 2 ════ */}
      <DraggableDoodle style={{ top: "60%", right: "35%" }}>
        <svg
          style={{
            width: "clamp(12px, 1.5vw, 20px)",
            transform: "rotate(-10deg)",
          }}
          viewBox="0 0 16 16"
          fill="none"
        >
          <line
            x1="2"
            y1="2"
            x2="14"
            y2="14"
            stroke={n}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="14"
            y1="2"
            x2="2"
            y2="14"
            stroke={n}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ Star 2 ════ */}
      <DraggableDoodle style={{ top: "72%", left: "55%" }}>
        <svg
          style={{ width: "clamp(12px, 1.5vw, 18px)" }}
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M8 0 L10 6 L16 6 L11 10 L13 16 L8 12 L3 16 L5 10 L0 6 L6 6 Z"
            fill={n}
            stroke="#000"
            strokeWidth="0.3"
          />
        </svg>
      </DraggableDoodle>

      {/* ════ Dots trail ════ */}
      <DraggableDoodle
        className="hidden md:block"
        style={{ top: "85%", left: "20%" }}
      >
        <svg
          style={{ width: "clamp(40px, 5vw, 60px)" }}
          viewBox="0 0 50 6"
          fill="none"
        >
          <circle cx="4" cy="3" r="2" fill={n} />
          <circle cx="14" cy="3" r="2" fill={n} />
          <circle cx="24" cy="3" r="2" fill={n} />
          <circle cx="34" cy="3" r="2" fill={n} />
          <circle cx="44" cy="3" r="2" fill={n} />
        </svg>
      </DraggableDoodle>
    </div>
  );
}
