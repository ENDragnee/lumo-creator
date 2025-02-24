// components/user/quill-wrapper.tsx
"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useHistoryStore } from "@/lib/history-store";

export const QuillWrapper = forwardRef(({
  value,
  onChange,
  nodeId,
}: {
  value: string;
  onChange: (content: string) => void;
  nodeId: string;
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const { undo, redo } = useHistoryStore();

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      const quill = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: {
            container: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline", "strike", "link"],
              [{ list: "ordered" }, { list: "bullet" }],
              [{ color: [] }, { background: [] }],
              [{ align: [] }],
              ["undo", "redo"],
            ],
            handlers: {
              undo: () => {
                const content = undo(nodeId);
                if (content) {
                  quill.clipboard.dangerouslyPasteHTML(content);
                  onChange(content);
                }
              },
              redo: () => {
                const content = redo(nodeId);
                if (content) {
                  quill.clipboard.dangerouslyPasteHTML(content);
                  onChange(content);
                }
              },
              link: function() {
                const url = prompt("Enter the URL");
                if (url) {
                  let newUrl = url.trim();
                  // Ensure the URL starts with https://
                  if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
                    newUrl = "https://" + newUrl;
                  } else if (newUrl.startsWith("http://")) {
                    newUrl = newUrl.replace("http://", "https://");
                  }
                  // Apply the formatted link
                  const range = quill.getSelection();
                  if (range) {
                    quill.format("link", newUrl);
                  }
                }
              },
            },
          },
        },
      });

      quill.on("text-change", () => {
        const content = quill.root.innerHTML;
        onChange(content);
      });

      quillRef.current = quill;
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    getEditor: () => quillRef.current,
  }));

  return (
    <div className="bg-background">
      <div ref={editorRef} className="h-full" />
    </div>
  );
});

QuillWrapper.displayName = "QuillWrapper";