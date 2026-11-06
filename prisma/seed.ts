import { PrismaClient } from "@prisma/client";
import { buildSeedProfiles } from "./seed-data";

const db = new PrismaClient();

async function main() {
  const now = new Date();

  for (const p of buildSeedProfiles()) {
    const user = await db.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        name: p.firstName,
        emailVerified: now,
        dob: new Date(`${p.dob}T00:00:00Z`),
        verificationStatus: "VERIFIED",
      },
    });

    await db.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        firstName: p.firstName,
        city: p.city,
        timeZone: p.timeZone,
        occupation: p.occupation,
        industry: p.industry,
        education: p.education,
        bio: p.bio,
        intentions: p.intentions,
        values: p.values,
        interests: p.interests,
        lifestyle: p.lifestyle,
        wellness: p.wellness,
        status: "PUBLISHED",
        authoredBy: "SELF",
      },
    });

    await db.onboardingProgress.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        completedSteps: [1, 2, 3, 4, 5, 6, 7],
        profilePath: "BUILD_OWN",
        completedAt: now,
      },
    });

    await db.preference.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, ageMin: 25, ageMax: 50, distanceKm: 50, filters: { intentions: p.intentions, dealbreakers: [] } },
    });

    if ((await db.photo.count({ where: { userId: user.id } })) === 0) {
      await db.photo.createMany({
        data: [0, 1, 2].map((order) => ({
          userId: user.id,
          url: `https://example.test/seed/${p.email.split("@")[0]}-${order}.jpg`,
          order,
          isPrimary: order === 0,
          moderationStatus: "APPROVED" as const,
        })),
      });
    }
  }

  for (const [email, role] of [
    ["consultant@example.test", "CONSULTANT"],
    ["admin@example.test", "ADMIN"],
  ] as const) {
    await db.user.upsert({
      where: { email },
      update: {},
      create: { email, role, emailVerified: now, dob: new Date("1985-01-01T00:00:00Z"), verificationStatus: "VERIFIED" },
    });
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
