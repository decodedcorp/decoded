import { LoginCard } from "@/lib/components/auth/LoginCard";
import { LoginBackground } from "./LoginBackground";

export const metadata = {
  title: "Login - Decoded",
  description: "Sign in to Decoded and discover what they're wearing",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* DomeGallery Background */}
      <LoginBackground />

      {/* Dark Overlay for better readability */}
      <div className="absolute inset-0 z-10 bg-black/30" />

      {/* Content */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4">
        <LoginCard />
      </div>
    </main>
  );
}
