// components/user/tiptap-wrapper.tsx
"use client";

import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { useHistoryStore } from "@/lib/history-store";

export const TipTapWrapper = forwardRef(({
  value,
  onChange,
  nodeId,
}: {
  value: string;
  onChange: (content: string) => void;
  nodeId: string;
}, ref) => {
  const { undo, redo } = useHistoryStore();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Link.configure({
        protocols: ["https"],
        validate: href => /^https?:\/\//.test(href),
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
  }));

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  const handleLink = () => {
    const previousUrl = editor?.getAttributes("link").href;
    const url = prompt("Enter URL", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().unsetLink().run();
      return;
    }

    let newUrl = url.trim();
    if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
      newUrl = "https://" + newUrl;
    } else if (newUrl.startsWith("http://")) {
      newUrl = newUrl.replace("http://", "https://");
    }

    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: newUrl })
      .run();
  };

  if (!editor) return null;

  return (
    <div className="bg-background">
      <div className="flex flex-wrap gap-1 p-2 border-b">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded ${editor.isActive("bold") ? "bg-gray-200" : ""}`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded ${editor.isActive("italic") ? "bg-gray-200" : ""}`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1 rounded ${editor.isActive("underline") ? "bg-gray-200" : ""}`}
        >
          Underline
        </button>
        <button
          type="button"
          onClick={handleLink}
          className={`p-1 rounded ${editor.isActive("link") ? "bg-gray-200" : ""}`}
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1 rounded ${editor.isActive("bulletList") ? "bg-gray-200" : ""}`}
        >
          List
        </button>
        <select
          value={editor.getAttributes("textAlign").textAlign || "left"}
          onChange={(e) => 
            editor.chain().focus().setTextAlign(e.target.value).run()
          }
          className="p-1 rounded"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </select>
        <button
          type="button"
          onClick={() => {
            const content = undo(nodeId);
            content && editor.commands.setContent(content, false);
          }}
          className="p-1 rounded"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => {
            const content = redo(nodeId);
            content && editor.commands.setContent(content, false);
          }}
          className="p-1 rounded"
        >
          Redo
        </button>
      </div>
      <EditorContent editor={editor} className="p-2 h-[150px] overflow-auto" />
    </div>
  );
});

TipTapWrapper.displayName = "TipTapWrapper";