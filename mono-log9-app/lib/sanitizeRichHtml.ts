import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "a", "br"];
const ALLOWED_ATTR = ["href", "target", "rel"];

export function sanitizeRichHtml(html: string): string {
  const sanitized = DOMPurify.sanitize(html, {
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
