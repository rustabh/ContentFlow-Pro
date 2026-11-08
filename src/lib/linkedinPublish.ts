import type { ContentItem, PlatformConnection } from "./types";

type PublishResult = { ok: true } | { ok: false; error: string };

/** Register + upload an image asset, returning its URN to reference from the UGC post. Images only — LinkedIn video upload is a separate chunked-upload flow not implemented here. */
async function uploadImageAsset(
  connection: PlatformConnection,
  item: ContentItem
): Promise<{ urn: string } | { error: string }> {
  const register = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: `urn:li:organization:${connection.accountId}`,
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
        ],
      },
    }),
  });
  if (!register.ok) {
    const data = await register.json().catch(() => ({}));
    return { error: data.message ?? `LinkedIn asset registration failed (${register.status})` };
  }
  const registerData = await register.json();
  const uploadUrl =
    registerData.value?.uploadMechanism?.[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ]?.uploadUrl;
  const asset = registerData.value?.asset;
  if (!uploadUrl || !asset) return { error: "LinkedIn asset registration returned no upload URL" };

  const siteUrl = process.env.URL ?? process.env.DEPLOY_URL ?? "";
  const imageRes = await fetch(`${siteUrl}/api/media/${item.mediaKey}`);
  if (!imageRes.ok) return { error: "Could not read the attached image" };

  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      "Content-Type": item.mediaContentType ?? "application/octet-stream",
    },
    body: Buffer.from(await imageRes.arrayBuffer()),
  });
  if (!upload.ok) return { error: `LinkedIn image upload failed (${upload.status})` };

  return { urn: asset as string };
}

/**
 * Publish a post to a LinkedIn Company Page via the UGC Posts API. If the
 * content item has an attached image, it's uploaded as a LinkedIn media
 * asset and attached to the post; otherwise this posts caption + hashtags
 * as text only. Video posts aren't supported — LinkedIn requires a separate
 * chunked-upload flow for video.
 * `connection.accountId` is the organization URN's numeric ID (e.g. the
 * "12345" in `urn:li:organization:12345`).
 */
export async function publishToLinkedIn(
  connection: PlatformConnection,
  item: ContentItem
): Promise<PublishResult> {
  const message = [item.caption, item.hashtags].filter(Boolean).join("\n\n");
  const hasImage = item.mediaKey && (item.mediaContentType ?? "").startsWith("image/");

  try {
    let mediaUrn: string | null = null;
    if (hasImage) {
      const asset = await uploadImageAsset(connection, item);
      if ("error" in asset) return { ok: false, error: asset.error };
      mediaUrn = asset.urn;
    }

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
            shareMediaCategory: mediaUrn ? "IMAGE" : "NONE",
            ...(mediaUrn
              ? { media: [{ status: "READY", media: mediaUrn }] }
              : {}),
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
