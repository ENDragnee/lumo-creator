"use client";

import { useState, useEffect, memo } from "react";
import { Editor, Frame, Element, useNode, useEditor } from "@craftjs/core";
import { useDebouncedCallback } from 'use-debounce';
import { Loader2, Tag, GitBranch, Image as ImageIcon, CheckCircle, AlertCircle, HomeIcon, UploadCloud } from "lucide-react";

// Import UI and Craft.js Components
import { Toolbar } from "@/components/widget-toolbar";
import { RenderCanvas } from "@/components/canvas/RenderCanvas";
import { ImageComponent } from "@/components/user/image";
import { TextComponent } from "@/components/user/text";
import { VideoComponent } from "@/components/user/video";
import { SimulationComponent } from "@/components/user/simulation";
import { QuizComponent } from "@/components/user/quiz";
import { SliderComponent } from "@/components/user/slider";
import { AITutorComponent } from "@/components/user/ai-tutor";
import { HeaderComponent } from "@/components/user/HeaderComponent";
import { FooterComponent } from "@/components/user/FooterComponent";

// --- CLIENT-SIDE TYPE DEFINITION ---
interface StudioContentData {
  _id: string;
  title: string;
  thumbnail: string;
  data: string;
  version: number;
  tags?: string[];
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// --- EMPTY CANVAS COMPONENT ---
const EmptyCanvas = () => {
    const { connectors: { connect, drag } } = useNode();
    return (
        <div
            ref={(ref: HTMLDivElement) => { if (ref) connect(drag(ref)); }}
            className="w-full min-h-[60vh] flex items-center justify-center bg-muted/30 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
            <div className="text-center text-muted-foreground p-8">
                <UploadCloud className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-medium">Your Canvas is Empty</h3>
                <p className="mt-2 text-sm">
                    Click an icon on the toolbar below to add a component.
                </p>
            </div>
        </div>
    );
};

// --- STANDARD CANVAS WRAPPER ---
const MemoizedCanvas = memo(() => {
    return (
        <Frame>
            {/* **THE FIX**: Use the component via its string key from the resolver. */}
            <Element is="RenderCanvas" canvas id="ROOT">
                {/* Existing content will be rendered here by Craft.js */}
            </Element>
        </Frame>
    );
});
MemoizedCanvas.displayName = 'MemoizedCanvas';


// --- HEADER AND SAVE INDICATOR (Unchanged) ---
function SaveIndicator({ status }: { status: SaveStatus }) { /* ... no changes ... */ return <></> }
function StudioHeader({ content, saveStatus }: { content: StudioContentData | null, saveStatus: SaveStatus }) { /* ... no changes ... */ return <></> }


// --- MAIN STUDIO COMPONENT ---
export function StudioComponent({ contentId }: { contentId: string }) {
    const [content, setContent] = useState<StudioContentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [initialDataLoaded, setInitialDataLoaded] = useState(false);
    const [isCanvasEmpty, setIsCanvasEmpty] = useState(false);
    const [activeTool, setActiveTool] = useState<string | null>(null);

    const handleToolChange = (toolType: string) => {
        setActiveTool(prevTool => prevTool === toolType ? null : toolType);
    }
    useEffect(() => {
        setIsLoading(true);
        setInitialDataLoaded(false);
        fetch(`/api/content/${contentId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const fetchedContent = data.data as StudioContentData;
                    setContent(fetchedContent);
                    try {
                        const parsedData = JSON.parse(fetchedContent.data || "{}");
                        setIsCanvasEmpty(!parsedData.ROOT || Object.keys(parsedData.ROOT.nodes).length === 0);
                    } catch (e) {
                        setIsCanvasEmpty(true);
                    }
                } else { throw new Error(data.message || "Content not found."); }
            })
            .catch(err => { console.error("Failed to fetch content", err); setContent(null); })
            .finally(() => setIsLoading(false));
    }, [contentId]);

    const debouncedSave = useDebouncedCallback(async (json: string) => {
        setSaveStatus('saving');
        const parsedData = JSON.parse(json);
        if (isCanvasEmpty && parsedData.ROOT && Object.keys(parsedData.ROOT.nodes).length > 0) {
            setIsCanvasEmpty(false);
        }
        try {
            const res = await fetch(`/api/content/${contentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: json }) });
            if (!res.ok) throw new Error("Save failed");
            const updatedData = await res.json();
            setContent(prev => prev ? { ...prev, version: updatedData.data.version } : null);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) { console.error(err); setSaveStatus('error'); }
    }, 1500);

    function InitialContentLoader() {
        const { actions } = useEditor();
        useEffect(() => {
            if (content && !initialDataLoaded) {
                // **THE FIX**: The default JSON must use the STRING KEY from the resolver.
                const defaultJson = JSON.stringify({
                    "ROOT": {
                        "type": "RenderCanvas", // Use the string key 'RenderCanvas'
                        "isCanvas": true,
                        "props": {},
                        "displayName": "Page",
                        "nodes": []
                    }
                });
                const dataToLoad = content.data || defaultJson;
                actions.deserialize(dataToLoad);
                setInitialDataLoaded(true);
            }
        }, [content, actions, initialDataLoaded]);
        return null;
    }

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!content) return <div className="flex justify-center items-center h-full text-destructive font-medium">Content could not be loaded.</div>;

    return (
        <Editor
            key={contentId}
            // **THE FIX**: Add the RenderCanvas component to the resolver map.
            resolver={{ 
                RenderCanvas, // Key: "RenderCanvas", Value: the RenderCanvas component function
                EmptyCanvas,
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
            onNodesChange={(query) => {
                 if (initialDataLoaded) {
                    debouncedSave(query.serialize());
                 }
            }}
        >
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <StudioHeader content={content} saveStatus={saveStatus} />
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/40">
                    <div className="max-w-4xl mx-auto bg-background shadow-lg rounded-lg">
                       {isCanvasEmpty ? (
                            <Frame>
                                <Element is="EmptyCanvas" canvas id="EMPTY_CANVAS_NODE" />
                            </Frame>
                       ) : (
                            <MemoizedCanvas />
                       )}
                    </div>
                </div>
                        <Toolbar
                            onVideoButtonClick={() => handleToolChange('video')}
                            onImageButtonClick={() => handleToolChange('image')}
                            onSimulationButtonClick={() => handleToolChange('simulation')}
                            onTextButtonClick={() => handleToolChange('text')}
                        />
            </div>
            <InitialContentLoader />
        </Editor>
    );
}
