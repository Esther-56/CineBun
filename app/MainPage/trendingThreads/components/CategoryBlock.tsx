import SubforumRow from './SubforumRow';
import { ApiCategory } from '@/app/services/category-service';
import CategoryIcon from '@/app/Lucide';

interface CategoryBlockProps {
  category: ApiCategory;
}

export default function CategoryBlock({ category }: CategoryBlockProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-(--border-soft) bg-(--bg-surface)">
      {/* Category header */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b border-(--border-soft)"
        style={{ backgroundColor: category.accentColor + '12' }}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded"
          style={{ backgroundColor: category.accentColor + '22', color: category.accentColor }}
        >
          <CategoryIcon name={category.icon} size={14} />
        </div>
        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: category.accentColor }}>
          {category.name}
        </h2>
      </div>

      {/* Column headers — desktop only */}
      <div className="hidden md:flex items-center gap-4 px-4 py-1.5 border-b border-(--border-soft) bg-(--bg-page)">
        <div className="flex-1" />
      </div>

      {/* Subforums */}
      <div>
        {category.subforums.map(sub => (
          <SubforumRow key={sub._id} subforum={sub} accentColor={category.accentColor} />
        ))}
      </div>
    </div>
  );
}