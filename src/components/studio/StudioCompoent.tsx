// @/components/studio/StudioComponent.tsx
"use client";

import { useEffect, useCallback, useRef, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Editor, Frame, Element, useEditor } from "@craftjs/core";
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RenderCanvas } from "@/components/editor-components/RenderCanvas";
import { Navbar } from "@/components/navigation/Navbar";
import { Toolbar } from "@/components/Toolbar";
import { RightSidebar } from "@/components/studio/RightSidebar";
import { StudioTreeSidebar } from "@/components/navigation/StudioTreeSidebar";
import { useRouter } from "next/navigation";
import { editorResolver } from "@/types/resolver";
import { RootState, AppDispatch } from "@/app/store/store";
import { toggleTreeSidebar } from "@/app/store/slices/editorSlice";
import { FontProvider } from "@/contexts/FontProvider";

// --- API Interfaces ---
interface ContentItem {
    _id: string;
    title: string;
    data?: any; // Data is a JSON object
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

// --- Component Props ---
interface StudioComponentProps {
  contentId: string;
}

// --- Debounce Hook ---
function useDebounce(callback: (...args: any[]) => void, delay: number) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    return useCallback((...args: any[]) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => callback(...args), delay);
    }, [callback, delay]);
}

// --- Memoized Canvas ---
const MemoizedCanvas = memo(({ children }: { children?: React.ReactNode }) => (
    <Frame><Element is={RenderCanvas} canvas>{children}</Element></Frame>
));
MemoizedCanvas.displayName = 'MemoizedCanvas';

// --- React Query API Functions ---
const fetchContent = async (contentId: string): Promise<ContentApiResponse> => {
    const res = await fetch(`/api/content/${contentId}`);
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to fetch content`);
    }
    return res.json();
};

const updateContent = async ({ contentId, data }: { contentId: string; data: any }) => {
    const res = await fetch(`/api/content/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }), // Send the JS object
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to update content`);
    }
    return res.json();
};

// --- Main Editor Logic Component ---
function EditorCore({ contentId }: StudioComponentProps) {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const isTreeSidebarOpen = useSelector((state: RootState) => state.editor.isTreeSidebarOpen);
    const deserializedRef = useRef(false);
    const queryClient = useQueryClient();

    const { data: contentResponse, isLoading, isError, error } = useQuery<ContentApiResponse, Error>({
        queryKey: ['content', contentId],
        queryFn: () => fetchContent(contentId),
        enabled: !!contentId,
        refetchOnWindowFocus: false,
    });

    const updateMutation = useMutation({
        mutationFn: updateContent,
        onSuccess: (updatedData) => {
            queryClient.setQueryData(['content', contentId], updatedData);
            console.log("Save successful.");
        },
        onError: (err) => {
            console.error("Error saving content:", err);
        },
    });
    
    const saveContent = (jsonString: string) => {
        if (!contentId || updateMutation.isPending) return;
        try {
            const dataObject = JSON.parse(jsonString);
            updateMutation.mutate({ contentId, data: dataObject });
        } catch (e) {
            console.error("Error parsing editor state before saving:", e);
        }
    };
    
    const debouncedSave = useDebounce(saveContent, 2000);

    const handleContentSelect = (id: string) => {
      router.push(`/studio/${id}`);
    };
    
    const handleTreeSidebarClose = () => {
      dispatch(toggleTreeSidebar());
    };

    if (isLoading) {
       return <div className="flex justify-center items-center h-screen">Loading Editor...</div>;
    }
    
    if (isError) {
       return <div className="flex justify-center items-center h-screen text-red-500">Error: {error.message}</div>;
    }

    const initialContentData = contentResponse?.success ? contentResponse.data?.data : null;

    return (
      <FontProvider>
        <Editor
            key={contentId}
            resolver={{ ...editorResolver }}
        >
            {/* CORRECTED: Use dedicated components for initialization and auto-saving */}
            <EditorInitializer 
                initialContent={initialContentData} 
                deserializedRef={deserializedRef} 
            />
            <EditorAutoSaveHandler 
                contentId={contentId} 
                debouncedSave={debouncedSave} 
                deserializedRef={deserializedRef} 
            />

            <div className="flex h-screen flex-col bg-background">
                <Navbar contentId={contentId}/>
                <div className="flex flex-1 overflow-hidden">
                    <StudioTreeSidebar 
                        isOpen={isTreeSidebarOpen}
                        onClose={handleTreeSidebarClose}
                        onContentSelect={handleContentSelect} 
                    />
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
      </FontProvider>
    );
}

// --- Helper Components for Editor ---

// CORRECTED: This component correctly handles one-time deserialization
function EditorInitializer({ initialContent, deserializedRef }: {
    initialContent: any | null;
    deserializedRef: React.RefObject<boolean>;
}) {
    const { actions } = useEditor();
    
    useEffect(() => {
        if (initialContent && !deserializedRef.current) {
            actions.deserialize(initialContent);
            deserializedRef.current = true;
        }
    }, [initialContent, actions, deserializedRef]);
    
    return null; // This component doesn't render anything
}

// CORRECTED: This component uses a reliable method for auto-saving
function EditorAutoSaveHandler({ contentId, debouncedSave, deserializedRef }: {
    contentId: string,
    debouncedSave: (json: string) => void,
    deserializedRef: React.RefObject<boolean>
}) {
    const { json, enabled } = useEditor((state, query) => ({
        json: query.serialize(),
        enabled: state.options.enabled,
    }));
    
    const prevJson = useRef<string | null>(null);

    useEffect(() => {
        // Trigger save only if editor is enabled, content is loaded, and the state has changed
        if (enabled && deserializedRef.current && json !== prevJson.current) {
            debouncedSave(json);
            prevJson.current = json;
        }
    }, [json, enabled, debouncedSave, deserializedRef]);

    return null;
}

// --- Main Exported Component with QueryClientProvider ---
const queryClient = new QueryClient();

export function StudioComponent({ contentId }: StudioComponentProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <EditorCore contentId={contentId} />
        </QueryClientProvider>
    );
}
