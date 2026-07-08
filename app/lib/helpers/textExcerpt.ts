// app/lib/helpers/textExcerpt.ts
export function htmlToExcerpt(html: string, maxLength = 150): string {
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? text.slice(0, maxLength).trim() + "…" : text;
}