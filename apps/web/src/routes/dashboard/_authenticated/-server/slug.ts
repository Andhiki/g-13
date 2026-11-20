export function slugifyCatalogText(text: string, fallbackPrefix: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `${fallbackPrefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function allocateCatalogId(
  sourceText: string,
  fallbackPrefix: string,
  findByPrefix: (prefixPattern: string) => Promise<Array<{ id: string }>>,
): Promise<string> {
  const base = slugifyCatalogText(sourceText, fallbackPrefix);
  const existing = await findByPrefix(`${base}%`);
  const used = new Set(existing.map((row) => row.id));
  if (!used.has(base)) return base;
  for (let suffix = 2; suffix < 10_000; suffix++) {
    const candidate = `${base}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}
