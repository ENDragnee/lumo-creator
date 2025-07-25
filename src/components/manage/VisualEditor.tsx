"use client";

import React, { useState, useMemo, useCallback, useEffect, MouseEvent } from 'react';
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  Connection,
  Edge,
  Node,
  OnEdgesChange,
  OnNodesChange,
  applyEdgeChanges,
  applyNodeChanges,
  EdgeMouseHandler,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import { IContentGraphItem } from '@/app/home/manage/page';
import { useAppSelector } from '@/app/store/hooks';
import { RootState } from '@/app/store/store';
import { cn } from '@/lib/utils';
import { EditorToolbar } from './EditorToolbar';

interface VisualEditorProps {
  contentItems: IContentGraphItem[];
  onPrerequisitesChange: (contentId: string, prerequisites: string[]) => void;
}

export function VisualEditor({ contentItems, onPrerequisitesChange }: VisualEditorProps) {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const activeTool = useAppSelector((state: RootState) => state.managerTool.tool);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  useEffect(() => {
    // --- FIX: Add explicit types to map parameters ---
    const newNodes: Node[] = contentItems.map((item: IContentGraphItem, index: number) => ({
      id: item._id,
      type: 'custom',
      position: { x: (index % 5) * 280, y: Math.floor(index / 5) * 180 },
      data: { label: item.title, thumbnail: item.thumbnail },
    }));

    const newEdges: Edge[] = [];
    // --- FIX: Add explicit types to forEach parameters ---
    contentItems.forEach((item: IContentGraphItem) => {
      item.prerequisites?.forEach((prereqId: string) => {
        if (contentItems.some((n: IContentGraphItem) => n._id === prereqId)) {
          newEdges.push({
            id: `e-${prereqId}-${item._id}`,
            source: prereqId,
            target: item._id,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
          });
        }
      });
    });
    setNodes(newNodes);
    setEdges(newEdges);
  }, [contentItems]);

  const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onConnect = useCallback((params: Connection | Edge) => {
    if (activeTool !== 'connect') return;
    if (params.source === params.target) return;
    const newEdge = { ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed } };
    setEdges((eds) => addEdge(newEdge, eds));
    
    // --- FIX: Add explicit type to find parameter ---
    const targetNode = contentItems.find((item: IContentGraphItem) => item._id === params.target);
    if (targetNode && params.source) {
      const newPrerequisites = [...new Set([...(targetNode.prerequisites || []), params.source])];
      onPrerequisitesChange(targetNode._id, newPrerequisites);
    }
  }, [contentItems, onPrerequisitesChange, activeTool]);

  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    const updates = edgesToDelete.reduce((
      acc: Record<string, Set<string>>,
      edge: Edge
    ) => {
      const targetId = edge.target;
      const sourceId = edge.source;
      if (!acc[targetId]) {
        // --- FIX: Add explicit type to find parameter ---
        const targetNode = contentItems.find((item: IContentGraphItem) => item._id === targetId);
        acc[targetId] = new Set(targetNode?.prerequisites || []);
      }
      acc[targetId].delete(sourceId);
      return acc;
    }, {} as Record<string, Set<string>>);

    Object.entries(updates).forEach(([targetId, newPrerequisitesSet]) => {
      const newPrerequisitesArray = Array.from(newPrerequisitesSet);
      onPrerequisitesChange(targetId, newPrerequisitesArray);
    });
  }, [contentItems, onPrerequisitesChange]);

  const handleEdgeClick: EdgeMouseHandler = useCallback((
    _event: MouseEvent, // <-- FIX: Prefix unused parameter with underscore
    edge: Edge
  ) => {
    if (activeTool === 'delete') {
      onEdgesDelete([edge]);
    }
  }, [activeTool, onEdgesDelete]);

  return (
    <div className="h-[70vh] w-full border rounded-lg bg-background shadow-inner relative">
      <EditorToolbar />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={activeTool === 'connect'}
        nodesConnectable={activeTool === 'connect'}
        elementsSelectable={activeTool === 'connect'}
        className={cn(activeTool === 'delete' && 'delete-cursor')}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
