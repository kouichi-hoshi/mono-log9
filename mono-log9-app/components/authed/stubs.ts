import type { PostMode } from "@/lib/posts/types";

export type ViewMode = PostMode;

export type AuthedUser = {
  name: string;
  handle: string;
  imageUrl?: string | null;
};

export type StubUser = AuthedUser;

export const stubUser: AuthedUser = {
  name: "テストユーザー",
  handle: "@mono-log",
  imageUrl: null,
};
