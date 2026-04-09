import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import {
  ConditionalNav,
  MainContentWrapper,
} from "@/lib/components/ConditionalNav";
import { LazyOnboardingSheet } from "@/lib/components/auth/LazyOnboardingSheet";
import { LazyVtonModal } from "@/lib/components/vton/LazyVtonModal";
import { ThemeScript } from "@/lib/theme/theme-script";
import { EventFlushProvider } from "./EventFlushProvider";
import { JsonLdOrganization } from "@/lib/seo/json-ld";
import { SessionExpiredBanner } from "@/lib/components/auth/SessionExpiredBanner";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://decoded.style";

export const metadata: Metadata = {
  title: {
    default: "Decoded — The Style Search Engine",
    template: "%s | Decoded",
  },
  description:
    "The style search engine — AI-powered item detection, editorial magazines, and virtual try-on.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    siteName: "Decoded",
    locale: "en_US",
    images: [
      {
        url: `${SITE_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: "Decoded — The Style Search Engine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [`${SITE_URL}/api/og`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <JsonLdOrganization />
      </head>
      <body
        className={`${playfairDisplay.variable} ${inter.variable} font-sans`}
        suppressHydrationWarning
      >
        <AppProviders>
          <SessionExpiredBanner />
          <EventFlushProvider />
          <div className="flex flex-col min-h-screen">
            {/* Conditional Navigation (Headers + MobileNav) */}
            <ConditionalNav />

            {/* Main Content Area - with header padding */}
            <MainContentWrapper>{children}</MainContentWrapper>

            {/* Modal slot - rendered outside MainContentWrapper */}
            {modal}
          </div>
          {/* <LazyOnboardingSheet /> */}
          <LazyVtonModal />
        </AppProviders>
      </body>
    </html>
  );
}
