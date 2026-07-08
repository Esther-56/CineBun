// app/components/editor/extensions/MentionSuggestion.tsx
import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import MentionList, { MentionListRef } from "./MentionList";

export const MentionSuggestion = Mention.configure({
  HTMLAttributes: { class: "editor-mention" },
  suggestion: {
    char: "@",
    items: async ({ query }: { query: string }) => {
      if (!query) return [];
      const res = await fetch(`/api/users/mention-search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });
      const data = await res.json();
      return data.users ?? [];
    },
    render: () => {
      let component: ReactRenderer<MentionListRef>;
      let popup: TippyInstance[];

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });
          if (!props.clientRect) return;

          popup = tippy("body", {
            getReferenceClientRect: () => props.clientRect!()!,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          });
        },
        onUpdate(props) {
          component.updateProps(props);
          if (!props.clientRect) return;
          popup[0].setProps({ getReferenceClientRect: () => props.clientRect!()! });
        },
        onKeyDown(props) {
          if (props.event.key === "Escape") {
            popup[0].hide();
            return true;
          }
          return component.ref?.onKeyDown(props) ?? false;
        },
        onExit() {
          popup[0].destroy();
          component.destroy();
        },
      };
    },
  },
});

export default MentionSuggestion;