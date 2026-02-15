import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "a", "br"];
const ALLOWED_ATTR = ["href", "target", "rel"];

type PurifyLike = {
  sanitize: (html: string, options: { ALLOWED_TAGS: string[]; ALLOWED_ATTR: string[] }) => string;
};

function resolvePurifier(): PurifyLike | null {
  const purifier = DOMPurify as unknown;

  if (purifier && typeof (purifier as { sanitize?: unknown }).sanitize === "function") {
    return purifier as PurifyLike;
  }

  if (typeof window === "undefined") {
    return null;
  }

  if (typeof purifier === "function") {
    const instance = (purifier as (root: Window) => unknown)(window);
    if (instance && typeof (instance as { sanitize?: unknown }).sanitize === "function") {
      return instance as PurifyLike;
    }
  }

  return null;
}

export function sanitizeRichHtml(html: string): string {
  const purifier = resolvePurifier();
  if (!purifier) {
    return "";
  }

  const sanitized = purifier.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });

  if (typeof window === "undefined") {
    return sanitized;
  }

  const parser = new window.DOMParser();
  const doc = parser.parseFromString(sanitized, "text/html");

  doc.querySelectorAll("a").forEach((anchor) => {
    if (!anchor.getAttribute("href")) {
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
      return;
    }

    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener noreferrer");
  });

  return doc.body.innerHTML;
}
