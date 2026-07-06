import { Body } from "./Body";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ThreadService } from "@/app/services/threads";
import { PostService } from "@/app/services/posts";
import { Post } from "@/app/MainPage/types/forum";

interface ThreadPageProps {
  params: Promise<{ subforumId: string; threadId: string }>;
  searchParams: Promise<{ post?: string; page?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: ThreadPageProps): Promise<Metadata> {
  const { subforumId, threadId } = await params;
  const { post: highlightPostId } = await searchParams;

  // Fetch thread, fail gracefully
  let thread = null;
  try {
    const threadRes = await ThreadService.get(threadId);
    thread = threadRes?.data?.thread ?? null;
  } catch {
    // service error or thread not found
  }

  if (!thread) {
    return {
      title: "Thread Not Found | C-Bunny Forum",
      description: "This thread could not be found on C-Bunny Forum.",
    };
  }

  // Fetch posts, fail gracefully
  let postsList: Post[] = [];
  try {
    if (highlightPostId) {
      const locateRes = await PostService.locate(threadId, highlightPostId).catch(() => null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const locatedPage = (locateRes as any)?.data?.page;
      if (locatedPage) {
        const pageRes = await PostService.list(threadId, locatedPage).catch(() => null);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        postsList = (pageRes as any)?.data?.posts ?? [];
      }
    } else {
      const listRes = await PostService.list(threadId, 1).catch(() => null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      postsList = (listRes as any)?.data?.posts ?? [];
    }
  } catch {
    // posts unavailable — metadata will fall back gracefully
  }

  const specificPost = highlightPostId
    ? (postsList.find((p: Post) => p._id === highlightPostId) ?? null)
    : null;

  const targetPost = specificPost ?? postsList[0] ?? null;

  const title = thread.title ?? "Thread";
  const rawContent = targetPost?.content ?? targetPost?.body ?? "";
  const description = rawContent
    ? rawContent.replace(/<[^>]*>/g, "").slice(0, 155).trim() + "…"
    : `Join the discussion on "${title}" in the C-Bunny Forum community.`;

  const author =
    specificPost?.author?.username ??
    thread.author?.username ??
    "C-Bunny Forum";

  const baseUrl = `https://cbunny.site/f/${subforumId}/${threadId}`;
  const canonicalUrl = highlightPostId
    ? `${baseUrl}?post=${highlightPostId}`
    : baseUrl;

  const metaTitle = specificPost
    ? `${author} in "${title}" | C-Bunny Forum`
    : `${title} | C-Bunny Forum`;

  return {
    title: metaTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      siteName: "C-Bunny Forum",
      title: metaTitle,
      description,
      publishedTime: new Date(
        specificPost?.createdAt ?? thread.createdAt
      ).toISOString(),
      modifiedTime: new Date(thread.updatedAt).toISOString(),
      authors: [author],
      images: [
        {
          url: thread.image ?? "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description,
      images: [thread.image ?? "/opengraph-image.png"],
    },
  };
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const params_cc = await params;

  return (
    <Suspense fallback={null}>
      <Body params_cc={params_cc} />
    </Suspense>
  );
}