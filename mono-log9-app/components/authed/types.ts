import type { JSONContent } from "@tiptap/core";

export type NoteDraft = {
  title: string;
  contentJson: JSONContent | null;
  plainText: string;
};
