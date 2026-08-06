import type { ContentItem, PlatformConnection } from "./types";

type PublishResult = { ok: true } | { ok: false; error: string };

/**
 * Publish a text post to a LinkedIn Company Page via the UGC Posts API.
 * `connection.accountId` is the organization URN's numeric ID (e.g. the
 * "12345" in `urn:li:organization:12345`). Image/video posts aren't
 * supported yet — LinkedIn requires a separate multi-step asset upload for
 * media, so this posts caption + hashtags as text only.
 */
export async function publishToLinkedIn(
  connection: PlatformConnection,
  item: ContentItem
): Promise<PublishResult> {
  const message = [item.caption, item.hashtags].filter(Boolean).join("\n\n");

  try {
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: `urn:li:organization:${connection.accountId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: message },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.message ?? `LinkedIn publish failed (${res.status})` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
