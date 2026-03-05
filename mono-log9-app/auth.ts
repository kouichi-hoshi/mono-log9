import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertActorUserByGoogleSub } from "@/lib/auth/actorUser";
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
      const previousGoogleSub = typeof token.googleSub === "string" ? token.googleSub.trim() : "";
      if (account?.provider === "google") {
        const profileSub = typeof profile?.sub === "string" ? profile.sub : undefined;
        const googleSub = account.providerAccountId || profileSub;
        if (googleSub) {
          token.googleSub = googleSub;
        }
      }

      const googleSub = typeof token.googleSub === "string" ? token.googleSub.trim() : "";
      const shouldRefreshActorUserId =
        googleSub.length > 0 &&
        (typeof token.actorUserId !== "string" || previousGoogleSub !== googleSub);
      if (shouldRefreshActorUserId) {
        try {
          token.actorUserId = await upsertActorUserByGoogleSub({
            googleSub,
            email: typeof token.email === "string" ? token.email : null,
            name: typeof token.name === "string" ? token.name : null,
            image: typeof token.picture === "string" ? token.picture : null,
          });
        } catch {
          // Fallback to Server Action path when user resolution fails in callback.
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.googleSub === "string") {
        session.user.googleSub = token.googleSub;
      }
      if (session.user && typeof token.actorUserId === "string") {
        session.user.actorUserId = token.actorUserId;
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
