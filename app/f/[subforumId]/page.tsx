import Body from "./Body"
import type { Metadata } from "next";
import { SubforumService } from "@/app/services/subforum-service";

interface SubforumPageProps {
  params: { subforumId: string };
}

export async function generateMetadata({ params }: SubforumPageProps): Promise<Metadata> {
  const { subforumId } = await params;
  const data = await SubforumService.get(subforumId, 1);
  const subforum = data?.data?.subforum;

  if (!subforum) {
    return {
      title: "Subforum Not Found | Bunny Forum",
      description: "This subforum could not be found on Bunny Forum.",
    };
  }

  const title = subforum.name ?? "Subforum";
  const description =
    subforum.description ??
    `Browse threads and content in the ${title} subforum on Bunny Forum.`;
  const url = `https://bunnyforum.site/f/${subforumId}`; // 🔁 Replace with your actual domain

  return {
    title: `${title} | Bunny Forum`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      siteName: "Bunny Forum",
      title: `${title} | Bunny Forum`,
      description,
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: `${title} – Bunny Forum`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Bunny Forum`,
      description,
      images: ["/opengraph-image.png"],
    },
  };
}

export default async function SubforumPage({ params }: SubforumPageProps) {
  const params_cc = await params;

  return (
    <Body params_cc={params_cc} />
  );
}