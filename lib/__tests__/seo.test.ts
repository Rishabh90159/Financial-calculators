import { describe, expect, it } from "vitest";
import { buildMetadata, MAX_TITLE_LENGTH } from "../seo";

describe("buildMetadata title length", () => {
  it("appends the brand and accepts a title within the limit", () => {
    const meta = buildMetadata({ title: "EMI Calculator", description: "d", path: "/x" });
    expect(meta.openGraph?.title).toBe("EMI Calculator | MoneyMetric");
  });

  it("accepts a title exactly at the limit", () => {
    const title = "a".repeat(MAX_TITLE_LENGTH - " | MoneyMetric".length);
    expect(() => buildMetadata({ title, description: "d", path: "/x" })).not.toThrow();
  });

  it("counts the brand suffix and rejects a title one character over", () => {
    const title = "a".repeat(MAX_TITLE_LENGTH - " | MoneyMetric".length + 1);
    expect(() => buildMetadata({ title, description: "d", path: "/x" })).toThrow(/71 characters/);
  });

  it("counts '&' as one character, as audits and search engines do", () => {
    const title = "&".repeat(MAX_TITLE_LENGTH - " | MoneyMetric".length);
    expect(() => buildMetadata({ title, description: "d", path: "/x" })).not.toThrow();
  });

  it("applies the limit to absolute titles without adding the brand", () => {
    expect(() => buildMetadata({ title: "a".repeat(71), description: "d", path: "/", absoluteTitle: true })).toThrow();
  });
});
