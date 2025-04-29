// components/StackResizableWrapper.tsx
"use client";

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { throttle } from 'lodash-es'; // Use lodash throttle

interface StackResizableWrapperProps {
    children: React.ReactNode;
    nodeId: string; // Pass node ID for prop updates
    // Define which handles to show
    enableWidthResize?: boolean;
    enableHeightResize?: boolean;
    // Constraints (optional)
    minWidth?: number;
    minHeight?: number;
    aspectRatio?: string | null; // Pass aspect ratio if it needs to be maintained
}

// Helper to parse dimension string/number to number
const parseSize = (size: string | number | undefined, defaultValue: number): number => {
    if (typeof size === 'number') return size;
    if (typeof size === 'string') {
        const parsed = parseFloat(size);
        // Basic check for pixel values, ignore percentages for direct manipulation here
        return !isNaN(parsed) && size.endsWith('px') ? parsed : defaultValue;
        // Note: This basic parsing assumes pixel values for direct manipulation.
        // Setting percentages would still work initially via props, but dragging modifies pixels.
    }
    return defaultValue;
};


export const StackResizableWrapper: React.FC<StackResizableWrapperProps> = ({
    children,
    nodeId,
    enableWidthResize = true, // Default to allow width resize
    enableHeightResize = true, // Default to allow height resize
    minWidth = 50,
    minHeight = 30,
    aspectRatio = null, // No aspect ratio by default
}) => {
    const { actions, width: nodeWidth, height: nodeHeight } = useNode((node) => ({
        width: node.data.props.width,
        height: node.data.props.height,
    }));

    const { enabled: editorEnabled, selected } = useEditor((state, query) => ({
        enabled: state.options.enabled,
        // Check if the current node (passed by ID) is selected
        selected: query.getEvent('selected').contains(nodeId),
    }));

    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [handleInUse, setHandleInUse] = useState<'right' | 'bottom' | null>(null);
    const startPos = useRef({ x: 0, y: 0 });
    const startSize = useRef({ width: 0, height: 0 });

    // --- Aspect Ratio Calculation ---
    const parseAspectRatio = (ratioStr: string | null): number | null => {
        if (!ratioStr || typeof ratioStr !== 'string') return null;
        const parts = ratioStr.split(/[/:]/); // Split by / or :
        if (parts.length === 2) {
            const w = parseFloat(parts[0]);
            const h = parseFloat(parts[1]);
            if (!isNaN(w) && !isNaN(h) && h !== 0) {
                return w / h; // Return the ratio value (width/height)
            }
        }
        return null;
    };
    const numericAspectRatio = parseAspectRatio(aspectRatio);

    // --- Throttled Prop Update ---
    // Use useCallback to ensure the throttled function isn't recreated needlessly
    const throttledSetProp = useCallback(
        throttle((newProps: { width?: number; height?: number }) => {
            actions.setProp((props: { width?: string; height?: string }) => {
                if (newProps.width !== undefined) props.width = `${newProps.width}px`;
                if (newProps.height !== undefined) props.height = `${newProps.height}px`;
            });
        }, 50), // Throttle updates to ~20fps max
        [actions, nodeId] // Dependencies for useCallback
    );

    // --- Mouse Down Handler ---
    const handleMouseDown = (
        e: React.MouseEvent<HTMLDivElement>,
        handle: 'right' | 'bottom'
    ) => {
        if (!editorEnabled || !wrapperRef.current) return;

        e.preventDefault(); // Prevent text selection, etc.
        e.stopPropagation(); // Prevent triggering node selection/drag

        setIsResizing(true);
        setHandleInUse(handle);
        startPos.current = { x: e.clientX, y: e.clientY };

        // Get initial size from node props, fallback to element size
        const currentWidth = parseSize(nodeWidth, wrapperRef.current.offsetWidth);
        const currentHeight = parseSize(nodeHeight, wrapperRef.current.offsetHeight);
        startSize.current = { width: currentWidth, height: currentHeight };

        // Add global listeners
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // --- Mouse Move Handler ---
    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing || !handleInUse || !wrapperRef.current) return;

        const currentPos = { x: e.clientX, y: e.clientY };
        const deltaX = currentPos.x - startPos.current.x;
        const deltaY = currentPos.y - startPos.current.y;

        let newWidth = startSize.current.width;
        let newHeight = startSize.current.height;

        // Calculate new dimensions based on the handle used
        if (handleInUse === 'right') {
            newWidth = Math.max(minWidth, startSize.current.width + deltaX);
            if (numericAspectRatio && enableWidthResize) {
                // Adjust height based on new width and aspect ratio
                newHeight = Math.max(minHeight, newWidth / numericAspectRatio);
            }
        }

        // Allow height resize ONLY if aspect ratio is not enforced OR if the bottom handle is explicitly enabled
        if (handleInUse === 'bottom' && enableHeightResize && !numericAspectRatio) {
             newHeight = Math.max(minHeight, startSize.current.height + deltaY);
             // If we allow bottom handle with aspect ratio, width should adjust - less common
             // if (numericAspectRatio) {
             //    newWidth = Math.max(minWidth, newHeight * numericAspectRatio);
             // }
        }


        // Apply constraints
        newWidth = Math.max(minWidth, newWidth);
        newHeight = Math.max(minHeight, newHeight);


        // Update element style directly for immediate feedback (optional but smoother)
        // wrapperRef.current.style.width = `${newWidth}px`;
        // wrapperRef.current.style.height = `${newHeight}px`;

        // Throttle the update to Craft.js state
        throttledSetProp({ width: newWidth, height: newHeight });
    };

    // --- Mouse Up Handler ---
    const handleMouseUp = () => {
        if (!isResizing) return;

        // Ensure the final state is set without throttle delay
        throttledSetProp.flush(); // Send any pending throttled update immediately

        setIsResizing(false);
        setHandleInUse(null);

        // Remove global listeners
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    // --- Cleanup ---
    useEffect(() => {
        // Cleanup global listeners if component unmounts while resizing
        return () => {
            if (isResizing) {
                throttledSetProp.cancel(); // Cancel any pending throttled calls
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            }
        };
    }, [isResizing, handleMouseMove, handleMouseUp, throttledSetProp]); // Added handleMouseMove/Up deps


    // --- Render Handles ---
    const renderHandles = () => {
        if (!selected || !editorEnabled) return null;

        // Conditionally disable bottom handle if aspect ratio is set
        const showBottomHandle = enableHeightResize && !numericAspectRatio;

        return (
            <>
                {enableWidthResize && (
                    <div
                        className="absolute -right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 border border-white rounded-sm cursor-ew-resize z-10"
                        onMouseDown={(e) => handleMouseDown(e, 'right')}
                        title="Resize width"
                    />
                )}
                {showBottomHandle && (
                    <div
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-blue-500 border border-white rounded-sm cursor-ns-resize z-10"
                        onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                        title="Resize height"
                    />
                )}
                {/* Add corner handles if needed later */}
            </>
        );
    };

    // --- Wrapper Style ---
    // Apply the width/height props directly as style to the wrapper
    // The child component inside should usually be 100% width/height of this wrapper
    const wrapperStyle: React.CSSProperties = {
        position: 'relative', // Needed for handle positioning
        width: nodeWidth ?? 'auto', // Use node prop width
        height: nodeHeight ?? 'auto', // Use node prop height
        // Ensure outline doesn't overlap handles
        outline: selected && editorEnabled ? '2px dashed blue' : 'none',
        outlineOffset: '3px', // Increase offset
        transition: 'outline 0.1s ease-in-out',
        // Prevent wrapper itself from shrinking smaller than content naturally requires
        // minWidth: 'fit-content', // Careful: might conflict with explicit width
        // minHeight: 'fit-content', // Careful: might conflict with explicit height
    };


    return (
        <div ref={wrapperRef} style={wrapperStyle}>
            {/* Content takes full space of the wrapper */}
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                 {children}
            </div>
            {renderHandles()}
        </div>
    );
};