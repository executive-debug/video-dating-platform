export type SeedProfile = {
  email: string;
  firstName: string;
  dob: string;
  city: string;
  timeZone: string;
  occupation: string;
  industry: string;
  education: string;
  bio: string;
  intentions: string[];
  values: string[];
  interests: string[];
  lifestyle: string;
  wellness: string;
};

const FIRST_NAMES = [
  "Avery", "Blake", "Cameron", "Dana", "Elliot", "Finley", "Gray", "Harper", "Indigo", "Jules",
  "Kai", "Logan", "Morgan", "Noel", "Oakley", "Parker", "Quinn", "Reese", "Sage", "Taylor",
  "Uma", "Val", "Wren", "Xan", "Yael", "Zion", "Arden", "Briar", "Casey", "Devon",
];
const CITIES: [string, string][] = [
  ["New York, NY", "America/New_York"],
  ["Chicago, IL", "America/Chicago"],
  ["Denver, CO", "America/Denver"],
  ["San Francisco, CA", "America/Los_Angeles"],
  ["Austin, TX", "America/Chicago"],
  ["Boston, MA", "America/New_York"],
];
const OCCUPATIONS: [string, string][] = [
  ["Product Manager", "Technology"],
  ["Physician", "Healthcare"],
  ["Attorney", "Legal"],
  ["Architect", "Design"],
  ["Financial Analyst", "Finance"],
  ["Teacher", "Education"],
  ["Civil Engineer", "Engineering"],
  ["Marketing Director", "Media"],
];
const INTENTIONS = ["long-term", "marriage", "serious-dating", "open-to-see"];
const VALUES = ["curiosity", "family", "kindness", "ambition", "honesty", "adventure", "balance"];
const INTERESTS = ["hiking", "cooking", "jazz", "cycling", "reading", "travel", "pottery", "sailing", "film", "yoga"];

const pick = <T,>(list: T[], i: number, offset = 0) => list[(i + offset) % list.length];

/** Thirty deterministic, clearly fictional adult profiles (reserved .test email domain). */
export function buildSeedProfiles(): SeedProfile[] {
  return FIRST_NAMES.map((firstName, i) => {
    const [city, timeZone] = pick(CITIES, i);
    const [occupation, industry] = pick(OCCUPATIONS, i, 3);
    return {
      email: `seed${String(i + 1).padStart(2, "0")}@example.test`,
      firstName,
      dob: `${1978 + (i % 20)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
      city,
      timeZone,
      occupation,
      industry,
      education: i % 3 === 0 ? "Master's degree" : "Bachelor's degree",
      bio: `Fictional seed profile #${i + 1}. Enjoys ${pick(INTERESTS, i)} and ${pick(INTERESTS, i, 4)}.`,
      intentions: [pick(INTENTIONS, i)],
      values: [pick(VALUES, i), pick(VALUES, i, 2)],
      interests: [pick(INTERESTS, i), pick(INTERESTS, i, 3), pick(INTERESTS, i, 6)],
      lifestyle: i % 2 ? "Early riser, mostly home-cooked meals" : "Night owl, weekend traveller",
      wellness: i % 2 ? "Runs three times a week" : "Daily yoga",
    };
  });
}
