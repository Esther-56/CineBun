import { Body } from "./Body";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ThreadService } from "@/app/services/threads";
import { PostService } from "@/app/services/posts";
import { Post } from "@/app/MainPage/types/forum";

interface ThreadPageProps {
  params: { subforumId: string; threadId: string };
  searchParams: { post?: string; page?: string };
}

export async function generateMetadata({ params, searchParams }: ThreadPageProps): Promise<Metadata> {
  const { subforumId, threadId } = await params;
  const { post: highlightPostId } = await searchParams;

  const [threadRes, locateOrListRes] = await Promise.all([
    ThreadService.get(threadId),
    highlightPostId
      ? PostService.locate(threadId, highlightPostId)
      : PostService.list(threadId, 1),
  ]);

  const thread = threadRes?.data?.thread;

  if (!thread) {
    return {
      title: "Thread Not Found | Bunny Forum",
      description: "This thread could not be found on Bunny Forum.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const locateRes = locateOrListRes as any;
  let postsList: Post[] = [];

  if (highlightPostId) {
    const locatedPage = locateRes?.data?.page;
    if (locatedPage) {
      const pageRes = await PostService.list(threadId, locatedPage);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      postsList = (pageRes as any)?.data?.posts ?? [];
    }
  } else {
    postsList = locateRes?.data?.posts ?? [];
  }

  const specificPost = highlightPostId
    ? postsList.find((p: Post) => p._id === highlightPostId) ?? null
    : null;

  const targetPost = specificPost ?? postsList[0] ?? null;

  const title = thread.title ?? "Thread";
  const rawContent = targetPost?.content ?? targetPost?.body ?? "";
  const description = rawContent
    ? rawContent.replace(/<[^>]*>/g, "").slice(0, 155).trim() + "…"
    : `Join the discussion on "${title}" in the Bunny Forum community.`;

  const author =
    specificPost?.author?.username ??
    thread.author?.username ??
    "Bunny Forum";

  const baseUrl = `https://bunnyforum.site/f/${subforumId}/${threadId}`; // 🔁 Replace with your actual domain
  const canonicalUrl = highlightPostId ? `${baseUrl}?post=${highlightPostId}` : baseUrl;

  const metaTitle = specificPost
    ? `${author} in "${title}" | Bunny Forum`
    : `${title} | Bunny Forum`;

  return {
    title: metaTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      siteName: "Bunny Forum",
      title: metaTitle,
      description,
      publishedTime: new Date(specificPost?.createdAt ?? thread.createdAt).toISOString(),
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