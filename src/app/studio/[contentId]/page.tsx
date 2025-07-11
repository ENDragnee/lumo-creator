"use client"
import { StudioComponent } from "@/components/studio/StudioCompoent";
import { StudioTreeSidebar } from "@/components/navigation/StudioTreeSidebar";
import { useRouter } from "next/navigation";
import { use } from "react";

type StudioParam = {
  params: Promise<{
    contentId: string
  }>
}

export default function StudioPage({ params }: StudioParam) {
  const router = useRouter();
  const { contentId } = use(params);

  // This handler will be passed to the sidebar.
  // When a content item is clicked in the tree, it navigates the main view.
  const handleContentSelect = (contentId: string) => {
    router.push(`/studio/${contentId}`);
  };

  return (
    <div className="flex h-screen bg-muted/40">
      {/* The sidebar now manages its own mobile visibility */}
      <StudioTreeSidebar onContentSelect={handleContentSelect} />
      
      {/* Main editor content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <StudioComponent contentId={contentId} />
      </main>
    </div>
  );
}
