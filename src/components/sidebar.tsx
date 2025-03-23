import React, { useState, useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoUploader } from "./video-uploader";
import { VideoList } from "./video-list";
import { ImageUploader } from "./image-uploader";
import { ImageList } from "./image-list";
import { SimulationList } from "./simulation-list";
import { useSession } from "next-auth/react";

// Define interfaces
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Video {
  filename: string;
  thumbnailUrl: string;
}

interface Image {
  filename: string;
  imageUrl: string;
}

interface Simulation {
  url: string;
}

interface SidebarProps {
  activeTool: string | null;
}

// API functions (unchanged)
async function fetchUserVideos(userId: string): Promise<Video[]> {
  const response = await fetch(`/api/get-user-videos?userId=${userId}`);
  const data = await response.json();
  return data.success ? data.videos : [];
}

async function removeVideo(userId: string, filename: string): Promise<boolean> {
  const response = await fetch(
    `/api/remove-video?userId=${userId}&filename=${filename}`,
    { method: "DELETE" }
  );
  const data = await response.json();
  return data.success;
}

async function fetchUserImages(userId: string): Promise<Image[]> {
  const response = await fetch(`/api/get-user-images?userId=${userId}`);
  const data = await response.json();
  return data.success ? data.images : [];
}

async function removeImage(userId: string, filename: string): Promise<boolean> {
  const response = await fetch(
    `/api/remove-image?userId=${userId}&filename=${filename}`,
    { method: "DELETE" }
  );
  const data = await response.json();
  return data.success;
}

export function Sidebar({ activeTool }: SidebarProps) {
  const { data: session, status } = useSession();

  const { selected } = useEditor((state, query) => {
    const currentNodeId = query.getEvent("selected").last();
    let selected;
    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings:
          state.nodes[currentNodeId].related &&
          state.nodes[currentNodeId].related.settings,
      };
    }
    return { selected };
  });

  // States
  const [videos, setVideos] = useState<Video[]>([]);
  const [videoLink, setVideoLink] = useState("");
  const [images, setImages] = useState<Image[]>([]);
  const [imageLink, setImageLink] = useState("");
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [simulationLink, setSimulationLink] = useState("");

  const userId = (session?.user as ExtendedUser)?.id || "test";

  useEffect(() => {
    if (activeTool === "video" && userId) {
      fetchUserVideos(userId).then(setVideos);
    }
    if (activeTool === "image" && userId) {
      fetchUserImages(userId).then(setImages);
    }
  }, [activeTool, userId]);

  // Handlers (unchanged)
  const handleVideoUpload = (filename: string, thumbnailUrl: string) => {
    setVideos((prevVideos) => [...prevVideos, { filename, thumbnailUrl }]);
  };

  const handleVideoRemove = async (filename: string) => {
    const success = await removeVideo(userId, filename);
    if (success) {
      setVideos((prevVideos) =>
        prevVideos.filter((video) => video.filename !== filename)
      );
    } else {
      console.error("Failed to remove video and thumbnail");
    }
  };

  const handleVideoLinkUpload = () => {
    if (videoLink) {
      setVideos((prevVideos) => [
        ...prevVideos,
        { filename: videoLink, thumbnailUrl: "/placeholder-thumbnail.jpg" },
      ]);
      setVideoLink("");
    }
  };

  const handleImageUpload = (filename: string, imageUrl: string) => {
    setImages((prevImages) => [...prevImages, { filename, imageUrl }]);
  };

  const handleImageRemove = async (filename: string) => {
    const success = await removeImage(userId, filename);
    if (success) {
      setImages((prevImages) =>
        prevImages.filter((image) => image.filename !== filename)
      );
    } else {
      console.error("Failed to remove image");
    }
  };

  const handleImageLinkUpload = () => {
    if (imageLink) {
      setImages((prevImages) => [
        ...prevImages,
        { filename: imageLink, imageUrl: imageLink },
      ]);
      setImageLink("");
    }
  };

  const handleSimulationLinkUpload = () => {
    if (simulationLink) {
      setSimulations((prev) => [...prev, { url: simulationLink }]);
      setSimulationLink("");
    }
  };

  const handleSimulationRemove = (url: string) => {
    setSimulations((prev) => prev.filter((sim) => sim.url !== url));
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Please sign in to view your media library.</div>;
  }

  const renderDefaultSidebar = () => (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Editor Tools</h2>
      <p className="text-sm text-gray-600 mb-4">
        Select an element on the canvas to edit its properties, or choose a tool
        from the toolbar below to add content.
      </p>
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <h3 className="font-medium text-blue-700">Tips:</h3>
        <ul className="mt-2 text-sm text-blue-600 space-y-2">
          <li>• Click on any element to edit its properties</li>
          <li>• Use the toolbar to add new elements</li>
          <li>• Drag elements to reposition them</li>
        </ul>
      </div>
    </div>
  );

  // Updated renderSidebarContent function
  const renderSidebarContent = () => {
    // Prioritize activeTool first
    if (activeTool) {
      switch (activeTool) {
        case "video":
          return (
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
          );
        case "image":
          return (
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Image Library</h2>
              <ImageUploader onUpload={handleImageUpload} userId={userId} />
              <ImageList images={images} onRemove={handleImageRemove} />
            </div>
          );
        case "simulation":
          return (
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Simulation Library</h2>
              <div className="mt-4">
                <Input
                  type="text"
                  placeholder="Enter simulation URL"
                  value={simulationLink}
                  onChange={(e) => setSimulationLink(e.target.value)}
                />
                <Button onClick={handleSimulationLinkUpload} className="mt-2">
                  Add Simulation Link
                </Button>
              </div>
              <SimulationList
                simulations={simulations}
                onRemove={handleSimulationRemove}
              />
            </div>
          );
        default:
          return renderDefaultSidebar();
      }
    } else if (selected) {
      // Show component settings only if no tool is active
      return (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">{selected.name} Settings</h2>
          {selected.settings && React.createElement(selected.settings)}
        </div>
      );
    } else {
      // Default sidebar when neither tool nor component is active
      return renderDefaultSidebar();
    }
  };

  return (
    <div className="w-80 bg-zinc-50 border-l rounded-lg border-gray-200 overflow-auto">
      {renderSidebarContent()}
    </div>
  );
}