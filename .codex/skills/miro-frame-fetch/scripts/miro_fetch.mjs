import fs from "fs";
import path from "path";

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

function parseEnvFile(envPath) {
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const match = line.match(
      /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/
    );
    if (match) {
      env[match[1]] = match[2];
    }
  }
  return env;
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
    "Usage: node miro_fetch.mjs --env /path/.env.miro --list-frames | --frame-title \"Title\" | --frame-id ID"
  );
  process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.env) usageAndExit();

  const envPath = path.resolve(args.env);
  if (!fs.existsSync(envPath)) {
    throw new Error(`Env file not found: ${envPath}`);
  }

  const env = parseEnvFile(envPath);
  const token = env.MIRO_OAUTH_TOKEN;
  const boardId = env.MIRO_BOARD_ID;

  if (!token || !boardId) {
    throw new Error("Missing MIRO_OAUTH_TOKEN or MIRO_BOARD_ID in env file.");
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
