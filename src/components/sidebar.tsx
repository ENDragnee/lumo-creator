// components/Sidebar.tsx (or wherever your Sidebar file is)

import React, { useState, useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoUploader } from "./video-uploader"; // Assuming this path is correct
import { VideoList } from "./video-list"; // Assuming this path is correct
import { ImageUploader } from "./image-uploader"; // Assuming this path is correct
import { ImageList } from "./image-list"; // Assuming this path is correct
import { SimulationList } from "./simulation-list"; // Assuming this path is correct
import { useSession } from "next-auth/react";
import NewSidebar from "./sidebar/NewSidebar"; // Adjust path if necessary
import { cn } from "@/lib/utils";
import { TextList } from "@/components/text-list"; // Assuming this is the correct path


// Define interfaces (assuming these are correct)
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Video {
  filename: string;
  thumbnailUrl: string; // Ensure consistent naming if needed
}

interface Image {
  filename: string; // Could be URL or unique identifier
  imageUrl: string;
}

interface Simulation {
  url: string; // Typically the source URL
}

interface SidebarProps {
  activeTool: string | null;
  onContentSelected?: (contentId: string) => void;
}

// API functions (assuming these are correct)
async function fetchUserVideos(userId: string): Promise<Video[]> {
  try {
    const response = await fetch(`/api/get-user-videos?userId=${userId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.success ? data.videos : [];
  } catch (error) {
    console.error("Failed to fetch videos:", error);
    return [];
  }
}

async function removeVideo(userId: string, filename: string): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/remove-video?userId=${userId}&filename=${encodeURIComponent(filename)}`, // Ensure filename is encoded
      { method: "DELETE" }
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Failed to remove video:", error);
    return false;
  }
}

async function fetchUserImages(userId: string): Promise<Image[]> {
   try {
     const response = await fetch(`/api/get-user-images?userId=${userId}`);
     if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
     const data = await response.json();
     return data.success ? data.images : [];
   } catch (error) {
     console.error("Failed to fetch images:", error);
     return [];
   }
}

async function removeImage(userId: string, filename: string): Promise<boolean> {
  try {
      const response = await fetch(
      `/api/remove-image?userId=${userId}&filename=${encodeURIComponent(filename)}`, // Ensure filename is encoded
      { method: "DELETE" }
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.success;
  } catch (error) {
      console.error("Failed to remove image:", error);
      return false;
  }
}

// Main Sidebar Component Updated
export function Sidebar({ activeTool, onContentSelected }: SidebarProps) {
  const { data: session, status } = useSession();

  const { selected } = useEditor((state, query) => {
    const currentNodeId = query.getEvent("selected").last();
    let selectedInfo = null; // Initialize as null
    if (currentNodeId) {
      const node = state.nodes[currentNodeId];
      if (node) { // Check if node exists
        selectedInfo = {
          id: currentNodeId,
          name: node.data.displayName || node.data.name, // Use displayName first, then name
          // settings should hold the actual *Component Type* (the function/class)
          settings: node.related?.settings,
        };
      }
    }
    return { selected: selectedInfo }; // Return the structured info or null
  });

  // States for libraries
  const [videos, setVideos] = useState<Video[]>([]);
  const [videoLink, setVideoLink] = useState("");
  const [images, setImages] = useState<Image[]>([]);
  const [imageLink, setImageLink] = useState("");
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [simulationLink, setSimulationLink] = useState("");

  // States for NewSidebar view management
  const [isNewSidebarOpen, setIsNewSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);

  // Ensure userId is handled safely
  const userId = (session?.user as ExtendedUser | undefined)?.id;

  // Effect to fetch library data
  useEffect(() => {
    // Only fetch if the tool is active AND userId is available
    if (userId) {
        if (activeTool === "video") {
            fetchUserVideos(userId).then(setVideos);
        } else if (activeTool === "image") {
            fetchUserImages(userId).then(setImages);
        }
        // Note: Simulations are added via link only in current setup
    } else {
        // Clear lists if user logs out or userId becomes unavailable
        if (activeTool === "video") setVideos([]);
        if (activeTool === "image") setImages([]);
        if (activeTool === "simulation") setSimulations([]);
    }
  }, [activeTool, userId]); // Depend on userId

  // Effect for mobile view detection (seems okay)
  useEffect(() => {
    const checkMobile = () => {
        const mobile = window.innerWidth < 768;
        setIsMobileView(mobile);
        // if (!mobile) { // Optional: force open on desktop resize
        //     setIsNewSidebarOpen(true);
        // }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Library Handlers (Simplified error handling, assuming API functions handle console errors)
  const handleVideoUpload = (filename: string, thumbnailUrl: string) => {
    setVideos((prev) => [...prev, { filename, thumbnailUrl }]);
  };

  const handleVideoRemove = async (filename: string) => {
    if (!userId) return; // Prevent action if no user
    const success = await removeVideo(userId, filename);
    if (success) {
      setVideos((prev) => prev.filter((v) => v.filename !== filename));
    } // Implicitly handles failure by not removing from state
  };

  const handleVideoLinkUpload = () => {
    if (videoLink.trim()) {
        // Basic validation for common video URLs (optional but recommended)
        if (videoLink.includes('youtube.com') || videoLink.includes('youtu.be') || videoLink.includes('vimeo.com')) {
             setVideos((prev) => [...prev, { filename: videoLink.trim(), thumbnailUrl: "/placeholder-thumbnail.jpg" }]); // Use a placeholder
             setVideoLink("");
        } else {
            alert("Please enter a valid YouTube or Vimeo URL."); // Simple feedback
        }
    }
  };

  const handleImageUpload = (filename: string, imageUrl: string) => {
    setImages((prev) => [...prev, { filename, imageUrl }]);
  };

  const handleImageRemove = async (filename: string) => {
    if (!userId) return;
    const success = await removeImage(userId, filename);
    if (success) {
      setImages((prev) => prev.filter((img) => img.filename !== filename));
    }
  };

  const handleImageLinkUpload = () => {
    if (imageLink.trim()) {
      // Basic check if it looks like a URL (can be improved)
      if (imageLink.startsWith('http://') || imageLink.startsWith('https://')) {
        setImages((prev) => [...prev, { filename: imageLink.trim(), imageUrl: imageLink.trim() }]);
        setImageLink("");
      } else {
          alert("Please enter a valid URL starting with http:// or https://");
      }
    }
  };

  const handleSimulationLinkUpload = () => {
    if (simulationLink.trim()) {
       if (simulationLink.startsWith('http://') || simulationLink.startsWith('https://')) {
            setSimulations((prev) => [...prev, { url: simulationLink.trim() }]);
            setSimulationLink("");
       } else {
           alert("Please enter a valid URL starting with http:// or https://");
       }
    }
  };

  const handleSimulationRemove = (url: string) => {
    setSimulations((prev) => prev.filter((sim) => sim.url !== url));
  };

  // Handler for content selection from NewSidebar (seems okay)
  const handleContentSelectionFromNewSidebar = (contentId: string) => {
    console.log("Content selected in Sidebar:", contentId);
    if (onContentSelected) {
      onContentSelected(contentId);
    }
    // if (isMobileView) { setIsNewSidebarOpen(false); } // Optional: close on mobile
  };


  // Loading/Auth Status Checks
  if (status === "loading") {
    return <div className="w-64 flex-shrink-0 p-4">Loading...</div>;
  }

  // --- Decide what to render ---

  // Prioritize showing settings if a component is selected
  const showSettings = selected && selected.settings;
  // Show tool library only if a tool is active AND no component is selected (or selected component has no settings)
  const showToolLibrary = activeTool && !showSettings;
  // Show default sidebar if neither settings nor tool library should be shown
  const showDefault = !showSettings && !showToolLibrary;

  // Dynamic Content Rendering
  const renderDynamicContent = () => {
    if (showSettings) {
      // Render the Settings Panel
       return (
           <div className="flex flex-col h-full">
               <div className="p-4 flex-shrink-0">
                   {/* Use selected.name which should have displayName */}
                   <h2 className="text-lg font-semibold">{selected.name} Settings</h2>
               </div>
               <div className="flex-grow p-4 overflow-y-auto">
                   {/* Render the specific settings component linked in the node's craft config */}
                   {React.createElement(selected.settings)}
               </div>
           </div>
       );
    }

    if (showToolLibrary) {
        // Render the Tool Library Panel
        let title = "";
        let content = null;
        switch (activeTool) {
            case "video":
                title = "Video Library";
                content = (
                    <>
                        <VideoUploader onUpload={handleVideoUpload} userId={userId || ""} />
                        <div className="mt-4 space-y-2">
                            <Input type="url" placeholder="Enter YouTube/Vimeo URL" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} className="h-9" />
                            <Button onClick={handleVideoLinkUpload} className="w-full h-9 bg-[#3B82F6] hover:bg-blue-600"> Add Video Link </Button>
                        </div>
                        <VideoList videos={videos} onRemove={handleVideoRemove} />
                    </>
                );
                break;
            case "image":
                title = "Image Library";
                content = (
                    <>
                       <ImageUploader onUpload={handleImageUpload} userId={userId || ""} />
                       <div className="mt-4 space-y-2">
                         <Input type="url" placeholder="Enter image URL" value={imageLink} onChange={(e) => setImageLink(e.target.value)} className="h-9"/>
                         <Button onClick={handleImageLinkUpload} className="w-full h-9 bg-[#3B82F6] hover:bg-blue-600"> Add Image Link </Button>
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
                          <Input type="url" placeholder="Enter simulation URL" value={simulationLink} onChange={(e) => setSimulationLink(e.target.value)} className="h-9"/>
                          <Button onClick={handleSimulationLinkUpload} className="w-full h-9 bg-[#3B82F6] hover:bg-blue-600"> Add Simulation Link </Button>
                      </div>
                      <SimulationList simulations={simulations} onRemove={handleSimulationRemove} />
                   </>
               );
                break;
            case "text":
                title = "Text Library";
                content = (
                  <>
                    <TextList />
                  </>
                );
                break;
            // Add cases for other tools if needed
            default:
                return <div className="p-4">Unknown Tool: {activeTool}</div>; // Handle unknown tool case
        }
        return (
            <div className="flex flex-col h-full bg-gray-100 rounded-md">
                 <div className="p-4 flex-shrink-0">
                     <h2 className="text-lg font-semibold">{title}</h2>
                 </div>
                 <div className="flex-grow p-4 overflow-y-auto space-y-4">
                     {content}
                 </div>
            </div>
        );
    }

    // Default: Render NewSidebar
    return (
         <NewSidebar
            onContentSelect={handleContentSelectionFromNewSidebar}
            // Pass other necessary props to NewSidebar if any
        />
    );
  };

  // Main return statement
  return (
    <div className={cn(
        "flex flex-col h-full bg-background mt-2 flex-shrink-0 overflow-hidden", // Use theme colors
        "w-64", // Default width
    )}>
       {/* Render the decided content */}
       {renderDynamicContent()}
    </div>
  );
}