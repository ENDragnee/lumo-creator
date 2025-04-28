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
// Import the NewSidebar component
import NewSidebar from "./sidebar/NewSidebar"; // Adjust path if necessary
import { cn } from "@/lib/utils";

// Define interfaces (unchanged)
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
  // Add a callback prop to handle content selection from NewSidebar
  onContentSelected?: (contentId: string) => void;
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

// Main Sidebar Component Updated
export function Sidebar({ activeTool, onContentSelected }: SidebarProps) {
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

  // States for libraries (unchanged)
  const [videos, setVideos] = useState<Video[]>([]);
  const [videoLink, setVideoLink] = useState("");
  const [images, setImages] = useState<Image[]>([]);
  const [imageLink, setImageLink] = useState("");
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [simulationLink, setSimulationLink] = useState("");

  // States specifically for managing the NewSidebar view
  const [isNewSidebarOpen, setIsNewSidebarOpen] = useState(true); // Control NewSidebar's visibility/state if needed externally
  const [isMobileView, setIsMobileView] = useState(false);

  const userId = (session?.user as ExtendedUser)?.id || "test"; // Use a default or handle appropriately if no session

  // Effect to fetch library data (unchanged)
  useEffect(() => {
    if (activeTool === "video" && userId) {
      fetchUserVideos(userId).then(setVideos);
    }
    if (activeTool === "image" && userId) {
      fetchUserImages(userId).then(setImages);
    }
    // Note: Simulations don't seem to be fetched from an API in the original code
  }, [activeTool, userId]);

  // Effect to detect mobile view for NewSidebar prop
  useEffect(() => {
    const checkMobile = () => {
        // Use a common breakpoint (e.g., 768px for md in Tailwind)
        setIsMobileView(window.innerWidth < 768);
        // If switching to desktop, ensure the sidebar is open by default
        if (window.innerWidth >= 768) {
            setIsNewSidebarOpen(true);
        }
    };
    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Library Handlers (unchanged)
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

  // Handler for when content is selected within NewSidebar
  const handleContentSelectionFromNewSidebar = (contentId: string) => {
    console.log("Content selected in Sidebar:", contentId);
    // Pass the selected contentId up to the parent component if the prop is provided
    if (onContentSelected) {
      onContentSelected(contentId);
    }
    // You might want to close the mobile NewSidebar after selection
    if (isMobileView) {
        setIsNewSidebarOpen(false);
    }
    // Optionally, you could clear the activeTool or selected component state here,
    // but that depends on the desired UX. For now, just log and notify parent.
  };


  // Loading/Auth Status Checks (consider better UX for no session)
  if (status === "loading") {
    return <div className="w-80 p-4">Loading session...</div>;
  }

//   if (!session && status !== "loading") {
//     return <div className="w-80 p-4">Please sign in to use the tools.</div>;
//     // Or potentially show NewSidebar in a read-only/limited state if desired
//   }

  // Render function for the default view (using NewSidebar)
  const renderDefaultSidebar = () => {
    // Ensure NewSidebar receives the necessary props
    // Note: NewSidebar manages its own internal logic for collapse/expand based on isMobile
    return (
        <NewSidebar
            onContentSelect={handleContentSelectionFromNewSidebar} // Pass the handler
        />
    );
  };

  // Render function for specific tool/settings views
  const renderToolOrSettings = () => {
    if (activeTool) {
        let title = "";
        let content = null;
        switch (activeTool) {
            case "video":
                title = "Video Library";
                content = (
                    <>
                        <VideoUploader onUpload={handleVideoUpload} userId={userId} />
                        <div className="mt-4 space-y-2">
                            <Input type="text" placeholder="Enter video URL" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} className="h-9" />
                            <Button onClick={handleVideoLinkUpload} className="w-full h-9"> Add Video Link </Button>
                        </div>
                        <VideoList videos={videos} onRemove={handleVideoRemove} />
                    </>
                );
                break;
            case "image":
                title = "Image Library";
                content = (
                    <>
                       <ImageUploader onUpload={handleImageUpload} userId={userId} />
                       <div className="mt-4 space-y-2">
                         <Input type="text" placeholder="Enter image URL" value={imageLink} onChange={(e) => setImageLink(e.target.value)} className="h-9"/>
                         <Button onClick={handleImageLinkUpload} className="w-full h-9"> Add Image Link </Button>
                       </div>
                       <ImageList images={images} onRemove={handleImageRemove} />
                    </>
                );
                break;
            case "simulation":
               title = "Simulation Library";
               content = (
                   <>
                      <div className="mt-4 space-y-2">
                          <Input type="text" placeholder="Enter simulation URL" value={simulationLink} onChange={(e) => setSimulationLink(e.target.value)} className="h-9"/>
                          <Button onClick={handleSimulationLinkUpload} className="w-full h-9"> Add Simulation Link </Button>
                      </div>
                      <SimulationList simulations={simulations} onRemove={handleSimulationRemove} />
                   </>
               );
                break;
            default:
                console.warn("Unknown activeTool:", activeTool);
                return null; // Should not happen if logic is correct
        }
        // Consistent wrapper for Tool views
        return (
            <div className="flex flex-col h-full">
                 <div className="p-4 border-b border-border flex-shrink-0">
                     <h2 className="text-lg font-semibold">{title}</h2>
                 </div>
                 <div className="flex-grow p-4 overflow-y-auto space-y-4">
                     {content}
                 </div>
            </div>
        );

    } else if (selected && selected.settings) {
         // Consistent wrapper for Settings view
         return (
             <div className="flex flex-col h-full">
                 <div className="p-4 border-b border-border flex-shrink-0">
                     <h2 className="text-lg font-semibold">{selected.name} Settings</h2>
                 </div>
                 <div className="flex-grow p-4 overflow-y-auto">
                     {React.createElement(selected.settings)}
                 </div>
             </div>
         );
    }
    return null; // Neither tool nor settings active
};


// Main return statement - Renders the container and the dynamic content
return (
  // This div is the actual sidebar container in the flex layout
  // It has a fixed width (can be made responsive later) and standard styling
  <div className={cn(
      "flex flex-col h-full bg-background flex-shrink-0 overflow-hidden",
      "w-64", // Default width, can be controlled by parent via `className` or state
      )}>
      {/* Conditionally render NewSidebar or the Tool/Settings panel */}
      {activeTool || (selected && selected.settings)
          ? renderToolOrSettings()
          : renderDefaultSidebar()
      }
  </div>
);
}