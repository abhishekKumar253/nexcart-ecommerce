import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router";
import { SentryErrorFallback } from "./components/SentryErrorFallback.jsx";
import { SentryUserSync } from "./components/SentryUserSync.jsx";

const queryClient = new QueryClient();

const apiBase = import.meta.env.VITE_API_URL ?? "";


let tracePropagationTargets;
if (apiBase.length > 0) {
  tracePropagationTargets = [apiBase];
} else if (typeof globalThis !== "undefined" && globalThis.location) {
  tracePropagationTargets = [globalThis.location.origin];
} else {
  tracePropagationTargets = [];
}

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 1,
  tracePropagationTargets: tracePropagationTargets,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 0.1,
  enableLogs: true,
});

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!clerkKey) throw new Error("VITE_CLERK_PUBLISHABLE_KEY is not set");


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkKey}>
      <SentryUserSync />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>
            <App />
          </Sentry.ErrorBoundary>
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>
);
