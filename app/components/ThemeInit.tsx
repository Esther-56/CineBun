// app/components/ThemeInit.tsx
// Runs before hydration to avoid a flash of wrong theme
export default function ThemeInit() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          try {
            var t = localStorage.getItem('theme');
            if (t && t !== 'default') document.documentElement.classList.add('theme-' + t);
          } catch(e) {}
        `,
      }}
    />
  );
}