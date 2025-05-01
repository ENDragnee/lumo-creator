// components/StackResizableWrapper.tsx
"use client";

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { throttle } from 'lodash-es';

// --- Constants ---
const THROTTLE_WAIT = 30; // Update Craft state roughly 33 times per second (adjust as needed)

interface StackResizableWrapperProps {
    children: React.ReactNode;
    nodeId: string;
    enableWidthResize?: boolean;
    enableHeightResize?: boolean;
    minWidth?: number;
    minHeight?: number;
    aspectRatio?: string | null;
}

// Helper to parse dimension string/number to number for calculations
const parseSize = (size: string | number | undefined, elementSize: number): number => {
    if (typeof size === 'number') return size;
    if (typeof size === 'string') {
        const parsed = parseFloat(size);
        // Prefer pixel values from props if available and valid
        if (!isNaN(parsed) && (size.endsWith('px') || /^\d+(\.\d+)?$/.test(size))) {
             return parsed;
        }
        // Ignore other units like %, vw, etc., for drag calculations, use measured size
    }
    // Fallback to the measured element size if props are invalid/unsuitable
    return elementSize;
};

// Helper to parse aspect ratio string
const parseAspectRatio = (ratioStr: string | null): number | null => {
    if (!ratioStr || typeof ratioStr !== 'string') return null;
    const parts = ratioStr.split(/[/:]/);
    if (parts.length === 2) {
        const w = parseFloat(parts[0]);
        const h = parseFloat(parts[1]);
        if (!isNaN(w) && !isNaN(h) && h !== 0 && w > 0 && h > 0) {
            return w / h; // width / height ratio
        }
    }
    console.warn(`Invalid aspect ratio format: "${ratioStr}". Use "W:H" or "W/H".`);
    return null;
};


