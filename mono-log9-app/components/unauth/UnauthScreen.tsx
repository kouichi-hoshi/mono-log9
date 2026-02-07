import LoginDialog from "@/components/auth/LoginDialog";
import LinkCluster from "@/components/unauth/LinkCluster";
import UnauthFooter from "@/components/unauth/UnauthFooter";
import UnauthHeader from "@/components/unauth/UnauthHeader";
import WelcomeContent from "@/components/unauth/WelcomeContent";

export default function UnauthScreen() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <UnauthHeader />
        <main className="space-y-8">
          <WelcomeContent />
          <LinkCluster />
          <div className="pt-2">
            <LoginDialog />
          </div>
        </main>
        <UnauthFooter />
      </div>
    </div>
  );
}
