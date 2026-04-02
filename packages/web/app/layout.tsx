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

export const metadata: Metadata = {
  title: "Decoded App",
  description: "Decoded application",
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
      </head>
      <body
        className={`${playfairDisplay.variable} ${inter.variable} font-sans`}
        suppressHydrationWarning
      >
        <AppProviders>
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
