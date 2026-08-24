import { describe, expect, it } from "vitest";
import { findDuplicateCustomer } from "./matcher";
import { normalizeEmail, normalizePhone } from "./normalize";

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Anna.Beispiel@Example.COM ")).toBe(
      "anna.beispiel@example.com"
    );
  });

  it("returns null for empty/missing input", () => {
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("normalizePhone", () => {
  it("strips formatting but keeps a leading +", () => {
    expect(normalizePhone("+49 151 234-56789")).toBe("+4915123456789");
    expect(normalizePhone("0151 / 234 56789")).toBe("015123456789");
  });

  it("returns null when nothing is left", () => {
    expect(normalizePhone("---")).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
  });
});

describe("findDuplicateCustomer", () => {
  const existing = [
    { id: "1", email: "anna.beispiel@example.com", phone: "+4915123456789" },
    { id: "2", email: "ben.muster@example.com", phone: "0160987654" },
  ];

  it("matches by normalized email regardless of case/whitespace", () => {
    const match = findDuplicateCustomer(
      { email: " Anna.Beispiel@EXAMPLE.com " },
      existing
    );
    expect(match?.id).toBe("1");
  });

  it("matches by normalized phone when email differs", () => {
    const match = findDuplicateCustomer(
      { email: "different@example.com", phone: "+49 151 234 567 89" },
      existing
    );
    expect(match?.id).toBe("1");
  });

  it("returns null when no email or phone matches", () => {
    const match = findDuplicateCustomer(
      { email: "new@example.com", phone: "+491234567" },
      existing
    );
    expect(match).toBeNull();
  });

  it("returns null when candidate has neither email nor phone", () => {
    const match = findDuplicateCustomer({}, existing);
    expect(match).toBeNull();
  });
});
