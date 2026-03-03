import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TrashPostCard from "@/components/authed/TrashPostCard";
import { createDocFromPlainText } from "@/lib/posts/content";
import type { PostRecord } from "@/lib/posts/types";

describe("TrashPostCard", () => {
  it("calls onCheckedChange with postId and checked value", async () => {
    const user = userEvent.setup();
    const onCheckedChange = jest.fn();
    const post: PostRecord = {
      id: "trash-001",
      mode: "memo",
      content: createDocFromPlainText("削除対象"),
      contentText: "削除対象",
      createdAt: "2026-02-15 12:00",
      favorite: false,
      trashedAt: "2026-02-16 09:00",
      trashedAtEpochMs: 1708041600000,
    };

    render(
      <TrashPostCard
        post={post}
        checked={false}
        onCheckedChange={onCheckedChange}
        onRestore={jest.fn()}
        onPermanentDelete={jest.fn()}
      />
    );

    await user.click(screen.getByLabelText("trash-001を選択"));

    expect(onCheckedChange).toHaveBeenCalledWith("trash-001", true);
  });

  it("calls restore and permanent-delete handlers with postId", async () => {
    const user = userEvent.setup();
    const onRestore = jest.fn();
    const onPermanentDelete = jest.fn();
    const post: PostRecord = {
      id: "trash-002",
      mode: "note",
      title: "ノートタイトル",
      content: createDocFromPlainText("ノート本文"),
      contentText: "ノート本文",
      createdAt: "2026-02-15 12:00",
      favorite: false,
      trashedAt: "2026-02-16 09:00",
      trashedAtEpochMs: 1708041600000,
    };

    render(
      <TrashPostCard
        post={post}
        checked={false}
        onCheckedChange={jest.fn()}
        onRestore={onRestore}
        onPermanentDelete={onPermanentDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: "復元" }));
    await user.click(screen.getByRole("button", { name: "完全に削除" }));

    expect(onRestore).toHaveBeenCalledWith("trash-002");
    expect(onPermanentDelete).toHaveBeenCalledWith("trash-002");
  });
});
