import type { ContentItem, PlatformConnection } from "./types";

type PublishResult = { ok: true } | { ok: false; error: string };

/**
 * Create a Pin on Pinterest via API v5. `connection.accountId` is the
 * target board ID. Pinterest pins always need an image — unlike the other
 * platforms there's no text-only fallback.
 */
export async function publishToPinterest(
  connection: PlatformConnection,
  item: ContentItem
): Promise<PublishResult> {
  if (!item.mediaKey || !(item.mediaContentType ?? "").startsWith("image/")) {
    return { ok: false, error: "Pinterest requires an attached image" };
  }

  const siteUrl = process.env.URL ?? process.env.DEPLOY_URL ?? "";
  const mediaUrl = `${siteUrl}/api/media/${item.mediaKey}`;
  const description = [item.caption, item.hashtags].filter(Boolean).join("\n\n");

  try {
    const res = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        board_id: connection.accountId,
        title: item.topic || undefined,
        description,
        media_source: { source_type: "image_url", url: mediaUrl },
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.message ?? `Pinterest publish failed (${res.status})` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
