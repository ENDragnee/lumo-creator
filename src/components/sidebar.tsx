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
            isOpen={isNewSidebarOpen}
            setIsOpen={setIsNewSidebarOpen} // Allow NewSidebar to control its state
            isMobile={isMobileView}
            onContentSelect={handleContentSelectionFromNewSidebar} // Pass the handler
        />
    );
  };

  // Updated renderSidebarContent function
  const renderSidebarContent = () => {
    // Prioritize activeTool first
    if (activeTool) {
      switch (activeTool) {
        case "video":
          return (
            <div className="p-4 h-full overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">Video Library</h2>
              <VideoUploader onUpload={handleVideoUpload} userId={userId} />
              <div className="mt-4">
                <Input
                  type="text"
                  placeholder="Enter video URL"
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  className="h-9"
                />
                <Button onClick={handleVideoLinkUpload} className="mt-2 w-full h-9">
                  Add Video Link
                </Button>
              </div>
              <VideoList videos={videos} onRemove={handleVideoRemove} />
            </div>
          );
        case "image":
          return (
            <div className="p-4 h-full overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">Image Library</h2>
              <ImageUploader onUpload={handleImageUpload} userId={userId} />
               {/* Image Link Upload - Added for consistency */}
               <div className="mt-4">
                <Input
                    type="text"
                    placeholder="Enter image URL"
                    value={imageLink}
                    onChange={(e) => setImageLink(e.target.value)}
                    className="h-9"
                />
                <Button onClick={handleImageLinkUpload} className="mt-2 w-full h-9">
                    Add Image Link
                </Button>
               </div>
              <ImageList images={images} onRemove={handleImageRemove} />
            </div>
          );
        case "simulation":
          return (
            <div className="p-4 h-full overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">Simulation Library</h2>
              <div className="mt-4">
                <Input
                  type="text"
                  placeholder="Enter simulation URL"
                  value={simulationLink}
                  onChange={(e) => setSimulationLink(e.target.value)}
                   className="h-9"
                />
                <Button onClick={handleSimulationLinkUpload} className="mt-2 w-full h-9">
                  Add Simulation Link
                </Button>
              </div>
              <SimulationList
                simulations={simulations}
                onRemove={handleSimulationRemove}
              />
            </div>
          );
        // If activeTool is set but not matched, fall through to default or show error
        default:
           console.warn("Unknown activeTool:", activeTool);
           return renderDefaultSidebar(); // Fallback to NewSidebar
      }
    } else if (selected && selected.settings) {
      // Show component settings ONLY if no tool is active AND a component with settings is selected
      return (
        <div className="p-4 h-full overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">{selected.name} Settings</h2>
          {/* Render the settings component provided by the selected Craft.js node */}
          {React.createElement(selected.settings)}
        </div>
      );
    } else {
      // Default view: Render NewSidebar when neither tool nor component settings are active
      return renderDefaultSidebar();
    }
  };

  // Main return statement - Renders the container and the dynamic content
  return (
    // Adjust the container if NewSidebar handles its own width/styling differently
    // The original 'w-80' might conflict if NewSidebar expects to control its width fully.
    // Let's assume NewSidebar fits within this container for now.
    // The `NewSidebar` uses `fixed` positioning, so it will overlay or position itself
    // relative to the viewport, not necessarily *inside* this div unless styled differently.
    // We might need to remove the width/border from this div and let NewSidebar handle it.
    // Let's try removing the fixed width and let NewSidebar manage itself.
     <div className="h-full relative"> {/* Changed: Removed fixed width, added relative positioning if needed */}
         {/* Render the determined content based on state */}
         {renderSidebarContent()}
     </div>
  );
}