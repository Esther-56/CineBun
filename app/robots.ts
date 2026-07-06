// app/robots.ts
import type { MetadataRoute } from "next";

const BASE_URL = "https://cbunny.site"; // 🔁 Replace with your actual domain

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/f/"],
        disallow: [
          "/api/",
          "/admin/",
          "/settings/",
          "/u/",
          "/messages/",
          "/n/",
          "/auth/",
          "/*?page=*",   // prevent paginated duplicate indexing
        ],
      },
      {
        // block AI scrapers
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Google-Extended",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
          "Omgilibot",
          "FacebookBot",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}