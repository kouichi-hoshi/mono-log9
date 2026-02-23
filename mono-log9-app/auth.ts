import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const providers =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
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
