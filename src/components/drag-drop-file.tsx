import type React from "react"
import { useCallback } from "react"
import { useDropzone } from "react-dropzone"

interface DragDropFileProps {
  onFileDrop: (file: File) => void
  accept: Record<string, string[]>
  children: React.ReactNode
}

export function DragDropFile({ onFileDrop, accept, children }: DragDropFileProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileDrop(acceptedFiles[0])
      }
    },
    [onFileDrop],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
  })

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
    >
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop the file here ...</p> : children}
    </div>
  )
}

