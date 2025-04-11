import React from 'react';

export interface TextComponentViewerProps {
  text?: string;
  fontSize?: string | number; // Example prop if you allow setting font size
  // Add other props saved by TextComponent (alignment, color, etc.)
}

export const TextComponentViewer: React.FC<TextComponentViewerProps> = ({
  text = "Placeholder Text",
  fontSize = '1rem', // Default font size
  // ... other props
}) => {
  return (
    // Use Tailwind classes or standard CSS for styling
    // 'my-2' adds vertical margin
    // 'prose' (from @tailwindcss/typography) can provide nice default text styling
    <div
      className="my-2 prose max-w-none" // max-w-none prevents prose from limiting width
      style={{ fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize }}
    >
      {/* Use dangerouslySetInnerHTML ONLY if the text content is guaranteed to be safe HTML */}
      {/* Otherwise, render as plain text or use a markdown parser */}
      {/* Option 1: Plain text */}
       <p>{text}</p>

      {/* Option 2: If text prop might contain safe HTML from a rich text editor */}
      {/* <div dangerouslySetInnerHTML={{ __html: text }} /> */}
    </div>
  );
};