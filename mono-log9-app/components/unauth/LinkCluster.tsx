"use client";

import { Github, Mail, Twitter } from "lucide-react";

import { Button } from "@/components/ui/button";

const CONTACT_URL = "https://stella-d.net/#contact";

export default function LinkCluster() {
  return (
    <section className="space-y-3">
      <h3 className="sr-only">Link</h3>
      <div className="flex items-center gap-3">
        <a
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-foreground/10 transition hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
          href="https://github.com/kouichi-hoshi"
          aria-label="GitHub"
          target="_blank"
          rel="noreferrer"
        >
          <Github className="h-5 w-5" />
        </a>
        <a
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-foreground/10 transition hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
          href="https://x.com/stella_d_tweet"
          aria-label="X"
          target="_blank"
          rel="noreferrer"
        >
          <Twitter className="h-5 w-5" />
        </a>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="お問い合わせ"
          onClick={() => window.open(CONTACT_URL, "_blank", "noopener,noreferrer")}
        >
          <Mail className="h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}
