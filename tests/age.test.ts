import { describe, expect, it } from "vitest";
import { ageOn, isAdult, parseDateOnly } from "@/lib/age";

const now = new Date("2026-06-15T12:00:00Z");

describe("parseDateOnly", () => {
  it("parses valid dates", () => {
    expect(parseDateOnly("2000-02-29")?.toISOString()).toBe("2000-02-29T00:00:00.000Z");
  });
  it.each(["2001-02-29", "2000-13-01", "20000101", "", "2000-1-1"])("rejects %s", (v) => {
    expect(parseDateOnly(v)).toBeNull();
  });
});

describe("age gate", () => {
  it("is 18 exactly on the birthday", () => {
    expect(isAdult(new Date("2008-06-15T00:00:00Z"), now)).toBe(true);
  });
  it("is 17 the day before the 18th birthday", () => {
    expect(isAdult(new Date("2008-06-16T00:00:00Z"), now)).toBe(false);
    expect(ageOn(new Date("2008-06-16T00:00:00Z"), now)).toBe(17);
  });
  it("rejects missing dob", () => {
    expect(isAdult(null, now)).toBe(false);
  });
});
