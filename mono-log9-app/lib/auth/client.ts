import { signIn, signOut } from "next-auth/react";

export async function signInGoogle(callbackUrl: string): Promise<void> {
  await signIn("google", { callbackUrl }, { prompt: "select_account" });
}

export async function signOutToRoot(): Promise<string> {
  const result = await signOut({
    callbackUrl: "/",
    redirect: false,
  });

  return result?.url ?? "/";
}
