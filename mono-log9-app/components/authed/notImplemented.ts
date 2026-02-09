"use client";

import { toast } from "sonner";

export const notifyNotImplemented = (actionLabel: string) => {
  toast("未実装", {
    description: `${actionLabel} は未実装です。`,
  });
};
