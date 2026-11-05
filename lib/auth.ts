import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { createTransport } from "nodemailer";
import { db } from "@/lib/db";

const emailServer = process.env.EMAIL_SERVER;
const emailFrom = process.env.EMAIL_FROM ?? "no-reply@example.test";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  trustHost: true,
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/check-email",
  },
  providers: [
    Nodemailer({
      server: emailServer ?? "smtp://localhost:1025",
      from: emailFrom,
      async sendVerificationRequest({ identifier, url, provider }) {
        if (!emailServer) {
          if (process.env.NODE_ENV === "production") {
            throw new Error("EMAIL_SERVER is not configured");
          }
          // Development only: print the link, never the address.
          console.info(`[dev] magic link: ${url}`);
          return;
        }
        const transport = createTransport(provider.server);
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: "Your sign-in link",
          text: `Sign in using this link (valid for 24 hours):\n${url}\n\nIf you did not request it, ignore this email.`,
        });
        const failed = [...(result.rejected ?? []), ...(result.pending ?? [])];
        if (failed.length) throw new Error("Email could not be sent");
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Under-18 accounts are permanently blocked, server-side.
      if (user.id) {
        const row = await db.user.findUnique({
          where: { id: user.id },
          select: { ageBlockedAt: true },
        });
        if (row?.ageBlockedAt) return "/age-blocked";
      }
      return true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
