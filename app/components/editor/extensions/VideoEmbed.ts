// app/components/editor/extensions/VideoEmbed.ts
import { Node, mergeAttributes } from "@tiptap/core";

export interface VideoEmbedOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoEmbed: {
      setVideoEmbed: (src: string) => ReturnType;
    };
  }
}

// Renders as: <div class="editor-video-embed"><iframe src="..." ...></iframe></div>
// Keep the wrapper div + CSS (aspect-ratio: 16/9) in your global stylesheet so the
// embed is responsive — see note at bottom of file.
export const VideoEmbed = Node.create<VideoEmbedOptions>({
  name: "videoEmbed",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      src: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div.editor-video-embed" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, { class: "editor-video-embed" }),
      [
        "iframe",
        {
          src: node.attrs.src,
          frameborder: "0",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "true",
        },
      ],
    ];
  },

  addCommands() {
    return {
      setVideoEmbed:
        (src: string) =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name, attrs: { src } });
        },
    };
  },
});

export default VideoEmbed;

/*
  Add to your global CSS (matches the old inline embed sizing):

  .editor-video-embed {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    margin: 0.5rem 0;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  .editor-video-embed iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
*/