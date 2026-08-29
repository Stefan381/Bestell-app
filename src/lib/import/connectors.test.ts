import { describe, expect, it } from "vitest";
import { rowsToArticleRows, rowsToCustomerRows } from "./connectors";

describe("rowsToCustomerRows", () => {
  it("converts valid rows and defaults missing optional fields to null", () => {
    const { rows, errors } = rowsToCustomerRows([
      { firstName: "Anna", lastName: "Beispiel", email: "anna@example.com" },
    ]);
    expect(errors).toHaveLength(0);
    expect(rows[0]).toEqual({
      firstName: "Anna",
      lastName: "Beispiel",
      email: "anna@example.com",
      phone: null,
      externalRef: null,
      notes: null,
    });
  });

  it("reports rows missing required fields as errors instead of throwing", () => {
    const { rows, errors } = rowsToCustomerRows([{ firstName: "Anna", lastName: "" }]);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it("treats a missing Vorname as optional, defaulting it to null", () => {
    const { rows, errors } = rowsToCustomerRows([{ firstName: "", lastName: "Beispiel" }]);
    expect(errors).toHaveLength(0);
    expect(rows[0]).toEqual({
      firstName: null,
      lastName: "Beispiel",
      email: null,
      phone: null,
      externalRef: null,
      notes: null,
    });
  });
});

describe("rowsToArticleRows", () => {
  it("parses German-formatted decimal prices", () => {
    const { rows, errors } = rowsToArticleRows([
      { articleNumber: "A-1", name: "Test", price: "1.234,56" },
    ]);
    expect(errors).toHaveLength(0);
    expect(rows[0].price).toBeCloseTo(1234.56);
  });

  it("flags an unparseable price as an error", () => {
    const { rows, errors } = rowsToArticleRows([
      { articleNumber: "A-1", name: "Test", price: "keinpreis" },
    ]);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });
});
