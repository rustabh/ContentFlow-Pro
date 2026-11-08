import type { ContentItem, PlatformConnection } from "./types";

type PublishResult = { ok: true } | { ok: false; error: string };

const API = "https://api.x.com/2";

/** Upload the item's attached image to X and return its media_id, via the v2 chunked media upload (single chunk — images are well under the 5MB-per-chunk limit). */
async function uploadImageMedia(
  connection: PlatformConnection,
  item: ContentItem
): Promise<{ mediaId: string } | { error: string }> {
  const siteUrl = process.env.URL ?? process.env.DEPLOY_URL ?? "";
  const imageRes = await fetch(`${siteUrl}/api/media/${item.mediaKey}`);
  if (!imageRes.ok) return { error: "Could not read the attached image" };
  const bytes = Buffer.from(await imageRes.arrayBuffer());

  const auth = { Authorization: `Bearer ${connection.accessToken}` };

  const init = await fetch(`${API}/media/upload`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      media_category: "tweet_image",
      media_type: item.mediaContentType ?? "image/jpeg",
      total_bytes: bytes.length,
    }),
  });
  if (!init.ok) {
    const data = await init.json().catch(() => ({}));
    return { error: data.detail ?? `X media init failed (${init.status})` };
  }
  const mediaId = (await init.json()).data?.id as string | undefined;
  if (!mediaId) return { error: "X media init returned no media id" };

  const form = new FormData();
  form.append("segment_index", "0");
  form.append("media", new Blob([bytes], { type: item.mediaContentType ?? "image/jpeg" }));
  const append = await fetch(`${API}/media/upload/${mediaId}/append`, {
    method: "POST",
    headers: auth,
    body: form,
  });
  if (!append.ok) return { error: `X media upload failed (${append.status})` };

  const finalize = await fetch(`${API}/media/upload/${mediaId}/finalize`, {
    method: "POST",
    headers: auth,
  });
  if (!finalize.ok) return { error: `X media finalize failed (${finalize.status})` };

  return { mediaId };
}

/**
 * Post to X (Twitter) via API v2, using a per-client OAuth 2.0 user-context
 * access token with `tweet.write` scope stored as `connection.accessToken`
 * (`accountId` isn't needed — the token itself identifies the account).
 * Attaches the content item's image if there is one; video isn't
 * supported here (X's chunked video upload needs a longer-lived multi-step
 * flow this doesn't implement).
 */
export async function publishToX(
  connection: PlatformConnection,
  item: ContentItem
): Promise<PublishResult> {
  const text = [item.caption, item.hashtags].filter(Boolean).join("\n\n").slice(0, 280);
  const hasImage = item.mediaKey && (item.mediaContentType ?? "").startsWith("image/");

  try {
    let mediaId: string | null = null;
    if (hasImage) {
      const media = await uploadImageMedia(connection, item);
      if ("error" in media) return { ok: false, error: media.error };
      mediaId = media.mediaId;
    }

    const res = await fetch(`${API}/tweets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        ...(mediaId ? { media: { media_ids: [mediaId] } } : {}),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.detail ?? `X publish failed (${res.status})` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
