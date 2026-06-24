import Link from 'next/link';
import { ChevronRight, MessageSquare } from 'lucide-react';
import { SubforumMeta } from '../../types/forum';
import { useSnapshot } from 'valtio';
import { store } from '@/app/store';

interface SubforumHeaderProps {
  subforum: SubforumMeta;
  type: string;
  length: boolean;
}

export default function SubforumHeader({ subforum, type, length }: SubforumHeaderProps) {
  const snap = useSnapshot(store);
  const id = snap._id;
  return (
    <div className="mb-5 font-medium ">
      <div className="flex items-center gap-1.5 text-[13px] text-(--text-secondary) mb-3">
        <Link href="/" className="hover:text-(--text-primary) transition-colors">Forum Index</Link>
        <ChevronRight size={13} className="text-(--text-muted)" />
        <span className="text-(--text-secondary)">{subforum.name}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold leading-none" style={{ color: subforum.accentColor }}>
            {subforum.name}
          </h1>
          <p className="text-(--text-secondary) text-sm mt-1">{subforum.description}</p>
        </div>
        {id && (
          <>{(type === 'threads' || length) && (
            <Link
              href={{ pathname: `/f/${subforum._id}/new`, query: { subforumId: subforum._id, categoryId: subforum.category, subforumName: subforum.name } }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-(--accent) hover:bg-(--accent-hover) text-white text-base font-semibold rounded-md transition-colors shrink-0"
            >
              <MessageSquare size={13} />
              New Thread
            </Link>
          )}</>
        )}
      </div>
    </div>
  );
}