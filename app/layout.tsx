import type { Metadata } from "next";
import "./globals.css";
import Body from './MainPage/Body'
import ThemeInit from '@/app/components/ThemeInit';


export const metadata: Metadata = {
  metadataBase: new URL("https://cbunny.site"), // 🔁 Replace with your actual domain
  title: {
    default: "C-Bunny Forum – K-Pop, K-Drama & Asian Entertainment Community",
    template: "%s | C-Bunny Forum",
  },
  description:
    "C-Bunny Forum is a community for fans of K-pop, K-drama, and Asian entertainment to share videos, links, news, and discussions. Join the conversation today.",
  keywords: [
    "kpop forum",
    "kdrama forum",
    "asian entertainment community",
    "kpop community",
    "kdrama discussion",
    "korean drama fans",
    "kpop news",
    "asian pop culture forum",
  ],
  authors: [{ name: "C-Bunny Forum" }],
  creator: "C-Bunny Forum",
  publisher: "C-Bunny Forum",
  applicationName: "C-Bunny Forum",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cbunny.site", // 🔁 Replace with your actual domain
    siteName: "C-Bunny Forum",
    title: "C-Bunny Forum – K-Pop, K-Drama & Asian Entertainment Community",
    description:
      "Join C-Bunny Forum to discuss K-pop, K-drama, and Asian entertainment, share videos and links, and connect with fellow fans.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "C-Bunny Forum – K-Pop, K-Drama & Asian Entertainment Community",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "C-Bunny Forum – K-Pop, K-Drama & Asian Entertainment Community",
    description:
      "Join C-Bunny Forum to discuss K-pop, K-drama, and Asian entertainment, share videos and links, and connect with fellow fans.",
    images: ["/opengraph-image.png"],
    creator: "@cbunnyforum", // 🔁 Replace with your Twitter handle if you have one
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
    canonical: "https://cbunny.site", // 🔁 fixed: was pointing to a different domain than metadataBase
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
      className="sm:scrollbar-thin sm:scrollbar-track-transparent sm:scrollbar-thumb-(--accent) select-none bg-(--bg-page)"
      suppressHydrationWarning
    >
      <head>
         <ThemeInit /> 
      </head>
      <Body>{children}</Body>
    </html>
  );
}