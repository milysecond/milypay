declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "js",
      eventName: string | Date,
      params?: Record<string, unknown>,
    ) => void;
  }
}

/** GA4 measurement ID for milypay.xyz */
export const GA_MEASUREMENT_ID = "G-356WE6KS4T";

/** Safe client-side event helper (no-op on server / before gtag loads). */
export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    window.gtag?.("event", event, props);
  }
}
