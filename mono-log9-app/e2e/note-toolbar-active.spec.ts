import { expect, test, type Page } from "@playwright/test";

async function setSelection(page: Page, start: number, end: number) {
  await page.getByLabel("ノート本文").evaluate((element, range) => {
    const editor = element as HTMLElement;
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let currentOffset = 0;
    let startNode: Text | null = null;
    let endNode: Text | null = null;
    let startOffset = 0;
    let endOffset = 0;

    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const textLength = node.textContent?.length ?? 0;
      const nextOffset = currentOffset + textLength;

      if (!startNode && range.start <= nextOffset) {
        startNode = node;
        startOffset = Math.max(0, range.start - currentOffset);
      }

      if (!endNode && range.end <= nextOffset) {
        endNode = node;
        endOffset = Math.max(0, range.end - currentOffset);
        break;
      }

      currentOffset = nextOffset;
    }

    if (!startNode || !endNode) {
      throw new Error("selection target was not found");
    }

    const selection = window.getSelection();
    const selectionRange = document.createRange();
    selectionRange.setStart(startNode, startOffset);
    selectionRange.setEnd(endNode, endOffset);
    selection?.removeAllRanges();
    selection?.addRange(selectionRange);
    editor.focus();
    document.dispatchEvent(new Event("selectionchange"));
  }, { start, end });
}

async function setCaret(page: Page, offset: number) {
  await setSelection(page, offset, offset);
}

test("太字ボタンは選択中の装飾状態に追従する", async ({ page }) => {
  await page.goto("/?stubAuth=1&view=note");
  await page.getByRole("button", { name: "ノートを書く" }).click();

  const editor = page.getByLabel("ノート本文");
  await editor.click();
  await editor.pressSequentially("bold plain");

  const boldButton = page.getByRole("button", { name: "太字" });

  await setSelection(page, 0, 4);
  await boldButton.click();
  await expect(boldButton).toHaveAttribute("aria-pressed", "true");

  await setCaret(page, 6);
  await expect(boldButton).toHaveAttribute("aria-pressed", "false");

  await setCaret(page, 2);
  await expect(boldButton).toHaveAttribute("aria-pressed", "true");
});
