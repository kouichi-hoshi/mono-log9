import LoginDialog from "@/components/auth/LoginDialog";
import type { AuthMode } from "@/lib/auth/types";
import LinkCluster from "@/components/unauth/LinkCluster";
import UnauthFooter from "@/components/unauth/UnauthFooter";
import UnauthHeader from "@/components/unauth/UnauthHeader";
import WelcomeContent from "@/components/unauth/WelcomeContent";

type UnauthScreenProps = {
  authMode: AuthMode;
  callbackUrl: string;
};

export default function UnauthScreen({
  authMode,
  callbackUrl,
}: UnauthScreenProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <UnauthHeader />
        <main className="space-y-8">
          <WelcomeContent />
          <LinkCluster />
          <div className="pt-2">
            <LoginDialog authMode={authMode} callbackUrl={callbackUrl} />
          </div>
        </main>
        <UnauthFooter />
      </div>
    </div>
  );
}
