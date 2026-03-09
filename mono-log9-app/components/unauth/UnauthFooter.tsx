import { APP_NAME } from "@/lib/appMeta";
import LinkCluster from "@/components/unauth/LinkCluster";

export default function UnauthFooter() {
  return (
    <footer className="border-t border-foreground/5 px-6 py-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
        <LinkCluster />
        <p className="text-xs text-foreground/40">© {APP_NAME}</p>
      </div>
    </footer>
  );
}
