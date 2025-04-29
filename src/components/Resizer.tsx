// ResizableElement.tsx
import React, { useRef, useEffect, useCallback } from "react";
import { Rnd } from "react-rnd"; // Import Rnd
import { useNode, Node } from "@craftjs/core";

interface ResizableElementProps {
    children: React.ReactNode;
    // Allow passing specific Rnd props if needed, like resizeGrid, dragGrid
    rndProps?: Partial<Rnd["props"]>;
}

// Define the expected structure of props for setProp type safety
interface NodeResizableProps {
    width?: number | string;
    height?: number | string;
    x?: number;
    y?: number;
}

export const ResizableElement: React.FC<ResizableElementProps> = ({
    children,
    rndProps = {}, // Accept optional Rnd specific props
}) => {
    const {
        id, // Get node id for logging/debugging
        connectors: { connect, drag },
        actions,
        selected, // Get selected state
        width: nodeWidth,
        height: nodeHeight,
        x: nodeX,
        y: nodeY,
    } = useNode((node: Node) => ({ // Ensure node type is imported and used
        // Ensure props exist before accessing nested properties
        width: node.data.props.width,
        height: node.data.props.height,
        x: node.data.props.x ?? 0, // Default position if not set
        y: node.data.props.y ?? 0,
        selected: node.events.selected,
    }));

    // Ref for the immediate child wrapper inside Rnd to observe its size
    const contentWrapperRef = useRef<HTMLDivElement>(null);
    // Ref to track if a manual resize/drag is in progress to avoid loops
    const isInteractingRef = useRef(false);
    // Ref to store the ResizeObserver instance
    const observerRef = useRef<ResizeObserver | null>(null);

    // --- Callback for ResizeObserver ---
    const handleResizeObservation = useCallback((entries: ResizeObserverEntry[]) => {
        if (isInteractingRef.current || !contentWrapperRef.current || entries.length === 0) {
            return; // Don't observe during manual interaction or if ref isn't ready
        }

        const entry = entries[0];
        // Use scrollHeight for content height, contentRect might be bounded by style
        const contentHeight = contentWrapperRef.current.scrollHeight;
        const contentWidth = contentWrapperRef.current.scrollWidth; // Less common to auto-adjust width

        // Get current node height, parsing if it's a string like 'auto' or '100px'
        let currentHeightNumeric = typeof nodeHeight === 'number' ? nodeHeight : parseFloat(nodeHeight || '0');
        if (isNaN(currentHeightNumeric)) currentHeightNumeric = 0; // Handle 'auto' or invalid strings

        // Only update height if it differs significantly and isn't 'auto' initially
        // Add a threshold to prevent jitter
        const heightDifference = Math.abs(contentHeight - currentHeightNumeric);

        // Decide if height needs update (content larger than current numeric height)
        // OR if current height is 'auto' (needs initial calculation)
        const needsHeightUpdate = nodeHeight === 'auto' || (contentHeight > 0 && heightDifference > 2); // Threshold of 2px

        if (needsHeightUpdate) {
             // console.log(`Node ${id}: Auto-adjusting height from ${nodeHeight} to ${contentHeight}`);
             actions.setProp((props: NodeResizableProps) => {
                 // *** Only set height automatically ***
                 props.height = contentHeight;
                 // Avoid setting width automatically unless specifically needed
                 // props.width = contentWidth;
             }, 50); // Debounce slightly
        }

    }, [actions, nodeHeight, id]); // Add dependencies


    // --- Effect to setup ResizeObserver ---
    useEffect(() => {
        const targetElement = contentWrapperRef.current;

        if (targetElement) {
            // Disconnect previous observer if it exists
            if (observerRef.current) {
                observerRef.current.disconnect();
            }

            // Create and observe
            const observer = new ResizeObserver(handleResizeObservation);
            observer.observe(targetElement);
            observerRef.current = observer; // Store observer instance

            // Trigger initial check in case content is already rendered
             handleResizeObservation([{ target: targetElement } as unknown as ResizeObserverEntry]); // Simulate entry

             // Cleanup on unmount or if target changes
            return () => {
                observer.disconnect();
                observerRef.current = null;
            };
        }
         // Ensure cleanup runs if the target becomes null
         return () => {
            if (observerRef.current) {
                 observerRef.current.disconnect();
                 observerRef.current = null;
             }
         };
    }, [handleResizeObservation]); // Re-run effect if the callback changes

    // --- Rnd Event Handlers ---
    const onResizeStart = () => { isInteractingRef.current = true; };
    const onDragStart = () => { isInteractingRef.current = true; };

    const onResizeStop = useCallback((e: any, direction: any, ref: HTMLElement, delta: any, position: { x: number, y: number }) => {
        isInteractingRef.current = false; // Interaction finished
        actions.setProp((props: NodeResizableProps) => {
            props.width = ref.offsetWidth;
            props.height = ref.offsetHeight;
            props.x = position.x;
            props.y = position.y;
        }, 0); // No debounce needed for direct interaction
    }, [actions]);

    const onDragStop = useCallback((e: any, d: { x: number, y: number }) => {
        isInteractingRef.current = false; // Interaction finished
        actions.setProp((props: NodeResizableProps) => {
            props.x = d.x;
            props.y = d.y;
        }, 0); // No debounce needed for direct interaction
    }, [actions]);

    // Calculate initial/current size for Rnd, handling 'auto' or undefined height
    const getRndSize = () => {
        let heightValue: number | string = nodeHeight ?? 'auto'; // Default to 'auto' if undefined
        if (heightValue === 'auto' && contentWrapperRef.current) {
             // Use measured scrollHeight if height is 'auto' and element exists
             heightValue = contentWrapperRef.current.scrollHeight || 50; // Default fallback height
        } else if (typeof heightValue === 'string') {
             heightValue = parseFloat(heightValue) || 50; // Parse string or use fallback
        } else if (typeof heightValue !== 'number') {
             heightValue = 50; // Fallback if invalid type
        }


        return {
            width: nodeWidth ?? 200, // Default width if undefined
            height: heightValue,
        };
    };

    const size = getRndSize();

    return (
        <Rnd
            size={size}
            position={{ x: nodeX, y: nodeY }}
            onResizeStart={onResizeStart}
            onResizeStop={onResizeStop}
            onDragStart={onDragStart}
            onDragStop={onDragStop}
            enableResizing={!isInteractingRef.current && selected} // Only allow when selected and not interacting
            disableDragging={isInteractingRef.current || !selected} // Only allow when selected and not interacting
            // enableResizing={selected ? undefined : { /* disable all handles */ top:false, right:false, bottom:false, left:false, topRight:false, bottomRight:false, bottomLeft:false, topLeft:false }}
            // disableDragging={!selected}
            bounds="parent"
            minWidth={50} // Prevent resizing too small
            minHeight={30}
            ref={(rndInstance: Rnd | null) => {
                // Get the actual DOM element managed by Rnd
                const element = rndInstance?.resizableElement?.current;
                if (element) {
                    connect(drag(element));
                }
            }}
            style={{
                 border: selected ? "1px dashed blue" : "1px dashed transparent", // Indicate selection
                 zIndex: selected ? 1000 : 'auto', // Bring selected to front
                 // backgroundColor: 'rgba(255, 0, 0, 0.1)', // DEBUG: Make background visible
                 position: 'absolute', // Explicitly state absolute positioning used by Rnd
                 // overflow: 'visible', // Rnd needs overflow visible for handles
            }}
            {...rndProps} // Spread any additional Rnd props passed in
        >
            {/* This inner div is now observed for its scrollHeight */}
            <div
                ref={contentWrapperRef}
                style={{
                    width: "100%",
                    // *** IMPORTANT: Set height dynamically for observer ***
                    // Let height be determined by content flow for scrollHeight measurement
                    height: "auto",
                    minHeight: '100%', // Ensure it tries to fill Rnd container initially
                    position: "relative", // For potential absolute children
                    overflow: "hidden", // Clip content visually to Rnd bounds
                     // backgroundColor: 'rgba(0, 255, 0, 0.1)', // DEBUG: Make inner div visible
                }}
            >
                {children}
            </div>
        </Rnd>
    );
};