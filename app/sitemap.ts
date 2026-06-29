// app/sitemap.ts
import type { MetadataRoute } from "next";
import { CategoryService } from "@/app/services/category-service";

const BASE_URL = "https://bunnyforum.site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categoriesRes = await CategoryService.list().catch(() => null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: any[] = Array.isArray(categoriesRes?.data) ? categoriesRes.data : [];

  const subforumUrls: MetadataRoute.Sitemap = categories.flatMap((cat) =>
    (cat.subforums ?? []).map((sf: any) => ({
      url: `${BASE_URL}/f/${sf._id}`,
      lastModified: sf.updatedAt ? new Date(sf.updatedAt) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }))
  );

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    ...subforumUrls,
  ];
}