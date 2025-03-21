"use client"
import React, { useEffect } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { ResizeHandle } from "@/components/resize-handle";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ResizableElement } from "@/components/Resizer";

interface VideoComponentProps {
  src: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export const VideoComponent = ({
  src,
  x = 0,
  y = 0,
  width = 200,
  height = 150,
}: VideoComponentProps) => {
  const {
    connectors: { connect, drag },
    selected,
    id,
    actions,
    nodeWidth,
    nodeHeight,
  } = useNode((node) => ({
    selected: node.events.selected,
    id: node.id,
    nodeWidth: node.data.props.width,
    nodeHeight: node.data.props.height,
  }));

  const { actions: editorActions } = useEditor();

  useEffect(() => {
    actions.setProp((props: any) => {
      props.width = nodeWidth;
      props.height = nodeHeight;
    });
  }, [nodeWidth, nodeHeight, actions]);

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

  // VideoComponent.tsx (updated part)
return (
  <ResizableElement>
    <div
      className={`relative ${selected ? "outline outline-2 outline-blue-500" : ""}`}
      style={{
        width: "100%",
        height: "100%", // Remove left/top positioning
      }}
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
    x: 0,
    y: 0,
    width: 200,
    height: 150,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
};