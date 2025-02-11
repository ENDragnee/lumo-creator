"use client"

import { useNode } from "@craftjs/core"
import { useState, useEffect, useCallback } from "react"
import type React from "react"

interface ResizeHandleProps {
  onResizeStart?: () => void
  onResizeEnd?: () => void
}

export function ResizeHandle({ onResizeStart, onResizeEnd }: ResizeHandleProps) {
  const {
    id,
    actions,
    connectors: { connect },
  } = useNode()
  const [isResizing, setIsResizing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [startDimensions, setStartDimensions] = useState({ width: 0, height: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const element = e.currentTarget.parentElement
      if (!element) return

      setIsResizing(true)
      setStartPos({ x: e.clientX, y: e.clientY })
      setStartDimensions({
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
      })
      onResizeStart?.()
    },
    [onResizeStart]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return

      const dx = e.clientX - startPos.x
      const dy = e.clientY - startPos.y

      actions.setProp((props: any) => {
        props.style = {
          ...props.style,
          width: `${startDimensions.width + dx}px`,
          height: `${startDimensions.height + dy}px`,
        }
      })
    },
    [isResizing, startPos, startDimensions, actions]
  )

  const handleMouseUp = useCallback(() => {
    if (!isResizing) return

    setIsResizing(false)
    onResizeEnd?.()
  }, [isResizing, onResizeEnd])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={connect as unknown as React.Ref<HTMLDivElement>}
      className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize"
      onMouseDown={handleMouseDown}
    />
  )
}

export default ResizeHandle