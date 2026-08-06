import { getStore } from "@netlify/blobs";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

type Params = { params: Promise<{ key: string }> };

// GET is intentionally public — the client-facing /approve page renders
// attached media without an internal login, addressed only by opaque key.
export async function GET(_req: NextRequest, { params }: Params) {
  const { key } = await params;
  const store = getStore("content-media");
  const result = await store.getWithMetadata(key, { type: "arrayBuffer" });
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = (result.metadata?.contentType as string) || "application/octet-stream";
  return new NextResponse(result.data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { key } = await params;
  const store = getStore("content-media");
  await store.delete(key);
  return NextResponse.json({ ok: true });
}
