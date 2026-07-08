// app/lib/helpers/highlightMentions.ts
export function highlightMentions(html: string): string {
  return html.replace(/@(\w+)/g, '<span class="editor-mention">@$1</span>');
}