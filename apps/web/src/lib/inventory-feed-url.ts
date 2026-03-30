/**
 * URLs de feeds de inventario (KiteProp / portales): solo https en producción.
 */
export function isAllowedInventoryFeedUrl(url: string): boolean {
  const u = url.trim();
  if (!u) return true;
  try {
    const parsed = new URL(u);
    if (parsed.protocol === "https:") return true;
    if (process.env.NODE_ENV !== "production" && parsed.protocol === "http:") return true;
    return false;
  } catch {
    return false;
  }
}
