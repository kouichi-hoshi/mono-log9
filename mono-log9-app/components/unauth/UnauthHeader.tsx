import { NotebookPen } from "lucide-react";

import { APP_NAME } from "@/lib/appMeta";

export default function UnauthHeader() {
  return (
    <header className="flex items-center gap-3 md:gap-4">
      <NotebookPen
        className="h-10 w-10 md:h-14 md:w-14"
        strokeWidth={1.5}
      />
      <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
        {APP_NAME}
      </h1>
    </header>
  );
}
