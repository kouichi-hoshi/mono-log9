import type { PostMode } from "@/lib/posts/types";

export type ViewMode = PostMode;

export type StubUser = {
  name: string;
  handle: string;
};

export const stubUser: StubUser = {
  name: "テストユーザー",
  handle: "@mono-log",
};
