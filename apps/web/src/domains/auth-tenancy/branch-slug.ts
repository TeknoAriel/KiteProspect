/**
 * Slug único por cuenta para sucursales (F3-E4).
 */
export function slugifyBranchName(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return s || "sucursal";
}
