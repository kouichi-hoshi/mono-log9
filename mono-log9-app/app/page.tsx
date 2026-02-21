import { auth } from "@/auth";
import { stubUser, type AuthedUser } from "@/components/authed/stubs";
import AuthedScreen from "@/components/authed/AuthedScreen";
import UnauthScreen from "@/components/unauth/UnauthScreen";
import { buildCallbackPathFromSearchParams } from "@/lib/auth/callbackUrl";
import type { AuthMode } from "@/lib/auth/types";
import { getStubAuthEnabled } from "@/lib/env";
import {
  buildUrlWithStubAuth,
  isStubAuthed,
  type PageSearchParams,
} from "@/lib/stubAuth";

type HomeProps = {
  searchParams?: Promise<PageSearchParams> | PageSearchParams;
};

function toUserHandle(email: string | null | undefined): string {
  if (!email) {
    return "@mono-log";
  }

  const localPart = email.split("@")[0]?.trim();
  if (!localPart) {
    return "@mono-log";
  }

  return `@${localPart}`;
}

function toAuthedUser(
  user: { name?: string | null; email?: string | null; image?: string | null } | undefined
): AuthedUser {
  return {
    name: user?.name?.trim() || stubUser.name,
    handle: toUserHandle(user?.email),
    imageUrl: user?.image ?? null,
  };
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const stubAuthEnabled = getStubAuthEnabled();
  const authMode: AuthMode = stubAuthEnabled ? "stub" : "authjs";
  const stubAuthed = isStubAuthed(resolvedSearchParams, stubAuthEnabled);
  const callbackUrl = buildCallbackPathFromSearchParams(resolvedSearchParams);

  if (stubAuthed) {
    return (
      <AuthedScreen
        authMode="stub"
        user={stubUser}
      />
    );
  }

  if (authMode === "authjs") {
    const session = await auth();

    if (session?.user) {
      return <AuthedScreen authMode="authjs" user={toAuthedUser(session.user)} />;
    }
  }

  return (
    <UnauthScreen
      authMode={authMode}
      callbackUrl={
        authMode === "stub" ? buildUrlWithStubAuth(resolvedSearchParams) : callbackUrl
      }
    />
  );
}
