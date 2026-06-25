// app/sitemap.ts
import type { MetadataRoute } from "next";
import { SubforumService } from "@/app/services/subforum-service";

const BASE_URL = "https://bunnyforum.site"; // 🔁 Replace with your actual domain

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // fetch top-level subforums
  const subforumsRes = await SubforumService.get("root", 1).catch(() => null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subforums: any[] = subforumsRes?.data?.items ?? [];

  const subforumUrls: MetadataRoute.Sitemap = subforums.map((sf) => ({
    url: `${BASE_URL}/f/${sf._id ?? sf.id}`,
    lastModified: sf.updatedAt ? new Date(sf.updatedAt) : new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    ...subforumUrls,
    // NOTE: threads are too dynamic/numerous to statically list here.
    // Google will crawl them naturally via internal links.
    // If you want thread URLs too, loop subforums and fetch threads per subforum below.
  ];
}