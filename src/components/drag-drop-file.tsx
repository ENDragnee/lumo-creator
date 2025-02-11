"use client"

import { useState } from "react"

interface DragDropFileProps {
  onFileDrop: (file: File) => void
  accept?: { [key: string]: any[] }
  children?: React.ReactNode
}

export function DragDropFile({ onFileDrop, accept, children }: DragDropFileProps) {
  const [highlight, setHighlight] = useState(false)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setHighlight(true)
  }

  const handleDragLeave = () => {
    setHighlight(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setHighlight(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFileDrop(files[0])
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-4 text-center ${highlight ? "border-blue-500" : "border-gray-300"}`}
    >
      {children}
    </div>
  )
}

