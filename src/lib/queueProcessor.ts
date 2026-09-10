import { readDb, writeDb } from "./db";
import { publishToLinkedIn } from "./linkedinPublish";
import { publishToMeta } from "./metaPublish";
import type { ContentItem, PlatformConnection } from "./types";
import { publishToYouTube } from "./youtubePublish";

/** Dispatch a publish attempt to the right platform API, or null if the platform has no real integration yet. */
async function publishTo(
  platform: ContentItem["platform"],
  connection: PlatformConnection,
  item: ContentItem
): Promise<{ ok: true } | { ok: false; error: string } | null> {
  switch (platform) {
    case "Instagram":
    case "Facebook":
      return publishToMeta(platform, connection, item);
    case "LinkedIn":
      return publishToLinkedIn(connection, item);
    case "YouTube":
      return publishToYouTube(connection, item);
    default:
      return null;
  }
}

/**
 * Publish every due "Scheduled" content item and mark it "Posted". If the
 * client has connected the item's platform (Instagram, Facebook, LinkedIn
 * or YouTube — see ClientForm "Platform Connections"), this attempts a real
 * publish first and only marks the item Posted on success; a failed publish
 * stays Scheduled with `postError` set so it's retried, not silently
 * dropped. Without a connection (or for platforms with no real integration
 * yet — Pinterest, TikTok, X, Threads), items are marked Posted directly
 * (manual posting workflow).
 *
 * Called both from the authenticated `/api/queue` POST route (manual "Run
 * Due Posts" button) and from the unauthenticated Netlify scheduled
 * function (netlify/functions/auto-publish.ts) that runs this automatically
 * every 15 minutes — so this function itself must not depend on a request
 * or a logged-in user.
 */
export async function processDueQueue(): Promise<{
  processed: number;
  failed: number;
  ids: string[];
}> {
  const db = await readDb();
  const nowIso = new Date().toISOString();
  const nowKey = nowIso.slice(0, 16);

  const processed: string[] = [];
  const failed: string[] = [];

  for (let i = 0; i < db.content.length; i++) {
    const item = db.content[i];
    if (item.status !== "Scheduled") continue;
    if (`${item.date}T${item.time}` > nowKey) continue;

    const client = db.clients.find((c) => c.id === item.clientId);
    const connection = client?.connections?.[item.platform];
    const result = connection ? await publishTo(item.platform, connection, item) : null;

    if (result === null) {
      db.content[i] = { ...item, status: "Posted", postedAt: nowIso };
      processed.push(item.id);
    } else if (result.ok) {
      db.content[i] = { ...item, status: "Posted", postedAt: nowIso, postError: undefined };
      processed.push(item.id);
    } else {
      db.content[i] = { ...item, postError: result.error };
      failed.push(item.id);
    }
  }

  if (processed.length > 0 || failed.length > 0) await writeDb(db);
  return { processed: processed.length, failed: failed.length, ids: processed };
}
