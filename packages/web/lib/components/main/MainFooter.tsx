"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSuccess(true);
    setEmail("");
    setIsSubmitting(false);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="w-full max-w-sm">
      <h3 className="text-[10px] font-sans font-bold tracking-[0.2em] text-white/40 uppercase mb-4">
        Stay Connected
      </h3>
      <form onSubmit={handleSubmit} className="relative group">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="EMAIL ADDRESS"
          className="w-full bg-transparent border-b border-white/10 py-4 text-xs font-sans tracking-[0.1em] text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-all pr-12"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !email}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-2"
        >
          {isSubmitting ? (
            "..."
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          )}
        </button>
      </form>
      {isSuccess && (
        <p className="mt-4 text-[10px] uppercase font-bold tracking-widest text-primary">
          Subscription Confirmed
        </p>
      )}
    </div>
  );
}

export function MainFooter() {
  return (
    <footer className="bg-black pt-32 pb-16 px-6 md:px-12 border-t border-white/5 relative z-10 overflow-hidden">
      {/* Dynamic Background Texture/Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24 items-start mb-32">
          {/* Brand Presence */}
          <div className="lg:col-span-5">
            <h2 className="text-4xl md:text-6xl font-serif font-bold italic tracking-tighter text-white mb-8">
              DECODED
            </h2>
            <p className="text-white/40 font-sans font-light text-sm md:text-base leading-relaxed max-w-md">
              A curated narrative of global style, culture, and creation. We
              decode the visual language of the present to document the style of
              the future.
            </p>
            <div className="flex gap-8 mt-12">
              {["Instagram", "Twitter", "Vimeo", "Archive"].map((social) => (
                <Link
                  key={social}
                  href="#"
                  className="text-[10px] font-sans font-bold tracking-[0.2em] text-white/20 hover:text-white transition-colors uppercase"
                >
                  {social}
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation Matrix */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-8 lg:gap-16">
            <div className="space-y-6">
              <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] text-white/40 uppercase">
                Journal
              </h4>
              <ul className="space-y-4">
                {["Narratives", "Editorials", "Interviews", "Features"].map(
                  (item) => (
                    <li key={item}>
                      <Link
                        href="#"
                        className="text-xs font-sans text-white/50 hover:text-primary transition-colors"
                      >
                        {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] text-white/40 uppercase">
                Platform
              </h4>
              <ul className="space-y-4">
                {["Directory", "Collective", "Collaborations", "About"].map(
                  (item) => (
                    <li key={item}>
                      <Link
                        href="#"
                        className="text-xs font-sans text-white/50 hover:text-primary transition-colors"
                      >
                        {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {/* Engagement */}
          <div className="lg:col-span-4 flex justify-start lg:justify-end">
            <NewsletterForm />
          </div>
        </div>

        {/* Legal & Architectural Metadata */}
        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-2">
            <p className="text-[9px] font-sans font-medium tracking-[0.2em] text-white/10 uppercase">
              DECODED INC. ALL RIGHTS RESERVED &copy; {new Date().getFullYear()}
            </p>
            <div className="flex gap-6 text-[9px] font-sans font-medium tracking-[0.2em] text-white/10 uppercase">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>

          <div className="text-right">
            <span className="block text-[8px] font-sans font-bold tracking-[0.4em] text-white/5 uppercase">
              Architecture Version 3.1.0-Release
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
