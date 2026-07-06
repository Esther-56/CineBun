// app/components/editor/extensions/ImageGrid.ts
import { Node, mergeAttributes } from "@tiptap/core";

export interface ImageGridOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageGrid: {
      setImageGrid: (urls: string[]) => ReturnType;
    };
  }
}

// Renders: <div class="editor-image-grid editor-image-grid--N"><img .../>...</div>
// `urls` is stored as a JSON string attribute since Tiptap node attrs must round-trip
// through HTML parsing (parseHTML reads it back out of a data-urls attribute).
export const ImageGrid = Node.create<ImageGridOptions>({
  name: "imageGrid",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      urls: {
        default: [] as string[],
        parseHTML: (element) => {
          const raw = element.getAttribute("data-urls");
          try {
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        },
        renderHTML: (attributes) => ({
          "data-urls": JSON.stringify(attributes.urls ?? []),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div.editor-image-grid" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const urls: string[] = node.attrs.urls ?? [];
    const cols = Math.min(urls.length, 3) || 1;
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: `editor-image-grid editor-image-grid--${cols}`,
      }),
      ...urls.map((u) => [
        "img",
        { src: u, class: "editor-image", alt: "" },
      ] as const),
    ];
  },

  addCommands() {
    return {
      setImageGrid:
        (urls: string[]) =>
        ({ commands }) => {
          if (urls.length === 0) return false;
          return commands.insertContent({ type: this.name, attrs: { urls } });
        },
    };
  },
});

export default ImageGrid;

/*
  Add to your global CSS (same layout the old editor used):

  .editor-image-grid { display: grid; gap: 4px; margin: 0.5rem 0; border-radius: 0.5rem; overflow: hidden; }
  .editor-image-grid--1 { grid-template-columns: 1fr; }
  .editor-image-grid--2 { grid-template-columns: 1fr 1fr; }
  .editor-image-grid--3 { grid-template-columns: 1fr 1fr 1fr; }
  .editor-image-grid .editor-image { width: 100%; height: 100%; object-fit: cover; display: block; }
*/