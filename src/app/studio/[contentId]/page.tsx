// @/app/studio/[contentId]/page.tsx
"use client"
import { StudioComponent } from "@/components/studio/StudioCompoent";
import { use } from "react";

type StudioParam = {
  params: Promise<{
    contentId: string
  }>
}

export default function StudioPage({ params }: StudioParam) {
  const { contentId } = use(params);

  return (
    <div className="flex h-screen bg-muted/40">
      {/* Main editor content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <StudioComponent contentId={contentId} />
      </main>
    </div>
  );
}
