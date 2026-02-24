import { APP_NAME } from "@/lib/appMeta";

export default function UnauthHeader() {
  return (
    <header className="text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
    </header>
  );
}
