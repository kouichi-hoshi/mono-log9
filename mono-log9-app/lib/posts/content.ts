import type { JSONContent } from "@tiptap/core";

import { PostRepositoryError } from "@/lib/posts/errors";
import type { PostContent, PostMode } from "@/lib/posts/types";

const INVALID_INPUT_MESSAGE = "入力内容に不備があります";
const EMPTY_CONTENT_MESSAGE = "内容を入力してください";
const MEMO_LIMIT_MESSAGE = "内容は最大280文字までです";
const NOTE_LIMIT_MESSAGE = "内容は最大25000文字までです";

const ALLOWED_NODE_TYPES = new Set([
  "doc",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "text",
  "hardBreak",
]);

const ALLOWED_MARK_TYPES = new Set(["bold", "link"]);
const BLOCK_END_NODE_TYPES = new Set(["paragraph", "heading", "listItem"]);
const ROOT_CHILD_NODE_TYPES = new Set(["paragraph", "heading", "bulletList", "orderedList"]);
const INLINE_NODE_TYPES = new Set(["text", "hardBreak"]);
const LIST_NODE_TYPES = new Set(["listItem"]);
const LIST_ITEM_CHILD_NODE_TYPES = new Set(["paragraph", "heading", "bulletList", "orderedList"]);

type JsonRecord = Record<string, unknown>;

function isObject(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function throwValidationError(message = INVALID_INPUT_MESSAGE): never {
  throw new PostRepositoryError("VALIDATION_ERROR", message);
}

function cloneUnknown<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function appendTextFromNode(node: PostContent, chunks: string[]) {
  const nodeType = node.type;

  if (nodeType === "text") {
    if (typeof node.text === "string") {
      chunks.push(node.text);
    }
    return;
  }

  if (nodeType === "hardBreak") {
    chunks.push("\n");
    return;
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      appendTextFromNode(child, chunks);
    }
  }

  if (typeof nodeType === "string" && BLOCK_END_NODE_TYPES.has(nodeType)) {
    chunks.push("\n");
  }
}

function normalizeContentText(raw: string, mode: PostMode): string {
  const normalizedLines = raw
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (mode === "memo") {
    return normalizedLines.replace(/\n+/g, " ").replace(/\s{2,}/g, " ").trim();
  }

  return normalizedLines;
}

function validateMark(mark: unknown) {
  if (!isObject(mark) || typeof mark.type !== "string") {
    throwValidationError();
  }

  if (!ALLOWED_MARK_TYPES.has(mark.type)) {
    throwValidationError();
  }

  if (mark.type === "link") {
    if (!isObject(mark.attrs) || typeof mark.attrs.href !== "string" || mark.attrs.href.length === 0) {
      throwValidationError();
    }
  }
}

function validateChildren(content: unknown, allowedChildTypes: Set<string>) {
  if (!Array.isArray(content)) {
    throwValidationError();
  }

  for (const child of content) {
    if (!isObject(child) || typeof child.type !== "string" || !allowedChildTypes.has(child.type)) {
      throwValidationError();
    }

    validateNode(child, false);
  }
}

function validateNode(node: unknown, isRoot: boolean) {
  if (!isObject(node)) {
    throwValidationError();
  }

  if (typeof node.type !== "string") {
    throwValidationError();
  }

  if (!ALLOWED_NODE_TYPES.has(node.type)) {
    throwValidationError();
  }

  if (isRoot && node.type !== "doc") {
    throwValidationError();
  }

  if (!isRoot && node.type === "doc") {
    throwValidationError();
  }

  if (node.type === "heading") {
    if (!isObject(node.attrs)) {
      throwValidationError();
    }

    const level = node.attrs.level;
    if (level !== 2 && level !== 3 && level !== 4) {
      throwValidationError();
    }
  }

  if (typeof node.marks !== "undefined") {
    if (node.type !== "text") {
      throwValidationError();
    }

    if (!Array.isArray(node.marks)) {
      throwValidationError();
    }

    for (const mark of node.marks) {
      validateMark(mark);
    }
  }

  if (node.type === "text") {
    if (typeof node.text !== "string" || typeof node.content !== "undefined") {
      throwValidationError();
    }
    return;
  }

  if (node.type === "hardBreak") {
    if (typeof node.content !== "undefined") {
      throwValidationError();
    }
    return;
  }

  if (node.type === "doc") {
    validateChildren(node.content, ROOT_CHILD_NODE_TYPES);
    return;
  }

  if (node.type === "paragraph" || node.type === "heading") {
    if (typeof node.content === "undefined") {
      return;
    }

    validateChildren(node.content, INLINE_NODE_TYPES);
    return;
  }

  if (node.type === "bulletList" || node.type === "orderedList") {
    validateChildren(node.content, LIST_NODE_TYPES);
    return;
  }

  if (node.type === "listItem") {
    validateChildren(node.content, LIST_ITEM_CHILD_NODE_TYPES);
    return;
  }

  if (typeof node.content !== "undefined") {
    throwValidationError();
  }
}

export function clonePostContent(content: PostContent): PostContent {
  return cloneUnknown(content);
}

export function createDocFromPlainText(text: string): PostContent {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const content: JSONContent[] = [];

  for (const line of lines) {
    if (line.length > 0) {
      content.push({ type: "text", text: line });
    }
    content.push({ type: "hardBreak" });
  }

  if (content.length > 0) {
    content.pop();
  }

  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: content.length > 0 ? content : undefined,
      },
    ],
  };
}

export function assertValidPostContent(content: unknown): asserts content is PostContent {
  validateNode(content, true);
}

export function extractContentText(content: PostContent, mode: PostMode): string {
  const chunks: string[] = [];
  appendTextFromNode(content, chunks);
  return normalizeContentText(chunks.join(""), mode);
}

export function assertContentTextByMode(contentText: string, mode: PostMode) {
  if (contentText.trim().length === 0) {
    throwValidationError(EMPTY_CONTENT_MESSAGE);
  }

  if (mode === "memo" && contentText.length > 280) {
    throwValidationError(MEMO_LIMIT_MESSAGE);
  }

  if (mode === "note" && contentText.length > 25000) {
    throwValidationError(NOTE_LIMIT_MESSAGE);
  }
}

export function normalizePostTitle(title: unknown, mode: PostMode): string | undefined {
  if (mode === "memo") {
    return undefined;
  }

  if (typeof title === "undefined") {
    return undefined;
  }

  if (typeof title !== "string") {
    throwValidationError();
  }

  const normalized = title.trim();
  if (normalized.length === 0) {
    return undefined;
  }

  if (normalized.length > 100) {
    throwValidationError();
  }

  return normalized;
}
