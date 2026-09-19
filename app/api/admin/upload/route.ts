import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { saveImage } from "@/lib/storage-server";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "doctors";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const savedPath = await saveImage(file, folder);
    return NextResponse.json({ success: true, path: savedPath });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload image" },
      { status: 500 }
    );
  }
}
