"use client"
import React from "react";
import { useNode, useEditor } from "@craftjs/core";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ResizableElement } from "@/components/Resizer";

export interface VideoComponentProps {
  src: string;
  // These are props used by ResizableElement and saved by Craft
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export const VideoComponent: React.FC<VideoComponentProps> & { craft?: any } = ({
  src,
  // Note: x, y, width, height are handled by ResizableElement via useNode props
}) => {
  const {
    connectors: { connect, drag },
    selected,
    id,
  } = useNode((node) => ({
    selected: node.events.selected,
    id: node.id,
  }));

  const { actions: editorActions } = useEditor();

  const handleRemove = () => {
    editorActions.delete(id);
  };

  const isExternalUrl = src.startsWith('http://') || src.startsWith('https://');

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch')) {
      const videoId = new URL(url).searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    
    if (url.includes('youtu.be')) {
      const videoId = url.split('/').pop();
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    
    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      if (videoId) return `https://player.vimeo.com/video/${videoId}`;
    }
    
    if (url.includes('/embed/') || url.includes('/player/')) {
      return url;
    }
    
    return url;
  };

  return (
    // ResizableElement handles size and position
    <ResizableElement>
      <div
        className={`relative w-full h-full ${selected ? "outline outline-2 outline-blue-500" : ""}`}
      >
        {/* Drag handle */}
        <div
          ref={(ref) => {
            if (ref) {
              connect(drag(ref));
            }
          }}
          className="absolute inset-0 z-10 cursor-move"
          style={{ background: "transparent" }}
        />
        
        {selected && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 z-20"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        
        {/* Video content */}
        {isExternalUrl ? (
          <iframe
            src={getEmbedUrl(src)}
            className="w-full h-full"
            style={{
              display: "block",
              borderRadius: "var(--radius)",
              border: "none",
              pointerEvents: selected ? "auto" : "none"
            }}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          />
        ) : (
          <video
            src={src}
            controls
            className="w-full h-full"
            style={{
              display: "block",
              borderRadius: "var(--radius)",
              pointerEvents: selected ? "auto" : "none"
            }}
          />
        )}
      </div>
    </ResizableElement>
  );
};

VideoComponent.craft = {
  displayName: "Video",
  props: {
    src: "",
    x: 0, // These props will be set by ResizableElement
    y: 0,
    width: 400, // Default size for editor
    height: 300,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => false, // Typically you can't drop things into a Video
    canMoveOut: () => true,
  },
};