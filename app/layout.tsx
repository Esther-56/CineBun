import type { Metadata } from "next";
import "./globals.css";
import Body from './MainPage/Body'
import ThemeInit from '@/app/components/ThemeInit';


export const metadata: Metadata = {
  metadataBase: new URL("https://bunnyforum.site"), // 🔁 Replace with your actual domain
  title: {
    default: "Bunny Forum – Share Videos & Links",
    template: "%s | Bunny Forum",
  },
  description:
    "Bunny Forum is your go-to community for sharing videos, links, and discovering trending content. Join the conversation today.",
  keywords: [
    "bunny forum",
    "video sharing",
    "link sharing",
    "community forum",
    "trending videos",
    "content sharing platform",
  ],
  authors: [{ name: "Bunny Forum" }],
  creator: "Bunny Forum",
  publisher: "Bunny Forum",
  applicationName: "Bunny Forum",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bunnyforum.site", // 🔁 Replace with your actual domain
    siteName: "Bunny Forum",
    title: "Bunny Forum – Share Videos & Links",
    description:
      "Discover and share videos, links, and trending content on Bunny Forum. A community built for content lovers.",
    images: [
      {
        url: "/opengraph-image.png", // your existing OG image in /public
        width: 1200,
        height: 630,
        alt: "Bunny Forum – Share Videos & Links",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Bunny Forum – Share Videos & Links",
    description:
      "Discover and share videos, links, and trending content on Bunny Forum.",
    images: ["/opengraph-image.png"],
    creator: "@bunnyforum", // 🔁 Replace with your Twitter handle if you have one
  },

  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: "https://bunnyforum.site", // 🔁 Replace with your actual domain
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="sm:scrollbar-thin sm:scrollbar-track-black sm:scrollbar-thumb-white select-none bg-(--bg-page)"
      suppressHydrationWarning
    >
      <head>
         <ThemeInit /> 
      </head>
      <Body>{children}</Body>
    </html>
  );
}