import { APP_NAME } from "@/lib/appMeta";

export default function UnauthFooter() {
  return (
    <footer className="text-center text-xs text-foreground/60">
      © {APP_NAME}
    </footer>
  );
}
