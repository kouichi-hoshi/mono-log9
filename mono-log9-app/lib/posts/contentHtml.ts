import { generateHTML } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

import type { PostContent } from "@/lib/posts/types";

const RENDER_EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    link: {
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
    },
  }),
];

export function toSanitizableHtml(content: PostContent): string | null {
  try {
    return generateHTML(content, RENDER_EXTENSIONS);
  } catch {
    return null;
  }
}
