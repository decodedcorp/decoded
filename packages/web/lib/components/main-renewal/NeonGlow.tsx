"use client";

interface NeonGlowProps {
  color?: string;
  intensity?: number;
  className?: string;
}

/**
 * Reusable neon glow background effect.
 * Renders layered radial gradients with slow ambient animation.
 * Purely decorative -- no interactivity.
 */
export function NeonGlow({
  color = "#eafd67",
  intensity = 0.6,
  className = "",
}: NeonGlowProps) {
  const alpha = Math.round(intensity * 0.2 * 255)
    .toString(16)
    .padStart(2, "0");
  const alphaLight = Math.round(intensity * 0.1 * 255)
    .toString(16)
    .padStart(2, "0");

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ mixBlendMode: "screen" }}
    >
      {/* Primary center glow */}
      <div
        className="absolute inset-0 animate-neon-drift"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${color}${alpha} 0%, transparent 70%)`,
        }}
      />
      {/* Off-center orb top-right */}
      <div
        className="absolute inset-0 animate-neon-drift-reverse"
        style={{
          background: `radial-gradient(ellipse 40% 35% at 70% 30%, ${color}${alphaLight} 0%, transparent 60%)`,
        }}
      />
      {/* Off-center orb bottom-left */}
      <div
        className="absolute inset-0 animate-neon-drift-slow"
        style={{
          background: `radial-gradient(ellipse 35% 40% at 25% 70%, ${color}${alphaLight} 0%, transparent 60%)`,
        }}
      />
    </div>
  );
}
