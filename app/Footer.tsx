// app/components/Footer.tsx
'use client';
import Link from 'next/link';

const links = [
  { label: 'Contact us',       href: 'https://t.me/+1PeVNvX5IXVhNzI0' },
  { label: 'Terms and rules',  href: '/' },
  { label: 'Request takedown', href: '/' },
  { label: 'Privacy policy',   href: '/' },
];

export default function Footer() {
  return (
    <footer className="mt-auto font-medium bg-(--bg-page) border-t border-(--border-soft)">

      {/* Top row */}
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-(--border-soft)">

        {/* Brand */}
        <div>
          <p className="text-[15px] font-bold text-(--text-primary) tracking-wide">Bunny Forum</p>
          <p className="text-[13px] text-(--text-secondary) mt-0.5">Community Forums</p>
        </div>

        {/* Nav links — 2-col grid on mobile, pipe-separated row on sm+ */}
        <nav className="grid grid-cols-2 gap-x-2 gap-y-1 sm:flex sm:flex-wrap sm:gap-0">
          {links.map((l, i) => (
            <Link
              key={i}
              href={l.href}
              className={`text-[13px] text-(--text-secondary) hover:text-(--text-primary) transition-colors py-1 whitespace-nowrap
                sm:px-3
                ${i !== links.length - 1 ? 'sm:border-r sm:border-(--border-soft)' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom row */}
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
        <span className="text-[13px] text-(--text-secondary)">
          © {new Date().getFullYear()}. All rights reserved.
        </span>
        <span className="text-[13px] text-(--text-secondary)">
          Forum software by <span className="text-(--accent)">mid9it</span>
        </span>
      </div>

    </footer>
  );
}