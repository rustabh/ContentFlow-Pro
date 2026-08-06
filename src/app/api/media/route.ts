import { getStore } from "@netlify/blobs";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { uid } from "@/lib/utils";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_PREFIXES = ["image/", "video/"];

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_PREFIXES.some((p) => file.type.startsWith(p))) {
    return NextResponse.json({ error: "Only image or video files are allowed" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is larger than 25MB" }, { status: 400 });
  }

  const store = getStore("content-media");
  const key = uid();
  await store.set(key, await file.arrayBuffer(), {
    metadata: { contentType: file.type, name: file.name },
  });

  return NextResponse.json({ key, contentType: file.type }, { status: 201 });
}
