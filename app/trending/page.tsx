import type { Metadata } from "next";
import Body from "./Body";

export const metadata: Metadata = {
  title: "Trending Threads",
  description:
    "The most active threads on Bunny Forum from the last 48 hours — see what the community is talking about right now.",
  keywords: [
    "trending threads",
    "bunny forum",
    "popular discussions",
    "active threads",
    "community trends",
  ],

  openGraph: {
    type: "website",
    url: "https://bunnyforum.site/trending", // 🔁 Replace with your actual domain
    siteName: "Bunny Forum",
    title: "Trending Threads | Bunny Forum",
    description:
      "See the most active threads on Bunny Forum from the last 48 hours.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Trending Threads – Bunny Forum",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Trending Threads | Bunny Forum",
    description:
      "See the most active threads on Bunny Forum from the last 48 hours.",
    images: ["/opengraph-image.png"],
    creator: "@bunnyforum", // 🔁 Replace with your Twitter handle if you have one
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
    canonical: "https://bunnyforum.site/trending", // 🔁 Replace with your actual domain
  },
};

export default function TrendingPage() {
  return <Body />;
}