export const StackResizableWrapper: React.FC<StackResizableWrapperProps> = ({
    children,
    nodeId,
    enableWidthResize = true,
    enableHeightResize = true,
    minWidth = 50,
    minHeight = 30,
    aspectRatio = null,
}) => {
    const { actions, props: nodeProps } = useNode((node) => ({
        props: node.data.props,
    }));
    const nodeWidth = nodeProps.width;
    const nodeHeight = nodeProps.height;


    const { enabled: editorEnabled, selected } = useEditor((state, query) => ({
        enabled: state.options.enabled,
        selected: query.getEvent('selected').contains(nodeId),
    }));

    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [handleInUse, setHandleInUse] = useState<'right' | 'bottom' | null>(null);
    const startPos = useRef({ x: 0, y: 0 });
    const startSize = useRef({ width: 0, height: 0 });
    const numericAspectRatio = parseAspectRatio(aspectRatio);

    // --- Throttled Prop Update ---
    // This function updates the actual Craft.js state
    const throttledSetProp = useCallback(
        throttle((newProps: { width?: number; height?: number }) => {
            actions.setProp((props: { width?: string; height?: string }) => {
                // Always set as pixels after resizing
                if (newProps.width !== undefined) props.width = `${newProps.width}px`;
                if (newProps.height !== undefined) props.height = `${newProps.height}px`;
            }, 50); // Add a small debounce time to the setProp itself if needed
        }, THROTTLE_WAIT, { leading: true, trailing: true }), // Ensure leading and trailing calls
        [actions] // Dependency: only actions needed
    );

    // --- Mouse Move Handler (wrapped in useCallback) ---
    const handleMouseMove = useCallback((e: MouseEvent) => {
        // Guard clauses
        if (!isResizing || !handleInUse || !wrapperRef.current) return;

        // Prevent default browser behavior during drag
        e.preventDefault();

        const currentPos = { x: e.clientX, y: e.clientY };
        const deltaX = currentPos.x - startPos.current.x;
        const deltaY = currentPos.y - startPos.current.y;

        let newWidth = startSize.current.width;
        let newHeight = startSize.current.height;

        // Calculate new dimensions based on the handle used
        if (handleInUse === 'right' && enableWidthResize) {
            newWidth = startSize.current.width + deltaX;
            // Apply aspect ratio if locked
            if (numericAspectRatio) {
                newHeight = newWidth / numericAspectRatio;
            }
        } else if (handleInUse === 'bottom' && enableHeightResize) {
            // Only allow independent height resize if aspect ratio is NOT locked
            if (!numericAspectRatio) {
                 newHeight = startSize.current.height + deltaY;
            }
            // If aspect ratio WAS locked, dragging bottom handle should ideally adjust width too
            // else {
            //    newHeight = startSize.current.height + deltaY; // Calculate height first
            //    newWidth = newHeight * numericAspectRatio; // Then adjust width
            //}
            // Keep it simple: For now, bottom handle only works if AR is not locked.
        }

        // Apply minimum size constraints
        newWidth = Math.max(minWidth, newWidth);
        newHeight = Math.max(minHeight, newHeight);

        // --- CRITICAL FOR FLUIDITY: Apply styles directly for immediate feedback ---
        wrapperRef.current.style.width = `${newWidth}px`;
        wrapperRef.current.style.height = `${newHeight}px`;
        // --------------------------------------------------------------------------

        // Throttle the update to Craft.js state
        throttledSetProp({ width: newWidth, height: newHeight });

    }, [
        isResizing,
        handleInUse,
        enableWidthResize,
        enableHeightResize,
        numericAspectRatio,
        minWidth,
        minHeight,
        throttledSetProp // Include throttled function in dependencies
        // startPos and startSize are refs, they don't need to be dependencies
    ]);

    // --- Mouse Up Handler (wrapped in useCallback) ---
    const handleMouseUp = useCallback(() => {
        if (!isResizing) return;

        // Ensure the final state is definitely set
        throttledSetProp.flush(); // Send any pending throttled update immediately

        setIsResizing(false);
        setHandleInUse(null);

        // Remove global listeners
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        // Optional: Slightly delay removing inline styles if needed,
        // but usually Craft's re-render with final props takes over correctly.
        // setTimeout(() => {
        //   if (wrapperRef.current) {
        //      wrapperRef.current.style.width = ''; // Let CSS/props take over again
        //      wrapperRef.current.style.height = '';
        //    }
        // }, 0);

    }, [isResizing, handleMouseMove, throttledSetProp]); // handleMouseMove is stable due to its own useCallback


    // --- Mouse Down Handler ---
    const handleMouseDown = useCallback((
        e: React.MouseEvent<HTMLDivElement>,
        handle: 'right' | 'bottom'
    ) => {
        if (!editorEnabled || !wrapperRef.current) return;

        e.preventDefault();
        e.stopPropagation();

        setIsResizing(true);
        setHandleInUse(handle);
        startPos.current = { x: e.clientX, y: e.clientY };

        // Get initial size accurately from the element's current dimensions
        const currentRect = wrapperRef.current.getBoundingClientRect();
        startSize.current = { width: currentRect.width, height: currentRect.height };
        // Note: Using getBoundingClientRect is more reliable here than offsetWidth/Height
        // especially if transforms or box-sizing are involved.

        // Add global listeners
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [editorEnabled, handleMouseMove, handleMouseUp]); // Add dependent callbacks


    // --- Cleanup Effect ---
    useEffect(() => {
        // Cleanup global listeners if component unmounts while resizing
        return () => {
            if (isResizing) { // Check isResizing state on cleanup
                throttledSetProp.cancel(); // Cancel any pending throttled calls
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            }
        };
    }, [isResizing, handleMouseMove, handleMouseUp, throttledSetProp]);


    // --- Render Handles ---
    const renderHandles = () => {
        if (!selected || !editorEnabled) return null;

        // Conditionally disable bottom handle if aspect ratio is set AND we only want
        // resizing from the width-controlling handle (right handle in this case).
        // If you wanted the bottom handle to *also* work with aspect ratio, you'd adjust logic here and in handleMouseMove.
        const showBottomHandle = enableHeightResize && !numericAspectRatio;

        return (
            <>
                {enableWidthResize && (
                    <div
                        className="absolute -right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 border border-white rounded-full cursor-ew-resize z-10 shadow-md" // rounded-full might look nicer
                        style={{ touchAction: 'none' }} // Prevent scrolling on touch devices
                        onMouseDown={(e) => handleMouseDown(e, 'right')} // Corrected line
                        title="Resize width"
                    />
                )}
                {showBottomHandle && (
                    <div
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-blue-500 border border-white rounded-full cursor-ns-resize z-10 shadow-md" // rounded-full
                        style={{ touchAction: 'none' }} // Prevent scrolling on touch devices
                        onMouseDown={(e) => handleMouseDown(e, 'bottom')} // Corrected line
                        title="Resize height"
                    />
                )}
                {/* Consider adding a bottom-right corner handle for aspect ratio resizing */}
                {/* {enableWidthResize && enableHeightResize && numericAspectRatio && ( ... corner handle ... )} */}

            </>
        );
    };

    // --- Wrapper Style ---
    // Let Craft's props drive the initial/final size. Inline styles are applied *during* resize for fluidity.
    const wrapperStyle: React.CSSProperties = {
        position: 'relative', // Crucial for absolute positioning of handles
        width: nodeWidth ?? 'auto',
        height: nodeHeight ?? 'auto',
        outline: selected && editorEnabled ? '2px dashed blue' : 'none',
        outlineOffset: '3px',
        transition: isResizing ? 'none' : 'outline 0.1s ease-in-out', // Disable outline transition during resize
        boxSizing: 'border-box', // Usually desired for layout consistency
    };

    return (
        <div ref={wrapperRef} style={wrapperStyle} className="craft-resizable-wrapper">
            {/* Inner div ensures children are constrained by the wrapper size */}
            <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                 {children}
            </div>
            {renderHandles()}
        </div>
    );
};