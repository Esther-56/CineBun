// app/components/editor/extensions/MentionList.tsx
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

interface MentionUser {
  _id: string;
  username: string;
  avatar?: string;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MentionListProps {
  items: MentionUser[];
  command: (item: { id: string; label: string }) => void;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [props.items]);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) props.command({ id: item._id, label: item.username });
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (props.items.length === 0) return null;

  return (
    <div className="bg-(--bg-elevated) border border-(--border-medium) rounded-lg shadow-lg py-1 min-w-40 overflow-hidden">
      {props.items.map((item, index) => (
        <button
          key={item._id}
          onClick={() => selectItem(index)}
          className={`flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm ${
            index === selectedIndex ? "bg-(--accent-subtle) text-(--accent)" : "text-(--text-primary)"
          }`}
        >
          {item.username}
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = "MentionList";

export default MentionList;