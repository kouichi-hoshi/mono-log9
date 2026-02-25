import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import {
  createStubAuthForbiddenError,
  isStubAuthMisconfigured,
} from "@/lib/env";

const providers =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : [];

const { handlers, auth: authImpl, signIn, signOut } = NextAuth({
  providers,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google") {
        const profileSub = typeof profile?.sub === "string" ? profile.sub : undefined;
        const googleSub = account.providerAccountId || profileSub;
        if (googleSub) {
          token.googleSub = googleSub;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.googleSub === "string") {
        session.user.googleSub = token.googleSub;
      }

      return session;
    },
  },
});

export { handlers, signIn, signOut };

function authWithGuard(...args: Parameters<typeof authImpl>): ReturnType<typeof authImpl> {
  if (isStubAuthMisconfigured()) {
    throw createStubAuthForbiddenError();
  }
  return authImpl(...args);
}

/** 公開型を authImpl と同一に維持しつつガードを挟む（auth(handler) 契約を保護） */
export const auth = authWithGuard as unknown as typeof authImpl;
