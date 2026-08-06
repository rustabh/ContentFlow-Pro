import type { ContentItem, PlatformConnection } from "./types";

const GRAPH_API = "https://graph.facebook.com/v21.0";

type PublishResult = { ok: true } | { ok: false; error: string };

async function graphPost(
  path: string,
  accessToken: string,
  body: Record<string, string>
): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(`${GRAPH_API}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: accessToken }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * Publish a content item to Instagram or Facebook via the Meta Graph API.
 * Requires the client to have connected the platform (Settings → Clients →
 * Platform Connections) with a long-lived Page/IG access token.
 */
export async function publishToMeta(
  platform: "Instagram" | "Facebook",
  connection: PlatformConnection,
  item: ContentItem
): Promise<PublishResult> {
  const message = [item.caption, item.hashtags].filter(Boolean).join("\n\n");

  try {
    if (platform === "Facebook") {
      const { ok, data } = await graphPost(`${connection.accountId}/feed`, connection.accessToken, {
        message,
      });
      if (!ok) {
        const err = data.error as { message?: string } | undefined;
        return { ok: false, error: err?.message ?? "Facebook publish failed" };
      }
      return { ok: true };
    }

    // Instagram: create a media container, then publish it.
    if (!item.mediaKey) {
      return { ok: false, error: "Instagram requires an attached image or video" };
    }
    const siteUrl = process.env.URL ?? process.env.DEPLOY_URL ?? "";
    const mediaUrl = `${siteUrl}/api/media/${item.mediaKey}`;
    const isVideo = (item.mediaContentType ?? "").startsWith("video/");

    const created = await graphPost(`${connection.accountId}/media`, connection.accessToken, {
      caption: message,
      ...(isVideo ? { video_url: mediaUrl, media_type: "REELS" } : { image_url: mediaUrl }),
    });
    if (!created.ok) {
      const err = created.data.error as { message?: string } | undefined;
      return { ok: false, error: err?.message ?? "Instagram container creation failed" };
    }

    const published = await graphPost(`${connection.accountId}/media_publish`, connection.accessToken, {
      creation_id: String(created.data.id),
    });
    if (!published.ok) {
      const err = published.data.error as { message?: string } | undefined;
      return { ok: false, error: err?.message ?? "Instagram publish failed" };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
