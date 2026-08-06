import { getStore } from "@netlify/blobs";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ key: string }> };

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

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { key } = await params;
  const store = getStore("content-media");
  await store.delete(key);
  return NextResponse.json({ ok: true });
}
