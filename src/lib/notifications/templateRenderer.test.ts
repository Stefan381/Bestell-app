import { describe, expect, it } from "vitest";
import { renderTemplate } from "./templateRenderer";

const variables = {
  kundeVorname: "Anna",
  kundeNachname: "Beispiel",
  artikel: "Kaffeemaschine Deluxe (x1)",
  filiale: "Filiale 1",
  abholhinweis: "Bitte Kundenkarte mitbringen.",
};

describe("renderTemplate", () => {
  it("replaces all known placeholders", () => {
    const result = renderTemplate(
      "Hallo {{kundeVorname}}, Ihre Bestellung ({{artikel}}) ist in {{filiale}} abholbereit. {{abholhinweis}}",
      variables
    );
    expect(result).toBe(
      "Hallo Anna, Ihre Bestellung (Kaffeemaschine Deluxe (x1)) ist in Filiale 1 abholbereit. Bitte Kundenkarte mitbringen."
    );
  });

  it("leaves unknown placeholders untouched", () => {
    const result = renderTemplate("Hallo {{unbekannt}}", variables);
    expect(result).toBe("Hallo {{unbekannt}}");
  });

  it("tolerates whitespace inside braces", () => {
    const result = renderTemplate("{{ kundeVorname }}", variables);
    expect(result).toBe("Anna");
  });
});
