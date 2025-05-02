"use client"

import { useState, useEffect, useCallback, useRef, memo } from "react"
import { Editor, Frame, Element, useEditor, SerializedNodes } from "@craftjs/core" // Import SerializedNodes
import { Sidebar } from "@/components/sidebar"
import { renderCanvas } from "@/components/canvas"
import { Navbar } from "@/components/navbar"
import { Toolbar } from "@/components/widget-toolbar"
import { ImageComponent } from "@/components/user/image"
import { TextComponent } from "@/components/user/text"
import { VideoComponent } from "@/components/user/video"
import { SimulationComponent } from "@/components/user/simulation"
import { QuizComponent } from "@/components/user/quiz"
import { SliderComponent } from "@/components/user/slider"
import { AITutorComponent } from "@/components/user/ai-tutor"
import { useEditorStore } from "@/lib/editor-store"
import { useSearchParams } from "next/navigation";
import { HeaderComponent } from "@/components/user/HeaderComponent";
import { FooterComponent } from "@/components/user/FooterComponent"
// Remove unused import: import { Header } from "@radix-ui/react-accordion"

interface DebounceCallback {
    (...args: any[]): void;
}

function useDebounce(callback: DebounceCallback, delay: number): (...args: any[]) => void {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedCallback = useCallback((...args: any[]) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);

    // Cleanup timeout on unmount or dependency change
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [debouncedCallback]); // Re-run cleanup if debouncedCallback changes

    return debouncedCallback;
}


const MemoizedCanvas = memo(({ children }: { children?: React.ReactNode }) => {
    return (
        <Frame>
            <Element is={renderCanvas} canvas>
                {children}
            </Element>
        </Frame>
    );
});
MemoizedCanvas.displayName = 'MemoizedCanvas';

// Define the structure of the API response item more accurately
interface DriveItemResponse {
    _id: string;
    title: string;
    data?: string; // The content data we need
    thumbnail: string;
    createdAt: string; // Assuming string from JSON
    updatedAt?: string; // Assuming string from JSON
    parentId: string | null;
    type: 'book' | 'content';
    isDraft?: boolean;
}

interface ApiResponse {
    items: DriveItemResponse[];
    breadcrumbs: { _id: string; title: string }[];
}

