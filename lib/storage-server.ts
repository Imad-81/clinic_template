import fs from "fs/promises";
import path from "path";

/**
 * Server-only file storage handler.
 * Can be swapped for an S3/R2 client without touching component code.
 */
export async function saveImage(file: File, folder: string): Promise<string> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: JPEG, PNG, WEBP, SVG`);
  }

  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSizeBytes) {
    throw new Error("File size exceeds 5MB limit");
  }

  // Sanitize extension
  const ext = path.extname(file.name).toLowerCase() || (file.type === "image/png" ? ".png" : ".jpg");
  // Sanitize filename
  const safeBaseName = path.basename(file.name, ext).replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
  const uniqueName = `${safeBaseName}_${Date.now()}${ext}`;

  const sanitizedFolder = folder.replace(/^\/+|\/+$/g, "");
  const relativeDir = path.join("images", sanitizedFolder);
  const targetDir = path.join(process.cwd(), "public", relativeDir);

  await fs.mkdir(targetDir, { recursive: true });

  const targetFilePath = path.join(targetDir, uniqueName);
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(targetFilePath, Buffer.from(arrayBuffer));

  return `/${relativeDir}/${uniqueName}`;
}
