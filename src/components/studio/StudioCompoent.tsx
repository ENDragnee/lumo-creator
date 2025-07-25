"use client";

import { useEffect, useCallback, useRef, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Editor, Frame, Element, useEditor, SerializedNodes } from "@craftjs/core";
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
import { Loader2, AlertTriangle } from "lucide-react"; // For better feedback

// --- API Interfaces ---
interface ContentItem {
    _id: string;
    title: string;
    data?: SerializedNodes; // Data is now the specific Craft.js object type
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

// --- FIX: `updateContent` now expects a JavaScript object for data ---
const updateContent = async ({ contentId, data }: { contentId: string; data: SerializedNodes }) => {
    const res = await fetch(`/api/content/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }), // Send the JS object in the body
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
            // Optionally: Show a toast notification to the user
        },
    });
    
    // --- FIX: `saveContent` now receives a JavaScript object directly ---
    const saveContent = (dataObject: SerializedNodes) => {
        if (!contentId || updateMutation.isPending) return;
        updateMutation.mutate({ contentId, data: dataObject });
    };
    
    const debouncedSave = useDebounce(saveContent, 2000);

    const handleContentSelect = (id: string) => {
      router.push(`/studio/${id}`);
    };
    
    const handleTreeSidebarClose = () => {
      dispatch(toggleTreeSidebar());
    };

    if (isLoading) {
       return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-4 text-lg">Loading Editor...</span></div>;
    }
    
    if (isError) {
       return <div className="flex flex-col justify-center items-center h-screen text-destructive"><AlertTriangle className="h-12 w-12 mb-4" /> <h2 className="text-xl font-semibold">Error Loading Content</h2><p>{error.message}</p></div>;
    }

    const initialContentData = contentResponse?.success ? contentResponse.data?.data : null;

    return (
      <FontProvider>
        <Editor
            key={contentId} // Ensures editor re-mounts when contentId changes
            resolver={{ ...editorResolver }}
        >
            <EditorInitializer 
                initialContent={initialContentData} 
                deserializedRef={deserializedRef} 
            />
            <EditorAutoSaveHandler 
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
                      <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
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

function EditorInitializer({ initialContent, deserializedRef }: {
    initialContent: any | null;
    deserializedRef: React.MutableRefObject<boolean>;
}) {
    const { actions } = useEditor();
    
    useEffect(() => {
        if (initialContent && typeof initialContent === 'object' && !deserializedRef.current) {
            // --- FIX: `deserialize` expects an object, not a string ---
            actions.deserialize(initialContent);
            deserializedRef.current = true;
        }
    }, [initialContent, actions, deserializedRef]);
    
    return null;
}

function EditorAutoSaveHandler({ debouncedSave, deserializedRef }: {
    debouncedSave: (data: SerializedNodes) => void,
    deserializedRef: React.MutableRefObject<boolean>
}) {
    // --- FIX: `query.getSerializedNodes()` provides the object directly ---
    const nodes = useEditor((state, query) => query.getSerializedNodes());
    const { enabled } = useEditor(state => ({ enabled: state.options.enabled }));
    
    const prevNodes = useRef<SerializedNodes | null>(null);

    useEffect(() => {
        // Simple string comparison is not reliable for deep object changes.
        // For production, consider a deep-comparison library like `fast-deep-equal`.
        // For now, JSON.stringify is a decent way to check for changes.
        const hasChanged = JSON.stringify(nodes) !== JSON.stringify(prevNodes.current);

        if (enabled && deserializedRef.current && hasChanged) {
            debouncedSave(nodes);
      
            prevNodes.current = nodes;
        }
    }, [nodes, enabled, debouncedSave, deserializedRef]);

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
