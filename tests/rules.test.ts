import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { buildSeedProfiles } from "@/prisma/seed-data";
import { isAdult } from "@/lib/age";

const root = path.resolve(__dirname, "..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe("seed data", () => {
  const seeds = buildSeedProfiles();
  it("has 30 unique fictional adult profiles", () => {
    expect(seeds).toHaveLength(30);
    expect(new Set(seeds.map((s) => s.email)).size).toBe(30);
    expect(seeds.every((s) => s.email.endsWith("@example.test"))).toBe(true);
    expect(seeds.every((s) => isAdult(new Date(`${s.dob}T00:00:00Z`)))).toBe(true);
  });
});

describe("hard rules (static guards)", () => {
  const files = ["app", "components", "lib"].flatMap((d) => walk(path.join(root, d))).filter((f) => /\.(tsx?|css)$/.test(f));

  it("contains no swipe UI", () => {
    const offenders = files.filter((f) => /(?<!non-)swipe|onTouchMove|drag=/i.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("keeps AppointmentEvent free of free-text columns", () => {
    const schema = readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
    const model = /model AppointmentEvent \{([\s\S]*?)\n\}/.exec(schema)![1];
    const stringCols = model
      .split("\n")
      .map((l) => l.trim().split(/\s+/))
      .filter(([name, type]) => type?.startsWith("String") && !["id", "appointmentId", "actorId"].includes(name));
    expect(stringCols).toEqual([]);
  });
});
