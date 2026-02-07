"use client";

import * as React from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      closeButton
      richColors
      toastOptions={{
        className: "bg-background text-foreground border border-foreground/10",
      }}
      {...props}
    />
  );
};

export { Toaster };
