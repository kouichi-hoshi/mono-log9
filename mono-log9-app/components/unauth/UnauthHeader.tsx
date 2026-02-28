import { APP_NAME } from "@/lib/appMeta";

export default function UnauthHeader() {
  return (
    <header className="lg:text-center">
      <h1 className="text-6xl font-semibold tracking-tight">{APP_NAME}</h1>
    </header>
  );
}
