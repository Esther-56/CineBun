// app/search/page.tsx
import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-(--bg-page) flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-(--accent) border-t-transparent animate-spin" />
      </div>
    }>
      <SearchPageClient />
    </Suspense>
  );
}