export default function TemplateEditor() {
    const { enabled } = useEditorStore()
    const searchParams = useSearchParams();
    const contentId = searchParams.get("contentId");
    // Initialize state with a default value or null
    const [initialContentData, setInitialContentData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Add loading state
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const deserializedRef = useRef(false); // Tracks if initial deserialization happened

    // --- Updated Data Fetching ---
    useEffect(() => {
        // Reset state when contentId changes
        setInitialContentData(null);
        deserializedRef.current = false;
        setIsLoading(true); // Start loading

        if (contentId) {
            console.log(`Fetching content for ID: ${contentId}`);
            // Assuming /api/drive handles fetching a single item when 'contentId' is passed
            // Adjust the URL if your API expects a different parameter name (e.g., 'id')
            fetch(`/api/drive?contentId=${contentId}`) // Using the param name from your original code
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json() as Promise<ApiResponse>; // Type assertion for response
                })
                .then((responseData) => {
                    console.log("API Response:", responseData);
                    if (responseData.items && responseData.items.length > 0) {
                        // Find the specific item matching the contentId, as the API might return multiple
                        const contentItem = responseData.items.find(item => item._id === contentId && item.type === 'content');
                        if (contentItem && contentItem.data) {
                            console.log("Found content item, setting initial data:", contentItem.data);
                            setInitialContentData(contentItem.data); // Store the fetched data string
                        } else {
                            console.warn(`Content item with ID ${contentId} not found or missing 'data' field in response.`);
                            setInitialContentData('{"ROOT": {}}'); // Set to empty state if not found
                        }
                    } else {
                        console.warn("No items found in API response.");
                         setInitialContentData('{"ROOT": {}}'); // Set to empty state if no items
                    }
                })
                .catch(error => {
                    console.error("Error fetching content:", error);
                    setInitialContentData('{"ROOT": {}}'); // Set to empty state on error
                    // Handle error state appropriately, maybe show a message
                })
                .finally(() => {
                    setIsLoading(false); // Stop loading regardless of outcome
                });
        } else {
            console.log("No contentId found in URL.");
            setInitialContentData('{"ROOT": {}}'); // Default empty state if no ID
            setIsLoading(false); // Stop loading
        }
    }, [contentId]); // Re-run only when contentId changes

    // --- Updated Save Content Function ---
    const saveContent = async (json: string): Promise<void> => {
        console.log("Attempting to save content for ID:", contentId);
        if (!contentId) {
            console.warn("No contentId provided, skipping save.");
            return;
        }
        try {
            // Construct the payload according to the PUT handler in api/drive/route.ts
            const payload = {
                id: contentId,
                type: 'content', // Specify the type being updated
                data: {        // The 'data' key holds the object of fields to update
                    data: json   // The 'data' key *inside* this object is the actual content JSON string
                    // You could add other fields to update here if needed, e.g., { title: newTitle, data: json }
                }
            };
            console.log("Sending PUT request to /api/drive with payload:", JSON.stringify(payload));

            const response = await fetch("/api/drive", { // Use the /api/drive endpoint for PUT
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to parse error response" })); // Try to get error details
                console.error(`Failed to update content. Status: ${response.status}`, errorData);
                // TODO: Show an error message to the user
            } else {
                const result = await response.json();
                console.log("Content updated successfully:", result);
                // TODO: Show a success indicator (e.g., a small toast)
            }
        } catch (error) {
            console.error("Error submitting update request:", error);
            // TODO: Show an error message to the user
        }
    };

    const debouncedSave = useDebounce(saveContent, 2000); // useDebounce now correctly uses useCallback internally

    const handleToolChange = (toolType: string) => {
        setActiveTool(prevTool => prevTool === toolType ? null : toolType);
    }

    // Component to handle deserialization ONCE when initial data is ready
    function DeserializeOnce({ contentData }: { contentData: string | null }) {
        const { actions } = useEditor();

        useEffect(() => {
            // Only deserialize if we have data, the editor actions are ready,
            // and we haven't deserialized yet for the current contentId
            if (contentData && actions && !deserializedRef.current && !isLoading) {
                try {
                    console.log("Deserializing initial content:", contentData);
                    actions.deserialize(contentData);
                    deserializedRef.current = true; // Mark as deserialized
                    console.log("Deserialization complete.");
                } catch (error) {
                    console.error("Error during deserialization:", error);
                    // Handle deserialization error, maybe show a message
                    // or load a default empty state
                    try {
                       actions.deserialize('{"ROOT": {}}'); // Try loading empty state on error
                    } catch (nestedError) {
                       console.error("Error deserializing empty state:", nestedError);
                    }
                    deserializedRef.current = true; // Mark as done even on error to prevent loops
                }
            } else if (!isLoading && !contentData) {
                // If loading is finished but there's no data (e.g., no contentId)
                // ensure the ref is set so saving doesn't wait indefinitely
                 deserializedRef.current = true;
            }
        }, [contentData, actions, isLoading]); // Depend on loading state too

        return null; // This component doesn't render anything
    }

    // Component to handle auto-saving editor changes
    // function EditorAutoSaveHandler() {
    //     const { query } = useEditor((state, query) => ({
    //         // We only need query here, not the full state
    //         query: query
    //     }));

    //     const currentJsonRef = useRef<string | null>(null);

    //     useEffect(() => {
    //         // Get the current JSON string using query.serialize()
    //         const latestJson = query.serialize();

    //          // Avoid saving if the JSON hasn't actually changed since the last save attempt
    //         if (latestJson === currentJsonRef.current) {
    //              console.log("Editor state unchanged, skipping save trigger.");
    //              return;
    //         }

    //         console.log("Editor JSON changed.");
    //         currentJsonRef.current = latestJson; // Update the ref with the latest JSON

    //         // Only save if we have a contentId and initial deserialization has completed
    //         if (contentId && deserializedRef.current) {
    //             console.log("Triggering auto-save...");
    //             debouncedSave(latestJson);
    //         } else {
    //             console.log("Auto-save conditions not met - contentId:", contentId, "deserialized:", deserializedRef.current);
    //         }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    //     }, [query.serialize(), contentId]); // Depend on the serialized string and contentId

    //      // Make debouncedSave stable using useCallback
    //     const stableDebouncedSave = useCallback(debouncedSave, [debouncedSave]);

    //     useEffect(() => {
    //          // Re-run the effect if debouncedSave changes (e.g., due to contentId change)
    //          // This ensures the latest debounced function is used.
    //          // The actual saving logic depends on query.serialize() change.
    //          console.log("EditorAutoSaveHandler effect re-ran due to dependency change.");
    //     }, [stableDebouncedSave, contentId]);


    //     return null; // This component doesn't render anything
    // }


    if (isLoading) {
       return <div className="flex justify-center items-center h-screen">Loading Editor...</div>; // Or a spinner component
    }

    return (
        // Add a key to the Editor based on contentId to force re-initialization
        // when the ID changes. This helps ensure clean state transitions.
        <Editor
            key={contentId || 'new'} // Force re-render on contentId change
            resolver={{
                renderCanvas,
                Image: ImageComponent,
                Text: TextComponent,
                Video: VideoComponent,
                Simulation: SimulationComponent,
                Quiz: QuizComponent,
                Slider: SliderComponent,
                AITutor: AITutorComponent,
                Header: HeaderComponent,
                Footer: FooterComponent,
            }}
            enabled={enabled}
            onNodesChange={(query) => {
               // You could potentially trigger save here directly on node change
               // but the EditorAutoSaveHandler approach using query.serialize()
               // and debouncing is generally preferred for performance.
               // console.log("Nodes changed:", query.getSerializedNodes());
            }}
        >
            {/* Component to load the initial state */}
            <DeserializeOnce contentData={initialContentData} />
            {/* Component to handle auto-saving changes */}
            {/* <EditorAutoSaveHandler /> */}

            <div className="flex h-screen flex-col bg-background">
                <Navbar />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar activeTool={activeTool} />
                    <div className="flex flex-1 flex-col w-full h-full overflow-y-auto overflow-x-hidden bg-gray-50 mx-4 mt-2 rounded-md border border-gray-100">
                        <MemoizedCanvas />
                        <Toolbar
                            onVideoButtonClick={() => handleToolChange('video')}
                            onImageButtonClick={() => handleToolChange('image')}
                            onSimulationButtonClick={() => handleToolChange('simulation')}
                            onTextButtonClick={() => handleToolChange('text')}
                        />
                    </div>
                </div>
            </div>
        </Editor>
    );
}