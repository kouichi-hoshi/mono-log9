import AuthedScreen from "@/components/authed/AuthedScreen";
import UnauthScreen from "@/components/unauth/UnauthScreen";
import { getStubAuthEnabled } from "@/lib/env";
import {
  buildUrlWithStubAuth,
  buildUrlWithoutStubAuth,
  isStubAuthed,
  type PageSearchParams,
} from "@/lib/stubAuth";

type HomeProps = {
  searchParams?: Promise<PageSearchParams> | PageSearchParams;
};

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const stubAuthEnabled = getStubAuthEnabled();
  const authed = isStubAuthed(resolvedSearchParams, stubAuthEnabled);

  if (authed) {
    return <AuthedScreen logoutUrl={buildUrlWithoutStubAuth(resolvedSearchParams)} />;
  }

  return (
    <UnauthScreen
      stubAuthEnabled={stubAuthEnabled}
      loginUrl={buildUrlWithStubAuth(resolvedSearchParams)}
    />
  );
}
