"use client"

import React, { useState, useEffect } from "react"
import { useEditor } from "@craftjs/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VideoUploader } from "./video-uploader"
import { VideoList } from "./video-list"

interface Video {
  filename: string
  thumbnailUrl: string
}

async function fetchUserVideos(userId: string): Promise<Video[]> {
  const response = await fetch(`/api/get-user-videos?userId=${userId}`)
  const data = await response.json()
  return data.success ? data.videos : []
}

async function removeVideo(userId: string, filename: string): Promise<boolean> {
  const response = await fetch(`/api/remove-video?userId=${userId}&filename=${filename}`, {
    method: "DELETE",
  })
  const data = await response.json()
  return data.success
}

export function Sidebar() {
  const { selected } = useEditor((state, query) => {
    const currentNodeId = query.getEvent("selected").last()
    let selected
    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings: state.nodes[currentNodeId].related && state.nodes[currentNodeId].related.settings,
      }
    }

    return {
      selected,
    }
  })

  const [videos, setVideos] = useState<Video[]>([])
  const [videoLink, setVideoLink] = useState("")
  const userId = "test" // Replace this with actual user ID when you implement authentication

  useEffect(() => {
    fetchUserVideos(userId).then(setVideos)
  }, [])

  const handleVideoUpload = (filename: string, thumbnailUrl: string) => {
    setVideos((prevVideos) => [...prevVideos, { filename, thumbnailUrl }])
  }

  const handleVideoRemove = async (filename: string) => {
    const success = await removeVideo(userId, filename)
    if (success) {
      setVideos((prevVideos) => prevVideos.filter((video) => video.filename !== filename))
    } else {
      console.error("Failed to remove video and thumbnail")
    }
  }

  const handleLinkUpload = () => {
    if (videoLink) {
      // Here you would typically send this link to your backend to process
      // For now, we'll just add it to the list with a placeholder thumbnail
      setVideos((prevVideos) => [...prevVideos, { filename: videoLink, thumbnailUrl: "/placeholder-thumbnail.jpg" }])
      setVideoLink("")
    }
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Video Library</h2>
        <VideoUploader onUpload={handleVideoUpload} userId={userId} />
        <div className="mt-4">
          <Input
            type="text"
            placeholder="Enter video URL"
            value={videoLink}
            onChange={(e) => setVideoLink(e.target.value)}
          />
          <Button onClick={handleLinkUpload} className="mt-2">
            Add Video Link
          </Button>
        </div>
        <VideoList videos={videos} onRemove={handleVideoRemove} />
      </div>
      {selected && selected.name === "Video" && (
        <div className="p-4 border-t">
          <h2 className="text-lg font-semibold mb-4">Video Settings</h2>
          {selected.settings && React.createElement(selected.settings)}
        </div>
      )}
    </div>
  )
}

