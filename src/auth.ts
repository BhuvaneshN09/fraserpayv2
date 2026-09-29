import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticateCredentials } from "@/lib/credentials";
import { prisma } from "@/lib/prisma";
import { fraserPayAdapter } from "@/lib/auth-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: fraserPayAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "PDSB email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (typeof credentials.email !== "string" || typeof credentials.password !== "string") {
          return null;
        }

        return authenticateCredentials(credentials.email, credentials.password);
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: { signIn: "/login" },
});