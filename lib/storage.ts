/**
 * Client-safe image URL abstraction
 */

export function getImageUrl(filePath?: string | null): string {
  if (!filePath) return "/images/placeholder-doctor.svg";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  // Ensure leading slash
  return filePath.startsWith("/") ? filePath : `/${filePath}`;
}
