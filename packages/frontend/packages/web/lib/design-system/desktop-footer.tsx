"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useState } from "react";
import Link from "next/link";
import {
  Instagram,
  Twitter,
  Facebook,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { Text } from "./typography";
import { Input } from "./input";
import { Button } from "@/lib/components/ui/button";

/**
 * DesktopFooter Component
 *
 * Comprehensive footer with brand info, navigation links, social media, and newsletter signup.
 * - Desktop (md+): 4-column grid layout
 * - Mobile (<md): Stacked with accordion sections for Company/Support
 *
 * @see docs/design-system/decoded.pen
 */

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Press", href: "/press" },
  { label: "Blog", href: "/blog" },
];

const supportLinks = [
  { label: "Help Center", href: "/help" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Report Issue", href: "/report" },
];

const socialLinks = [
  {
    icon: Instagram,
    href: "https://instagram.com/decoded_app",
    label: "Instagram",
  },
  { icon: Twitter, href: "https://twitter.com/decoded_app", label: "Twitter" },
  {
    icon: Facebook,
    href: "https://facebook.com/decoded_app",
    label: "Facebook",
  },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
];

export interface DesktopFooterProps {
  className?: string;
  onNewsletterSubscribe?: (email: string) => void;
}

/**
 * FooterBrand Component
 *
 * Brand section with logo and slogan.
 */
const FooterBrand = () => {
  return (
    <div className="flex flex-col gap-3">
      <Link href="/" className="text-2xl font-bold font-mono text-primary">
        decoded
      </Link>
      <Text variant="small" textColor="muted">
        Discover fashion from your favorite celebrities
      </Text>
    </div>
  );
};

interface FooterLinkSectionProps {
  title: string;
  links: Array<{ label: string; href: string }>;
  collapsible?: boolean;
}

/**
 * FooterLinkSection Component
 *
 * Reusable link section with optional accordion behavior for mobile.
 */
const FooterLinkSection = ({
  title,
  links,
  collapsible = false,
}: FooterLinkSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (collapsible) {
    return (
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between py-3 text-sm font-medium text-foreground"
          aria-expanded={isOpen}
        >
          {title}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
        {isOpen && (
          <ul className="flex flex-col gap-2 pb-4">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-sm font-medium text-foreground">{title}</h3>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * FooterSocialLinks Component
 *
 * Social media icon links displayed horizontally.
 */
const FooterSocialLinks = () => {
  return (
    <div className="flex gap-3">
      {socialLinks.map(({ icon: Icon, href, label }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={label}
        >
          <Icon className="h-5 w-5" />
        </a>
      ))}
    </div>
  );
};

/**
 * FooterNewsletter Component
 *
 * Newsletter signup form with email input and submit button.
 */
interface FooterNewsletterProps {
  onSubscribe?: (email: string) => void;
}

const FooterNewsletter = ({ onSubscribe }: FooterNewsletterProps) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && onSubscribe) {
      onSubscribe(email);
      setEmail("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Text variant="label" className="text-foreground">
        Newsletter
      </Text>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          required
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label="Subscribe to newsletter"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

/**
 * FooterBottom Component
 *
 * Bottom bar with copyright, legal links, and language selector.
 */
const FooterBottom = () => {
  return (
    <div className="border-t border-border bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Copyright */}
          <Text variant="small" textColor="muted">
            © 2026 DECODED. All rights reserved.
          </Text>

          {/* Legal Links */}
          <div className="flex flex-wrap gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Language Selector */}
          <select
            className="w-32 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            defaultValue="en"
            aria-label="Select language"
          >
            <option value="en">English</option>
            <option value="ko">한국어</option>
            <option value="ja">日本語</option>
          </select>
        </div>
      </div>
    </div>
  );
};

/**
 * DesktopFooter Component
 *
 * Main footer component with responsive layout:
 * - Desktop: 4-column grid (Brand | Company | Support | Connect)
 * - Mobile: Stacked with accordion sections
 */
export const DesktopFooter = forwardRef<HTMLElement, DesktopFooterProps>(
  ({ className, onNewsletterSubscribe }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn("bg-muted", className)}
        role="contentinfo"
      >
        {/* Main Content */}
        <div className="container mx-auto px-6 py-12">
          {/* Desktop: 4-column grid */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-8">
            <FooterBrand />
            <FooterLinkSection title="Company" links={companyLinks} />
            <FooterLinkSection title="Support" links={supportLinks} />
            <div className="flex flex-col gap-4">
              <FooterSocialLinks />
              <FooterNewsletter onSubscribe={onNewsletterSubscribe} />
            </div>
          </div>

          {/* Mobile: Stacked with accordions */}
          <div className="flex flex-col gap-6 md:hidden">
            <FooterBrand />
            <FooterLinkSection
              title="Company"
              links={companyLinks}
              collapsible
            />
            <FooterLinkSection
              title="Support"
              links={supportLinks}
              collapsible
            />
            <div className="flex flex-col gap-4">
              <FooterSocialLinks />
              <FooterNewsletter onSubscribe={onNewsletterSubscribe} />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <FooterBottom />
      </footer>
    );
  }
);

DesktopFooter.displayName = "DesktopFooter";
