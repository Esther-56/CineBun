import { Suspense } from "react";
import LeavingPageContent from "./LeavingPageContent";

export default function LeavingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-(--bg-base)">
        <div className="w-8 h-8 rounded-full border-2 border-(--border) border-t-(--accent) animate-spin" />
      </div>
    }>
      <LeavingPageContent />
    </Suspense>
  );
}