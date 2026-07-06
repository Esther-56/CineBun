import Body from "./Body"
import type { Metadata } from "next";
import { SubforumService } from "@/app/services/subforum-service";

interface SubforumPageProps {
  params: { subforumId: string };
}

export async function generateMetadata({ params }: SubforumPageProps): Promise<Metadata> {
  const { subforumId } = await params;

  let data = null;
  try {
    data = await SubforumService.get(subforumId, 1);
  } catch {
    // service threw (e.g. subforum deleted or network error) — fall back to default metadata
  }

  const subforum = data?.data?.subforum;

  if (!subforum) {
    return {
      title: "Subforum Not Found | C-Bunny Forum",
      description: "This subforum could not be found on C-Bunny Forum.",
    };
  }

  const title = subforum.name ?? "Subforum";
  const description =
    subforum.description ??
    `Browse K-pop, K-drama, and Asian entertainment threads in the ${title} subforum on C-Bunny Forum.`;
  const url = `https://cbunny.site/f/${subforumId}`;

  return {
    title: `${title} | C-Bunny Forum`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      siteName: "C-Bunny Forum",
      title: `${title} | C-Bunny Forum`,
      description,
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: `${title} – C-Bunny Forum`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | C-Bunny Forum`,
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