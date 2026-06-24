import { MapPin, Globe, Bird, GitFork, Clock } from 'lucide-react';
import { UserProfile } from '../../types';
import { formatTimeAgo } from '@/app/n/component/utils';
interface AboutTabProps {
  profile: UserProfile;
}


export function AboutTab({ profile }: AboutTabProps) {
  const details = [
    { icon: <Globe size={12} />, label: 'Website',  value: profile?.socials?.website, link: true },
    { icon: <MapPin size={12} />,  label: 'Social',   value: profile?.socials?.link,     link: true  },
    { icon: <Clock size={12} />,   label: 'Last seen',value: `${formatTimeAgo(profile?.lastSeenAt)} ago`,         link: false },
  ].filter(d => d.value && d.value !== '@');

  return (
    <div className="space-y-4">
      {profile.bio && (
        <div className="bg-(--bg-surface) rounded-lg border border-(--border-soft) p-4">
          <h3 className="text-[13px] uppercase tracking-widest font-bold text-(--text-primary) mb-2">About</h3>
          <p className="text-sm italic text-(--text-primary) leading-relaxed">{profile?.bio}</p>
        </div>
      )}

      <div className="bg-(--bg-surface)  rounded-lg border border-(--border-soft) p-4 space-y-3">
        <h3 className="text-[13px] uppercase tracking-widest font-bold text-(--text-primary) mb-3">Details</h3>
        {details.map((detail, i) => (
          <div key={i} className="flex items-center font-medium gap-3">
            <div className="text-(--text-primary) shrink-0">{detail.icon}</div>
            <span className="text-[12px] text-(--text-primary) w-16 shrink-0">{detail?.label}</span>
            {detail.link ? (
              <a href="#" className="text-sm text-(--accent) hover:underline truncate">{detail?.value}</a>
            ) : (
              <span className="text-sm text-(--text-muted) truncate">{detail?.value}</span>
            )}
          </div>
        ))}
      </div>

      {profile?.signature && (
        <div className="bg-(--bg-surface) rounded-lg border  border-(--border-soft) p-4">
          <h3 className="text-[13px] uppercase tracking-widest font-bold  text-(--text-primary) mb-2">Signature</h3>
          <p className="text-sm text-(--text-primary) italic border-l-2 border-(--border-soft) pl-3">
            {profile?.signature}
          </p>
        </div>
      )}
    </div>
  );
}