import type { ContentItem, PlatformConnection } from "./types";

type PublishResult = { ok: true } | { ok: false; error: string };

/** YouTube access tokens expire hourly — always mint a fresh one via the refresh token before publishing. */
async function refreshAccessToken(connection: PlatformConnection): Promise<string | null> {
  if (!connection.refreshToken || !connection.clientId || !connection.clientSecret) return null;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: connection.clientId,
      client_secret: connection.clientSecret,
      refresh_token: connection.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

/**
 * Upload a video to YouTube via the Data API v3's simple multipart upload.
 * Requires the content item to have an attached video (`mediaKey` with a
 * video/* content type) — YouTube has no concept of a caption-only post,
 * unlike Instagram/Facebook/LinkedIn.
 */
export async function publishToYouTube(
  connection: PlatformConnection,
  item: ContentItem
): Promise<PublishResult> {
  if (!item.mediaKey || !(item.mediaContentType ?? "").startsWith("video/")) {
    return { ok: false, error: "YouTube requires an attached video" };
  }

  const accessToken = (await refreshAccessToken(connection)) ?? connection.accessToken;
  if (!accessToken) {
    return { ok: false, error: "No valid YouTube access token (refresh failed — check refresh token / OAuth client credentials)" };
  }

  try {
    const siteUrl = process.env.URL ?? process.env.DEPLOY_URL ?? "";
    const videoRes = await fetch(`${siteUrl}/api/media/${item.mediaKey}`);
    if (!videoRes.ok) return { ok: false, error: "Could not read the attached video" };
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    const boundary = `contentflow-${Date.now()}`;
    const metadata = {
      snippet: {
        title: item.topic || "Untitled",
        description: [item.caption, item.hashtags].filter(Boolean).join("\n\n"),
      },
      status: { privacyStatus: "public" },
    };

    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${item.mediaContentType}\r\n\r\n`
      ),
      videoBuffer,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const res = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error?.message ?? `YouTube upload failed (${res.status})` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
