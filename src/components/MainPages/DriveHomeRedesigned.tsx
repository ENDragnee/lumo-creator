// compoents/MainPages/DriveHomeRedesigned.tsx (or your main page component)
"use client";

import { useSession, signOut } from "next-auth/react";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    // ... other icons
    Home, Trash2, Folder, FileText, ThumbsUp, PanelLeftClose, PanelRightOpen, Edit, MoreVertical, Plus, ChevronRight, Paperclip, Calendar, Search, FolderKanban, Undo, Loader2 // Added Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
// ... other imports
import { useRouter } from "next/navigation";
import Image from "next/image";
import { EditItemModal } from "@/components/Modals/EditItemModal";
import { ThemeToggle } from "@/components/theme-toggle";
import { ContentModal } from "@/components/Modals/ContentModal";
import { BookModal } from "@/components/Modals/BookModal";
import {
    DropdownMenuContent, DropdownMenuItem, DropdownMenu, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
// Import the simplified DeleteItemModal (only for trashing now)
import { DeleteItemModal } from "@/components/Modals/DeleteItemModal";
import { TrashPage } from "@/components/TrashPage"; // Import the TrashPage

// Interfaces matching your API response for the main drive view
interface DriveItem {
    _id: string;
    type: "book" | "content";
    title: string;
    thumbnail: string;
    parentId: string | null;
    updatedAt: string; // Keep as string from API
    createdAt: string; // Keep as string from API
    data?: string; // Only for content
    // description?: string; // Add if needed based on your GET API selection
    // tags?: string[]; // Add if needed
    // genre?: string; // Add if needed
}
interface Breadcrumb {
    _id: string;
    title: string;
}

// --- Constants ---
// const filterLabels = ["Label", "Docs", "Sheets", "Slides", "Forms", "Drawings", "Other"]; // Keep if needed
const alphabetIndex = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const FEATURED_ITEM_COUNT = 7;

// --- Main Component ---
export default function DriveHomeRedesigned() {
    const { data: session } = useSession();
    const router = useRouter();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // --- State ---
    const [items, setItems] = useState<DriveItem[]>([]);
    const [featuredItems, setFeaturedItems] = useState<DriveItem[]>([]);
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ _id: 'root', title: 'Home' }]);
    const [loading, setLoading] = useState(true); // Loading state for home view items
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<DriveItem | null>(null);
    const [showContentModal, setShowContentModal] = useState(false);
    const [showBookModal, setShowBookModal] = useState(false);
    // const [activeFilter, setActiveFilter] = useState<string>(filterLabels[0]); // Keep if using filters
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isTrashModalOpen, setIsTrashModalOpen] = useState(false); // Renamed modal state
    const [itemToTrash, setItemToTrash] = useState<DriveItem | null>(null); // Renamed item state
    const [isTrashing, setIsTrashing] = useState(false); // Renamed processing state

    const [activeView, setActiveView] = useState<'home' | 'trash'>('home');
    const [homeError, setHomeError] = useState<string | null>(null); // Error specific to home view fetching

    // --- Sidebar Config ---
    const sidebarNavItems = [
        { label: "Home", icon: Home },
        { label: "Trash", icon: Trash2 }, // onClick handled by handleSidebarNavClick
    ];

    // --- Data Fetching for Home View ---
    const fetchItems = useCallback(async (parentId: string | null) => {
        if (activeView !== 'home' || !session?.user?.id) return; // Only fetch for home view

        setLoading(true);
        setHomeError(null);
        if (parentId !== null) {
            setFeaturedItems([]); // Clear featured when navigating into folders
        }
        console.log(`Fetching home items for parentId: ${parentId ?? 'root'}`);
        try {
            const parentQuery = parentId === null ? 'null' : parentId;
            // GET /api/drive already filters isTrash: false
            const res = await fetch(`/api/drive?parentId=${parentQuery}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            const fetchedItems = (data.items || []) as DriveItem[]; // Cast to DriveItem
            setItems(fetchedItems);
            setBreadcrumbs(data.breadcrumbs || [{ _id: 'root', title: 'Home' }]);

            // Populate featured items only for root
            if (parentId === null && fetchedItems.length > 0) {
                const sortedItems = [...fetchedItems].sort((a, b) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
                setFeaturedItems(sortedItems.slice(0, FEATURED_ITEM_COUNT));
            } else if (parentId !== null) {
                setFeaturedItems([]);
            }

        } catch (error: any) {
            console.error("Failed to fetch drive items:", error);
            setHomeError(error.message || "Failed to load items.");
            setItems([]);
            setFeaturedItems([]);
            setBreadcrumbs([{ _id: 'root', title: 'Home' }]);
            if (error.message.includes('Invalid folder ID') || error.message.includes('Invalid ID format')) {
                 console.warn("Invalid folder ID detected, navigating to root.");
                 setCurrentParentId(null); // Go back to root on invalid ID
            }
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id, activeView]);

    useEffect(() => {
        if (activeView === 'home') {
            fetchItems(currentParentId);
        } else {
             // Optionally clear home states when switching away
             setItems([]);
             setFeaturedItems([]);
             setBreadcrumbs([{ _id: 'root', title: 'Home' }]);
             setLoading(false); // Ensure loading is false if switching away quickly
             setHomeError(null);
        }
    }, [currentParentId, fetchItems, activeView]);

    // --- Event Handlers ---
    const handleItemClick = (item: DriveItem) => {
         if (activeView !== 'home') return;
        if (item.type === "book") {
            setCurrentParentId(item._id);
        } else {
            // Maybe open content preview modal or navigate to editor
             router.push(`/create?contentId=${item._id}`); // Example navigation
        }
    };

    const handleBreadcrumbClick = (breadcrumbId: string) => {
        if (activeView !== 'home') return;
        setCurrentParentId(breadcrumbId === 'root' ? null : breadcrumbId);
    };

    const handleSidebarNavClick = (label: string) => {
        if (label === "Home") {
            setActiveView('home');
            setCurrentParentId(null); // Reset to root when clicking Home nav
        } else if (label === "Trash") {
            setActiveView('trash');
        }
    };

    const handleIndexClick = (char: string) => {
       // ... (index click logic remains the same, but ensure it only works/visible in home view)
       if (activeView !== 'home' || !scrollContainerRef.current || items.length === 0) return;
        const targetChar = char === '#' ? null : char.toLowerCase();
        let firstMatchIndex = -1;

        if (targetChar === null) {
             firstMatchIndex = 0;
        } else {
            firstMatchIndex = items.findIndex(item =>
                item.title.toLowerCase().startsWith(targetChar)
            );
        }


        if (firstMatchIndex !== -1) {
            const listItem = scrollContainerRef.current.querySelector(`li:nth-child(${firstMatchIndex + 1})`) as HTMLLIElement;

            if (listItem) {
                 const offsetTop = listItem.offsetTop - (scrollContainerRef.current.offsetTop || 0);
                 scrollContainerRef.current.scrollTo({
                     top: offsetTop,
                     behavior: 'smooth'
                 });
            } else {
                console.warn("Could not find list item element for index:", firstMatchIndex);
                if (targetChar === null) {
                    scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        } else if (targetChar === null) {
             scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
             console.log(`No items found starting with '${char}'`);
        }
    };

    const handleEditItem = (item: DriveItem) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    const handleSaveItem = async (id: string, type: "book" | "content", data: any) => {
        // Calls PUT /api/drive
        // ... (implementation remains largely the same)
         console.log("Saving item:", id, type, data);
         // Consider adding a loading indicator specifically for saving
         // setLoading(true); // Maybe use a different loading state?
        try {
            const response = await fetch(`/api/drive`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, type, data: { ...data, updatedAt: new Date() } }), // Send updated data, ensure updatedAt if needed
            });
            if (response.ok) {
                setIsEditModalOpen(false);
                 if (activeView === 'home') {
                     await fetchItems(currentParentId); // Refetch list
                 }
            } else {
                const errorData = await response.json();
                console.error("Failed to update item:", errorData.error || errorData.details);
                alert(`Failed to update: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error updating item:", error);
            alert(`Error updating item: ${error}`);
        } finally {
            // setLoading(false); // Corresponding loading state update
            setSelectedItem(null);
        }
    };

    const handleOpenTrashModal = (item: DriveItem) => {
        setItemToTrash(item);
        setIsTrashModalOpen(true);
    };

    // This function now only MOVES TO TRASH using DELETE /api/drive
    const handleTrashItemConfirm = async (item: DriveItem) => {
        if (!item) return;
        setIsTrashing(true);
        setHomeError(null);
        console.log("Trashing item:", item._id);
        try {
            // Call DELETE /api/drive (which now only trashes)
            const response = await fetch(`/api/drive`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item._id, type: item.type }), // No 'mode' needed anymore
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            console.log("Item moved to trash successfully");
            // Optimistic UI Update (only if in home view)
            if (activeView === 'home') {
                setItems(prev => prev.filter(i => i._id !== item._id));
                setFeaturedItems(prev => prev.filter(fi => fi._id !== item._id));
            }
            setIsTrashModalOpen(false); // Close modal on success
            // Add success notification if desired
        } catch (error: any) {
            console.error("Failed to trash item:", error);
            // Display error to user (e.g., using a toast notification or state)
            setHomeError(`Failed to move "${item.title}" to trash: ${error.message || 'Unknown error'}`);
            setIsTrashModalOpen(false); // Close modal even on error? Or keep open? Decide UX.
        } finally {
            setIsTrashing(false);
            setItemToTrash(null);
        }
    };


     const handleCreateNewItem = async (data: { type: 'book' | 'content'; title: string; thumbnail?: string; data?: string; institution:string; subject:string; tags:string[] }) => {
       setHomeError(null);
        console.log("Creating new item:", data);
        try {
            const response = await fetch("/api/drive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Ensure createdBy and isTrash: false are handled by backend POST
                body: JSON.stringify({ ...data, parentId: currentParentId }),
            });
            if (response.ok) {
                setShowContentModal(false);
                setShowBookModal(false);
                 if (activeView === 'home') {
                     await fetchItems(currentParentId); // Refetch
                 }
                 // Add success notification if desired
            } else {
                const errorData = await response.json();
                console.error("Failed to create item:", errorData.error || errorData.details);
                 setHomeError(`Failed to create: ${errorData.error || 'Unknown error'}`);
                 // Close modals even on error?
                 // setShowContentModal(false);
                 // setShowBookModal(false);
            }
        } catch (error:any) {
            console.error("Error creating item:", error);
             setHomeError(`Error creating item: ${error.message}`);
        } finally {
            // setLoading(false); // Reset loading state
        }
    };


    // --- UI Sub-Components ---

    // Sidebar (Adjusted active state logic)
    const Sidebar = () => (
        <aside /* ... sidebar structure ... */
         className={`h-screen bg-gray-100 dark:bg-slate-800 p-3 flex flex-col border-r border-gray-200 dark:border-slate-700 transition-all duration-300 ease-in-out ${
                isSidebarCollapsed ? "w-20 items-center" : "w-60"
            }`} >
             <Button /* ... toggle button ... */
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`self-end mb-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md ${isSidebarCollapsed ? 'mx-auto' : ''}`}
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isSidebarCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                     <Button /* ... new item button ... */
                       className={`justify-center shadow-md rounded-2xl py-3 mb-4 ${
                           isSidebarCollapsed ? "w-12 h-12 p-0 text-lg" : "w-32 self-center text-lg"
                       } bg-pink-100 hover:bg-pink-200 dark:bg-pink-500 dark:hover:bg-pink-600 text-pink-700 dark:text-white hover:scale-105 transition-transform`}
                       title="New Item" aria-label="Create New Item"
                   >
                        <Plus className={`h-6 w-6 ${!isSidebarCollapsed ? 'mr-2' : ''}`} />
                        {!isSidebarCollapsed && "New"}
                    </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent /* ... new item options ... */ align={isSidebarCollapsed ? "end" : "center"} className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 shadow-lg rounded-lg">
                     <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer p-2 dark:text-gray-200 text-sm" onClick={() => setShowContentModal(true)}>
                         New Content
                     </DropdownMenuItem>
                     <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer p-2 dark:text-gray-200 text-sm" onClick={() => setShowBookModal(true)}>
                         New Book (Folder)
                     </DropdownMenuItem>
                 </DropdownMenuContent>
            </DropdownMenu>

            <nav className="flex flex-col gap-1 flex-grow">
                {sidebarNavItems.map((item) => {
                    const Icon = item.icon;
                    // Active state based on activeView
                    const isActive = (item.label === "Home" && activeView === 'home') ||
                                     (item.label === "Trash" && activeView === 'trash');
                    return (
                        <Button
                            key={item.label}
                            variant={isActive ? "secondary" : "ghost"}
                            className={`w-full gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md py-2 px-3 text-sm font-normal ${
                                isSidebarCollapsed ? "justify-center h-12" : "justify-start h-10"
                            } ${isActive ? 'bg-gray-200 dark:bg-slate-700 font-medium' : ''}`}
                             onClick={() => handleSidebarNavClick(item.label)} // Use handler
                            title={item.label} aria-label={item.label}
                        >
                            <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`} />
                            {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </Button>
                    );
                })}
            </nav>
            <div /* ... profile/theme toggle section ... */ className={`mt-auto flex flex-col gap-2 ${isSidebarCollapsed ? 'items-center' : 'items-stretch'}`}>
                 <div className={`${isSidebarCollapsed ? 'w-full flex justify-center' : ''}`}>
                     <ThemeToggle />
                 </div>
                 {session?.user && !isSidebarCollapsed && (
                     <div className="text-center text-xs text-gray-500 dark:text-gray-400 border-t dark:border-slate-700 pt-2 mt-2">
                        {session.user.image && (
                           <Image src={session.user.image} alt="Profile" width={24} height={24} className="rounded-full mx-auto mb-1"/>
                        )}
                         <p className="font-medium truncate" title={session.user.name || ""}>{session.user.name}</p>
                         <p className="truncate" title={session.user.email || ""}>{session.user.email}</p>
                         <Button variant="link" size="sm" className="text-xs h-auto p-0 mt-1" onClick={() => signOut({ callbackUrl: "/" })}>
                            Sign Out
                         </Button>
                     </div>
                 )}
                 {isSidebarCollapsed && session?.user?.image && (
                     <Image src={session.user.image} alt="Profile" width={32} height={32} className="rounded-full mt-2 cursor-pointer" title={`${session.user.name}\n${session.user.email}`}/>
                 )}
            </div>
        </aside>
    );

    // Right Index Bar (Only for Home view)
    const RightIndexBar = () => (
         <div className={`w-8 flex-shrink-0 h-screen sticky top-0 flex-col items-center justify-center text-xs text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-slate-700 py-4 px-1 ${items.length === 0 ? 'hidden' : 'flex'}`}>
            {alphabetIndex.map((char) => (
                <button /* ... index buttons ... */
                   key={char}
                   className="py-0.5 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                   onClick={() => handleIndexClick(char)}
                   aria-label={`Scroll to items starting with ${char}`}
                 >
                    {char}
                </button>
            ))}
        </div>
    );

    // Main Header (Only for Home view)
    const MainHeader = () => (
         <header /* ... header structure ... */ className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
            <div /* ... breadcrumbs ... */ className="flex items-center gap-1 sm:gap-2 overflow-hidden">
                 {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb._id}>
                         {index > 0 && (
                            <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        )}
                        <Button
                            variant="ghost" size="sm"
                            className={`px-1 sm:px-2 h-8 text-base sm:text-lg font-medium truncate ${
                                index === breadcrumbs.length - 1
                                    ? "text-gray-800 dark:text-gray-200 cursor-default"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                            onClick={() => index < breadcrumbs.length - 1 && handleBreadcrumbClick(crumb._id)}
                            disabled={index === breadcrumbs.length - 1}
                            title={crumb.title}
                        >
                           <span className="truncate">{crumb.title}</span>
                        </Button>
                    </React.Fragment>
                ))}
            </div>
            <div /* ... header actions ... */ className="flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700" title="Attach"> <Paperclip className="h-5 w-5" /> </Button>
                <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700" title="Calendar"> <Calendar className="h-5 w-5" /> </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700" title="More Actions">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                     <DropdownMenuContent /* ... action items ... */ align="end" className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 shadow-lg rounded-lg">
                         <DropdownMenuItem className="dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-sm">Action 1</DropdownMenuItem>
                         <DropdownMenuItem className="dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-sm">Action 2</DropdownMenuItem>
                     </DropdownMenuContent>
                </DropdownMenu>
             </div>
        </header>
    );

    // Featured Section (Only for Home root view)
    const FeaturedSection = ({ items: featured, onItemClick }: { items: DriveItem[], onItemClick: (item: DriveItem) => void }) => (
        <div /* ... featured structure ... */ className="px-4 sm:px-6 pt-4 pb-2 flex-shrink-0 border-b border-gray-200 dark:border-slate-700">
            <h2 /* ... featured title ... */ className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" /> Featured
            </h2>
             {/* Loading/Empty states */ }
             {loading && currentParentId === null && ( // Show skeleton only when loading root
                 <div className="flex gap-3 overflow-hidden pb-2">
                     {[...Array(4)].map((_, i) => (
                         <Skeleton key={i} className="rounded-lg w-48 h-32 flex-shrink-0" />
                     ))}
                 </div>
             )}
            {!loading && featured.length === 0 && currentParentId === null && (
                 <p className="text-xs text-gray-500 dark:text-gray-400">No featured items found.</p>
            )}
            {/* Items */}
            {!loading && featured.length > 0 && (
                <div className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent pb-2">
                    {featured.map((item) => (
                        <div /* ... featured item card ... */
                            key={item._id}
                            className="bg-gray-100 dark:bg-slate-800 rounded-lg w-48 h-32 p-3 flex flex-col justify-between flex-shrink-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-blue-300 dark:hover:border-blue-700"
                            onClick={() => onItemClick(item)}
                            title={item.title} role="button" tabIndex={0}
                        >
                             <div className="flex items-center gap-2 mb-2">
                                <div className="flex-shrink-0 w-6 h-6 bg-gray-200 dark:bg-slate-700 rounded flex items-center justify-center overflow-hidden">
                                     {item.thumbnail && !item.thumbnail.includes('/placeholder-') ? (
                                        <Image src={item.thumbnail.startsWith('http') ? item.thumbnail : `${process.env.NEXT_PUBLIC_CREATOR_URL || ''}${item.thumbnail}`} alt="" width={16} height={16} className="object-contain w-4 h-4" />
                                    ) : (
                                        item.type === 'book'
                                            ? <Folder className="w-4 h-4 text-blue-500 dark:text-blue-400"/>
                                            : <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400"/>
                                    )}
                                </div>
                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate flex-1">{item.title}</p>
                            </div>
                             <div className="flex-grow flex items-center justify-center text-gray-400 dark:text-gray-600"></div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                {item.type === 'book' ? 'Book' : 'Content'}
                            </p>
                        </div>
                    ))}
                </div>
             )}
        </div>
    );

    // Item List (Only for Home view)
    const ItemList = () => (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent px-4 sm:px-6 pb-6 pt-4">
            {/* Loading Skeleton */}
            {loading && (
                 <ul className="space-y-2">
                    {[...Array(7)].map((_, i) => (
                        <li key={i} className="flex items-center p-2 space-x-3">
                            <Skeleton className="h-10 w-10 rounded" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-3/4 rounded" />
                                <Skeleton className="h-3 w-1/2 rounded" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                        </li>
                    ))}
                </ul>
            )}

            {/* Error Message */}
            {!loading && homeError && (
                 <div className="text-center py-16 text-red-600 dark:text-red-400">
                     <p className="font-medium">Could not load items.</p>
                     <p className="text-sm mt-1">{homeError}</p>
                     <Button onClick={() => fetchItems(currentParentId)} variant="outline" size="sm" className="mt-4">Retry</Button>
                 </div>
             )}


            {/* No Items Message */}
            {!loading && !homeError && items.length === 0 && (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <FolderKanban className="h-16 w-16 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                    <p className="font-medium">{currentParentId ? "This folder is empty" : "Your drive is empty"}</p>
                    <p className="text-sm mt-1">Use the 'New' button to add Books or Content.</p>
                </div>
            )}

            {/* Item List */}
            {!loading && !homeError && items.length > 0 && (
                <ul className="space-y-1">
                    {items.map((item, index) => (
                        <li key={item._id} data-id={item._id} className="group flex items-center p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors duration-150" >
                             {/* Icon/Thumbnail */}
                            <div className="flex-shrink-0 w-10 h-10 mr-3 bg-gray-200 dark:bg-slate-600 rounded flex items-center justify-center overflow-hidden" onClick={() => handleItemClick(item)}>
                                 {item.thumbnail && !item.thumbnail.includes('/placeholder-') ? (
                                    <Image src={item.thumbnail.startsWith('http') ? item.thumbnail : `${process.env.NEXT_PUBLIC_CREATOR_URL || ''}${item.thumbnail}`} alt="" width={24} height={24} className="object-contain w-6 h-6" />
                                ) : (
                                    item.type === 'book'
                                        ? <Folder className="w-5 h-5 text-blue-500 dark:text-blue-400"/>
                                        : <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                                )}
                            </div>
                             {/* Text Content */}
                            <div className="flex-1 min-w-0" onClick={() => handleItemClick(item)}>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={item.title}>{item.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={`Modified: ${new Date(item.updatedAt).toLocaleString()}`}>
                                    {item.type === 'book' ? 'Book' : 'Content'} - Modified: {new Date(item.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                             {/* Actions Dropdown */}
                             <div className="ml-auto opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
                                 <DropdownMenu>
                                     <DropdownMenuTrigger asChild>
                                         <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600">
                                             <MoreVertical className="h-4 w-4" />
                                         </Button>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 shadow-lg rounded-lg text-sm">
                                         <DropdownMenuItem className="dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleEditItem(item); }}>
                                             <Edit className="h-4 w-4" /> Edit
                                         </DropdownMenuItem>
                                         {/* Trigger Trash Modal */}
                                         <DropdownMenuItem className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleOpenTrashModal(item); }}>
                                             <Trash2 className="h-4 w-4" /> Move to Trash
                                         </DropdownMenuItem>
                                     </DropdownMenuContent>
                                 </DropdownMenu>
                             </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    // --- Main JSX Return ---
    return (
        <div className="flex h-screen bg-white dark:bg-slate-900 overflow-hidden text-gray-900 dark:text-gray-200">
            <Sidebar />

            {/* --- Main Content Area (Conditional Rendering) --- */}
            {activeView === 'home' && (
                <div className="flex-1 flex flex-col min-w-0">
                    <MainHeader />
                    {currentParentId === null && (
                        <FeaturedSection items={featuredItems} onItemClick={handleItemClick} />
                    )}
                    {/* Add filters back if needed */}
                    {/* {activeView === 'home' && currentParentId === null && <FilterBar />} */}
                    <ItemList />
                </div>
            )}

            {activeView === 'trash' && (
                <TrashPage /> // Render TrashPage component when view is trash
            )}
            {/* --- End Main Content Area --- */}


             {/* Right Index Bar (Only show in Home view) */}
             {activeView === 'home' && !isSidebarCollapsed && items.length > 0 && <RightIndexBar />}


            {/* --- Modals (remain outside conditional rendering) --- */}
            <EditItemModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                item={selectedItem} // Pass DriveItem type
                onSave={handleSaveItem}
            />
             <ContentModal
                 userId={session?.user?.id || ""} // Pass userId if needed by modal
                 open={showContentModal}
                 onOpenChange={setShowContentModal}
                 onSave={handleCreateNewItem}
             />
             <BookModal
                 open={showBookModal}
                 onOpenChange={setShowBookModal}
                 onSave={handleCreateNewItem}
             />

            {/* Use DeleteItemModal specifically for confirming the "Move to Trash" action */}
            <DeleteItemModal
                  open={isTrashModalOpen}
                  onOpenChange={setIsTrashModalOpen}
                  item={itemToTrash} // Pass DriveItem type
                  onTrash={handleTrashItemConfirm} // Pass the confirmation handler
                  isProcessing={isTrashing}
                  // Explicitly set text for clarity, as this modal ONLY trashes now
                  titleText="Move to Trash?"
                  descriptionText={`Are you sure you want to move "${itemToTrash?.title}" to the trash? ${itemToTrash?.type === 'book' ? 'Contents will also be moved.' : ''} You can restore it later.`}
                  actionButtonText="Move to Trash"
            />
        </div>
    );
}
