"use client";

import { useCallback, useEffect, useRef } from "react";
import { trackEvent, type AnalyticsParams } from "@/lib/analytics";

const RESULT_DEBOUNCE_MS = 1200;
const COMPLETED_AFTER_MS = 4000;

/**
 * Event lifecycle for one calculator instance:
 *  calculator_view       — on mount
 *  calculator_start      — first user interaction
 *  result_generated      — a valid result settles after the user stops changing inputs (debounced)
 *  calculator_completed  — once per view, when a valid result has stayed on screen after interaction
 *  scenario_changed      — preset buttons, unit toggles, optional sections
 *  comparison_used       — scenario tables and side-by-side comparisons
 * Only the calculator id and interaction category are sent — never input values.
 */
export function useCalculatorAnalytics(calculatorId: string, resultIsValid: boolean, resultKey: string) {
  const started = useRef(false);
  const completed = useRef(false);
  const resultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    trackEvent("calculator_view", { calculator_id: calculatorId });
  }, [calculatorId]);

  useEffect(() => {
    if (!started.current || !resultIsValid) return;
    if (resultTimer.current) clearTimeout(resultTimer.current);
    resultTimer.current = setTimeout(() => trackEvent("result_generated", { calculator_id: calculatorId }), RESULT_DEBOUNCE_MS);

    if (!completed.current) {
      if (completeTimer.current) clearTimeout(completeTimer.current);
      completeTimer.current = setTimeout(() => {
        completed.current = true;
        trackEvent("calculator_completed", { calculator_id: calculatorId });
      }, COMPLETED_AFTER_MS);
    }
  }, [calculatorId, resultIsValid, resultKey]);

  useEffect(
    () => () => {
      if (resultTimer.current) clearTimeout(resultTimer.current);
      if (completeTimer.current) clearTimeout(completeTimer.current);
    },
    [],
  );

  const markInteraction = useCallback(() => {
    if (started.current) return;
    started.current = true;
    trackEvent("calculator_start", { calculator_id: calculatorId });
  }, [calculatorId]);

  const trackScenario = useCallback(
    (scenarioType: NonNullable<AnalyticsParams["scenario_type"]>) => {
      markInteraction();
      trackEvent("scenario_changed", { calculator_id: calculatorId, scenario_type: scenarioType });
    },
    [calculatorId, markInteraction],
  );

  /** A comparison view (scenario table, option A vs B, property check) was opened or used. */
  const trackComparison = useCallback(() => {
    markInteraction();
    trackEvent("comparison_used", { calculator_id: calculatorId, scenario_type: "comparison" });
  }, [calculatorId, markInteraction]);

  return { markInteraction, trackScenario, trackComparison };
}
