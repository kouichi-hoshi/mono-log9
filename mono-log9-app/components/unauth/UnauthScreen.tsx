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
    <div className="bg-background text-foreground min-h-screen flex flex-col justify-center px-4 w-fit mx-auto lg:text-center">
      <div className="flex flex-col gap-8">
        <UnauthHeader />
        <main className="space-y-8">
          <WelcomeContent />
          <LinkCluster />
          <LoginDialog authMode={authMode} callbackUrl={callbackUrl} />
        </main>
        <UnauthFooter />
      </div>
    </div>
  );
}
