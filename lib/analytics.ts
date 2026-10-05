/**
 * Privacy-preserving analytics wrapper around GA4's gtag.
 *
 * Rules:
 *  - No-op unless NEXT_PUBLIC_GA_ID is configured and gtag has loaded.
 *  - Never send user-entered financial values. Only the calculator id and
 *    coarse, non-identifying labels (e.g. scenario_type: "preset") are allowed,
 *    which the type below enforces.
 */

export type AnalyticsEvent =
  | "calculator_view"
  | "calculator_start"
  | "result_generated"
  | "calculator_completed"
  | "scenario_changed";

export interface AnalyticsParams {
  calculator_id: string;
  /** Coarse category of interaction, never a value. */
  scenario_type?: "preset" | "tenure_unit" | "costs_toggle" | "schedule_view" | "slider" | "input";
}

declare global {
  interface Window {
    gtag?: (command: "event", name: string, params: Record<string, unknown>) => void;
  }
}

export function trackEvent(event: AnalyticsEvent, params: AnalyticsParams): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", event, { ...params, non_interaction: event === "calculator_view" });
  } catch {
    // Analytics must never break the calculator.
  }
}
