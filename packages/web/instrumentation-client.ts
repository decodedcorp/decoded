import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Web Vitals (LCP, CLS, INP) captured automatically — no extra config
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
