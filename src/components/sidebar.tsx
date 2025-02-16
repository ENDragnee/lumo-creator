import React, { useState, useEffect } from "react"
import { useEditor } from "@craftjs/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VideoUploader } from "./video-uploader"
import { VideoList } from "./video-list"
import { ImageUploader } from "./image-uploader"
import { ImageList } from "./image-list"

interface Video {
  filename: string
  thumbnailUrl: string
}

interface Image {
  filename: string
  imageUrl: string
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

async function fetchUserImages(userId: string): Promise<Image[]> {
  const response = await fetch(`/api/get-user-images?userId=${userId}`)
  const data = await response.json()
  return data.success ? data.images : []
}

async function removeImage(userId: string, filename: string): Promise<boolean> {
  const response = await fetch(`/api/remove-image?userId=${userId}&filename=${filename}`, {
    method: "DELETE",
  })
  const data = await response.json()
  return data.success
}

interface SidebarProps {
  isVideoSectionVisible: boolean
  isImageSectionVisible: boolean
}

export function Sidebar({ isVideoSectionVisible: initialVideoVisible, isImageSectionVisible: initialImageVisible }: SidebarProps) {
  const [activeSection, setActiveSection] = useState<'video' | 'image' | null>(() => {
    if (initialVideoVisible) return 'video'
    if (initialImageVisible) return 'image'
    return null
  })

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
  const [images, setImages] = useState<Image[]>([])
  const [imageLink, setImageLink] = useState("")
  const userId = "test" // Replace this with actual user ID when you implement authentication

  useEffect(() => {
    if (activeSection === 'video') {
      fetchUserVideos(userId).then(setVideos)
    }
    if (activeSection === 'image') {
      fetchUserImages(userId).then(setImages)
    }
  }, [activeSection])

  useEffect(() => {
    if (initialVideoVisible) setActiveSection('video')
    else if (initialImageVisible) setActiveSection('image')
    else setActiveSection(null)
  }, [initialVideoVisible, initialImageVisible])

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

  const handleVideoLinkUpload = () => {
    if (videoLink) {
      setVideos((prevVideos) => [...prevVideos, { filename: videoLink, thumbnailUrl: "/placeholder-thumbnail.jpg" }])
      setVideoLink("")
    }
  }

  const handleImageUpload = (filename: string, imageUrl: string) => {
    setImages((prevImages) => [...prevImages, { filename, imageUrl }])
  }

  const handleImageRemove = async (filename: string) => {
    const success = await removeImage(userId, filename)
    if (success) {
      setImages((prevImages) => prevImages.filter((image) => image.filename !== filename))
    } else {
      console.error("Failed to remove image")
    }
  }

  const handleImageLinkUpload = () => {
    if (imageLink) {
      setImages((prevImages) => [...prevImages, { filename: imageLink, imageUrl: imageLink }])
      setImageLink("")
    }
  }

  if (!activeSection && !selected) {
    return <div className="w-80 bg-white border-l border-gray-200 overflow-auto" />
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-auto">
      {activeSection === 'video' && (
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
            <Button onClick={handleVideoLinkUpload} className="mt-2">
              Add Video Link
            </Button>
          </div>
          <VideoList videos={videos} onRemove={handleVideoRemove} />
        </div>
      )}
      {activeSection === 'image' && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Image Library</h2>
          <ImageUploader onUpload={handleImageUpload} userId={userId} />
          <div className="mt-4">
            <Input
              type="text"
              placeholder="Enter image URL"
              value={imageLink}
              onChange={(e) => setImageLink(e.target.value)}
            />
            <Button onClick={handleImageLinkUpload} className="mt-2">
              Add Image Link
            </Button>
          </div>
          <ImageList images={images} onRemove={handleImageRemove} />
        </div>
      )}
      {selected && selected.name === "Video" && (
        <div className="p-4 border-t">
          <h2 className="text-lg font-semibold mb-4">Video Settings</h2>
          {selected.settings && React.createElement(selected.settings)}
        </div>
      )}
      {selected && selected.name === "Image" && (
        <div className="p-4 border-t">
          <h2 className="text-lg font-semibold mb-4">Image Settings</h2>
          {selected.settings && React.createElement(selected.settings)}
        </div>
      )}
    </div>
  )
}