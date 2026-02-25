import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const ADMIN_EMAIL = "yylwdyx@gmail.com";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Attach user id + role to the session
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: string }).role ?? "user";
      }
      return session;
    },
    // Auto-promote admin on first sign-in
    async signIn({ user }) {
      if (user.email === ADMIN_EMAIL) {
        await prisma.user.update({
          where: { email: ADMIN_EMAIL },
          data: { role: "admin" },
        }).catch(() => { /* user may not exist yet, first-time sign-in */ });
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
};
