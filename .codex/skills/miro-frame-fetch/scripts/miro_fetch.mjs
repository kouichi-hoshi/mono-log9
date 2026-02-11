function parseArgs(argv) {
  const args = { env: "", listFrames: false, frameTitle: "", frameId: "" };
  for (let i = 2; i < argv.length; i += 1) {
    const cur = argv[i];
    if (cur === "--env") {
      args.env = argv[i + 1] || "";
      i += 1;
    } else if (cur === "--list-frames") {
      args.listFrames = true;
    } else if (cur === "--frame-title") {
      args.frameTitle = argv[i + 1] || "";
      i += 1;
    } else if (cur === "--frame-id") {
      args.frameId = argv[i + 1] || "";
      i += 1;
    }
  }
  return args;
}

async function fetchJson(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Miro API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function usageAndExit() {
  console.error(
    "Usage: MIRO_OAUTH_TOKEN=... MIRO_BOARD_ID=... node miro_fetch.mjs --list-frames | --frame-title \"Title\" | --frame-id ID"
  );
  process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.env) {
    console.error(
      "Note: --env is ignored. Load MIRO_OAUTH_TOKEN/MIRO_BOARD_ID outside this script (e.g., via `source .env.miro`)."
    );
  }

  const token = process.env.MIRO_OAUTH_TOKEN || "";
  const boardId = process.env.MIRO_BOARD_ID || "";

  if (!token || !boardId) {
    usageAndExit();
  }

  const framesUrl = `https://api.miro.com/v2/boards/${boardId}/items?type=frame&limit=50`;
  const framesRes = await fetchJson(framesUrl, token);
  const frames = framesRes.data || [];

  if (args.listFrames) {
    console.log(JSON.stringify({ boardId, frames }, null, 2));
    return;
  }

  let targetFrame = null;
  if (args.frameId) {
    targetFrame = frames.find((f) => f.id === args.frameId);
  } else if (args.frameTitle) {
    targetFrame = frames.find((f) =>
      String(f.data?.title || "").includes(args.frameTitle)
    );
  }

  if (!targetFrame) {
    throw new Error("Target frame not found. Use --list-frames to confirm.");
  }

  const itemsUrl = `https://api.miro.com/v2/boards/${boardId}/items?parent_item_id=${targetFrame.id}&limit=50`;
  const itemsRes = await fetchJson(itemsUrl, token);
  const items = itemsRes.data || [];

  console.log(
    JSON.stringify(
      {
        boardId,
        frame: {
          id: targetFrame.id,
          title: targetFrame.data?.title || "",
          geometry: targetFrame.geometry,
          position: targetFrame.position,
        },
        items,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
