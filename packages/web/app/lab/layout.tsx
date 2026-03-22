import Link from "next/link";

const LAB_ITEMS = [
  { href: "/lab/neon-glow", label: "Neon Glow" },
  { href: "/lab/main-b", label: "Main B" },
  { href: "/lab/fashion-scan", label: "Fashion Scan" },
  { href: "/lab/vton", label: "VTON" },
  { href: "/lab/texture-swap", label: "Texture Swap" },
  { href: "/lab/ascii-text", label: "ASCII Text" },
];

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <Link
            href="/lab"
            className="font-mono text-sm font-bold text-[#eafd67]"
          >
            LAB
          </Link>
          <div className="flex gap-1 overflow-x-auto">
            {LAB_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
