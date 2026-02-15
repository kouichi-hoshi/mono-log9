import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TrashBulkActions from "@/components/authed/TrashBulkActions";

describe("TrashBulkActions", () => {
  it("shows select-visible label when no rows are selected", async () => {
    const user = userEvent.setup();
    const onToggleSelectAll = jest.fn();

    render(
      <TrashBulkActions
        hasSelection={false}
        selectedCount={0}
        hasTrashPosts
        onToggleSelectAll={onToggleSelectAll}
        onDeleteSelected={jest.fn()}
        onEmptyTrash={jest.fn()}
      />
    );

    expect(screen.getByText("表示されている投稿を選択")).toBeInTheDocument();
    expect(screen.queryByText("0件選択中")).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "表示されている投稿を選択" }));

    expect(onToggleSelectAll).toHaveBeenCalledTimes(1);
  });

  it("shows clear label and selected count when rows are selected", () => {
    render(
      <TrashBulkActions
        hasSelection
        selectedCount={2}
        hasTrashPosts
        onToggleSelectAll={jest.fn()}
        onDeleteSelected={jest.fn()}
        onEmptyTrash={jest.fn()}
      />
    );

    expect(screen.getByText("チェックを外す")).toBeInTheDocument();
    expect(screen.getByText("2件選択中")).toBeInTheDocument();
  });

  it("disables delete-selected button when no rows are selected", () => {
    render(
      <TrashBulkActions
        hasSelection={false}
        selectedCount={0}
        hasTrashPosts
        onToggleSelectAll={jest.fn()}
        onDeleteSelected={jest.fn()}
        onEmptyTrash={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "選択した投稿を削除" })).toBeDisabled();
  });

  it("disables empty-trash button when no trash posts are present", () => {
    render(
      <TrashBulkActions
        hasSelection={false}
        selectedCount={0}
        hasTrashPosts={false}
        onToggleSelectAll={jest.fn()}
        onDeleteSelected={jest.fn()}
        onEmptyTrash={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "ごみ箱を空にする" })).toBeDisabled();
  });
});
