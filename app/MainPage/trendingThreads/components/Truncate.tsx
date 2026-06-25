export function truncate(text: string | undefined, maxLength: number) {
  if (!text) return "";

  return text.length > maxLength
    ? text.slice(0, maxLength).trimEnd() + "..."
    : text;
}