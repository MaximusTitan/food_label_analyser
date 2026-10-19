import { describe, expect, it } from "vitest";

import { LOCALES } from "./config";
import { en, type MessageKey } from "./messages/en";
import { MESSAGES, translate } from "./translate";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("messages", () => {
  const keys = Object.keys(en) as MessageKey[];

  it.each(LOCALES)("%s has a non-empty string for every key", (locale) => {
    expect(Object.keys(MESSAGES[locale]).sort()).toEqual([...keys].sort());
    for (const key of keys) expect(MESSAGES[locale][key].trim(), key).not.toBe("");
  });

  it.each(LOCALES)("%s uses the same placeholders as English", (locale) => {
    for (const key of keys) {
      expect(placeholders(MESSAGES[locale][key]), key).toEqual(placeholders(en[key]));
    }
  });

  it("has seven weekday labels in every locale", () => {
    for (const locale of LOCALES) expect(MESSAGES[locale]["enjoy.days"].split(",")).toHaveLength(7);
  });
});

describe("translate", () => {
  it("interpolates variables", () => {
    expect(translate("en", "report.scoreAria", { score: 7 })).toBe("Health score 7 out of 10");
    expect(translate("hi", "history.found", { count: 2 })).toBe("2 मिले");
  });

  it("leaves unknown placeholders intact", () => {
    expect(translate("en", "report.scoreAria")).toBe("Health score {score} out of 10");
  });
});
