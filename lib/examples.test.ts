import { describe, expect, it } from "vitest";

import { labelExtractionSchema } from "@/lib/analysis/schema";
import { EXAMPLE_IDS, buildExample } from "./examples";
import { LOCALES } from "./i18n/config";

describe("examples", () => {
  it.each(EXAMPLE_IDS)("%s is a valid extraction in every locale", (id) => {
    for (const locale of LOCALES) {
      const example = buildExample(id, locale);
      expect(labelExtractionSchema.safeParse(example).success).toBe(true);
      expect(example.ingredients.every((i) => i.explanation.length > 0)).toBe(true);
    }
  });

  it("keeps numbers identical across locales", () => {
    for (const id of EXAMPLE_IDS) {
      expect(buildExample(id, "hi").nutrition).toEqual(buildExample(id, "en").nutrition);
    }
  });
});
