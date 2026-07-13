/* eslint-disable @typescript-eslint/no-explicit-any */
// app/components/editor/extensions/LinkCard.ts
import { Node, mergeAttributes } from "@tiptap/core";

export interface LinkCardMeta {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    linkCard: {
      setLinkCard: (meta: LinkCardMeta) => ReturnType;
    };
  }
}

export const LinkCard = Node.create({
  name: "linkCard",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
      title: { default: "" },
      description: { default: "" },
      image: { default: "" },
      siteName: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "a.editor-link-card" }];
  },

  renderHTML({ node }) {
    const { url, title, description, image, siteName } = node.attrs;
    return [
      "a",
      mergeAttributes({
        href: url,
        class: "editor-link-card",
        target: "_blank",
        rel: "noopener noreferrer",
      }),
      image ? (["img", { src: image, class: "editor-link-card-image", alt: "" }] as const) : "",
      [
        "div",
        { class: "editor-link-card-body" },
        ["p", { class: "editor-link-card-title" }, title || url],
        description ? (["p", { class: "editor-link-card-desc" }, description] as const) : "",
        ["p", { class: "editor-link-card-site" }, siteName || url],
      ],
    ] as any;
  },

  addCommands() {
    return {
      setLinkCard:
        (meta: LinkCardMeta) =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name, attrs: meta });
        },
    };
  },
});

export default LinkCard;

/*
  Add to global CSS:

  .editor-link-card { display: flex; gap: 0.75rem; align-items: stretch; border: 1px solid var(--border-soft);
    border-radius: 0.5rem; overflow: hidden; text-decoration: none; margin: 0.5rem 0; }
  .editor-link-card-image { width: 120px; object-fit: cover; flex-shrink: 0; }
  .editor-link-card-body { padding: 0.5rem 0.75rem; min-width: 0; }
  .editor-link-card-title { color: var(--text-primary); font-weight: 600; font-size: 0.875rem; margin: 0; }
  .editor-link-card-desc { color: var(--text-secondary); font-size: 0.75rem; margin: 0.15rem 0 0; }
  .editor-link-card-site { color: var(--text-muted); font-size: 0.7rem; margin: 0.35rem 0 0; }
*/