// @/components/studio/StudioComponent
"use client";

import { useEffect, useCallback, useRef, memo, useState } from "react";
import { useSelector, useDispatch } from "react-redux"; // NEW: Import useDispatch
import { Editor, Frame, Element, useEditor } from "@craftjs/core";
import { RenderCanvas } from "@/components/editor-components/RenderCanvas";
import { Navbar } from "@/components/navigation/Navbar";
import { Toolbar } from "@/components/Toolbar";
import { RightSidebar } from "@/components/studio/RightSidebar";
import { StudioTreeSidebar } from "@/components/navigation/StudioTreeSidebar";
import { useRouter } from "next/navigation";
import { editorResolver } from "@/types/resolver";
import { RootState, AppDispatch } from "@/app/store/store"; // NEW: Import AppDispatch
import { toggleTreeSidebar } from "@/app/store/slices/editorSlice"; // NEW: Import the toggle action

// --- API Interfaces (unchanged) ---
interface ContentItem {
    _id: string;
    title: string;
    data?: string;
    thumbnail: string;
    version: number;
    createdAt: string;
    lastModifiedAt: string;
}
interface ContentApiResponse {
    success: boolean;
    data?: ContentItem;
    message?: string;
}

// --- Component Props (unchanged) ---
interface StudioComponentProps {
  contentId: string;
}

// --- Debounce Hook (unchanged) ---
function useDebounce(callback: (...args: any[]) => void, delay: number) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    return useCallback((...args: any[]) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => callback(...args), delay);
    }, [callback, delay]);
}

// --- Memoized Canvas (unchanged) ---
const MemoizedCanvas = memo(({ children }: { children?: React.ReactNode }) => (
    <Frame><Element is={RenderCanvas} canvas>{children}</Element></Frame>
));
MemoizedCanvas.displayName = 'MemoizedCanvas';

// --- Main Editor Logic Component ---
function EditorCore({ contentId }: StudioComponentProps) {
    const [initialContentData, setInitialContentData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const deserializedRef = useRef(false);
    const router = useRouter();

    // NEW: Get sidebar state from Redux and initialize dispatch
    const dispatch = useDispatch<AppDispatch>();
    const isTreeSidebarOpen = useSelector((state: RootState) => state.editor.isTreeSidebarOpen);

    const handleContentSelect = (id: string) => {
      router.push(`/studio/${id}`);
    };
    
    // This function will be passed to the sidebar's onClose prop
    const handleTreeSidebarClose = () => {
      dispatch(toggleTreeSidebar());
    };

    useEffect(() => {
        setInitialContentData(null);
        deserializedRef.current = false;
        setIsLoading(true);

        if (contentId) {
            fetch(`/api/content/${contentId}`)
                .then(res => res.ok ? res.json() : Promise.reject(res))
                .then((response: ContentApiResponse) => {
                    if (response.success && response.data) {
                        setInitialContentData(response.data.data || '{"ROOT": {}}');
                    } else {
                        console.warn(`Failed to fetch content: ${response.message}`);
                        setInitialContentData('{"ROOT": {}}');
                    }
                })
                .catch(error => {
                    console.error("Error fetching content:", error);
                    setInitialContentData('{"ROOT": {}}');
                })
                .finally(() => setIsLoading(false));
        } else {
            setInitialContentData('{"ROOT": {}}');
            setIsLoading(false);
        }
    }, [contentId]);

    const saveContent = async (json: string) => {
        if (!contentId) return;
        try {
            await fetch(`/api/content/${contentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: json }),
            });
        } catch (error)
        {
            console.error("Error submitting update request:", error);
        }
    };

    const debouncedSave = useDebounce(saveContent, 2000);

    if (isLoading) {
       return <div className="flex justify-center items-center h-screen">Loading Editor...</div>;
    }

    return (
        <Editor
            key={contentId}
            resolver={{
                ...editorResolver
            }}
        >
            <DeserializeOnce contentData={initialContentData} isLoading={isLoading} />
            <EditorAutoSaveHandler contentId={contentId} debouncedSave={debouncedSave} deserializedRef={deserializedRef} />

            <div className="flex h-screen flex-col bg-background">
                <Navbar contentId={contentId}/>
                <div className="flex flex-1 overflow-hidden">
                    {/* UPDATED: Pass isOpen and onClose props to the sidebar */}
                    <StudioTreeSidebar 
                        isOpen={isTreeSidebarOpen}
                        onClose={handleTreeSidebarClose}
                        onContentSelect={handleContentSelect} 
                    />
                    
                    {/* The animation is handled inside the sidebar, so no transition class is needed here. */}
                    <main className="flex-1 relative flex flex-col overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-4">
                        <MemoizedCanvas />
                      </div>
                      <Toolbar />
                    </main>
                    <RightSidebar />
                </div>
            </div>
        </Editor>
    );
}

// --- Helper Hooks/Components for Editor (unchanged) ---
function DeserializeOnce({ contentData, isLoading }: { contentData: string | null, isLoading: boolean }) {
    const { actions } = useEditor();
    const deserializedRef = useRef(false);
    useEffect(() => {
        if (contentData && !deserializedRef.current && !isLoading) {
            actions.deserialize(contentData);
            deserializedRef.current = true;
        }
    }, [contentData, actions, isLoading]);
    return null;
}

function EditorAutoSaveHandler({ contentId, debouncedSave, deserializedRef }: any) {
    const { query } = useEditor(state => ({ enabled: state.options.enabled }));
    useEffect(() => {
        const json = query.serialize();
        if (contentId && deserializedRef.current) {
            debouncedSave(json);
        }
    }, [query, contentId, debouncedSave, deserializedRef]);
    return null;
}

// --- Main Exported Component with Redux Provider (unchanged) ---
export function StudioComponent({ contentId }: StudioComponentProps) {
    return (
            <EditorCore contentId={contentId} />
    );
}
