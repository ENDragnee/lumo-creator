"use client";

import { useSession, signOut } from "next-auth/react";
import React, { useEffect, useState, useCallback, useRef } from "react"; // Added useRef
import {
    Search, Plus, Star, Trash2, Database, ChevronDown, Share, Download,
    Edit, Info, ChevronLeft, ChevronRight, Paperclip, Calendar, MoreVertical,
    Home, FolderKanban, SquareStack, Clock, PanelLeftClose, PanelRightOpen, Folder, FileText, ThumbsUp // Added ThumbsUp for Featured
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { DeleteItemModal } from "@/components/Modals/DeleteItemModal"; // Import the new modal

// --- Interfaces ---
interface DriveItem {
    _id: string;
    type: "book" | "content";
    title: string;
    thumbnail: string;
    parentId: string | null;
    updatedAt: string;
    description?: string;
    tags?: string[];
    genre?: string;
}
interface Breadcrumb {
    _id: string;
    title: string;
}

// --- Constants ---
const filterLabels = ["Label", "Docs", "Sheets", "Slides", "Forms", "Drawings", "Other"];
const alphabetIndex = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const FEATURED_ITEM_COUNT = 7;

// --- Main Component ---
export default function DriveHomeRedesigned() {
    const { data: session } = useSession();
    const router = useRouter();
    const scrollContainerRef = useRef<HTMLDivElement>(null); // Ref for the item list scroll area

    // --- State ---
    const [items, setItems] = useState<DriveItem[]>([]);
    const [featuredItems, setFeaturedItems] = useState<DriveItem[]>([]); // State for featured items
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ _id: 'root', title: 'Home' }]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<DriveItem | null>(null);
    const [showContentModal, setShowContentModal] = useState(false);
    const [showBookModal, setShowBookModal] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>(filterLabels[0]);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeNavItem, setActiveNavItem] = useState<string>("Home");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<DriveItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


    // --- Sidebar Config ---
    const sidebarNavItems = [
        { label: "Home", icon: Home },
        { label: "Projects", icon: FolderKanban },
        { label: "Trash", icon: Trash2, onClick: () => console.log("Navigate to Trash (Not Implemented)") },
    ];

    // --- Data Fetching ---
    const fetchItems = useCallback(async (parentId: string | null) => {
        if (!session?.user?.id) return;
        setLoading(true);
        // Clear featured items immediately if not fetching root
        if (parentId !== null) {
            setFeaturedItems([]);
        }
        console.log(`Fetching items for parentId: ${parentId ?? 'root'}`);
        try {
            const parentQuery = parentId === null ? 'null' : parentId;
            const res = await fetch(`/api/drive?parentId=${parentQuery}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            const fetchedItems = data.items || [];
            setItems(fetchedItems);
            setBreadcrumbs(data.breadcrumbs || [{ _id: 'root', title: 'Home' }]);

            // Populate featured items only when viewing root
            if (parentId === null && fetchedItems.length > 0) {
                const sortedItems = [...fetchedItems].sort((a, b) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
                setFeaturedItems(sortedItems.slice(0, FEATURED_ITEM_COUNT));
            } else if (parentId !== null) {
                setFeaturedItems([]); // Ensure it's cleared if navigating away from root
            }

        } catch (error: any) {
            console.error("Failed to fetch drive items:", error);
            setItems([]);
            setFeaturedItems([]); // Clear on error
            setBreadcrumbs([{ _id: 'root', title: 'Home' }]);
            if (error.message.includes('Invalid folder ID')) {
                console.warn("Invalid folder ID detected, navigating to root.");
                setCurrentParentId(null);
            }
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        fetchItems(currentParentId);
    }, [currentParentId, fetchItems]);

    // --- Event Handlers ---
    const handleItemClick = (item: DriveItem) => {
        if (item.type === "book") {
            setCurrentParentId(item._id);
            setActiveNavItem('');
        } else {
            router.push(`/create?contentId=${item._id}`);
        }
    };

    const handleBreadcrumbClick = (breadcrumbId: string) => {
        if (breadcrumbId === 'root') {
            setCurrentParentId(null);
            setActiveNavItem('Home');
        } else {
            setCurrentParentId(breadcrumbId);
            setActiveNavItem('');
        }
    };

    const handleSidebarNavClick = (label: string) => {
        setActiveNavItem(label);
        if (label === "Home" || label === "Projects") {
            setCurrentParentId(null);
        } else if (label === "Trash") {
            console.log("Navigate to Trash View (TODO)");
        }
    };

    const handleIndexClick = (char: string) => {
        if (!scrollContainerRef.current || items.length === 0) return;

        const targetChar = char === '#' ? null : char.toLowerCase();
        let firstMatchIndex = -1;

        if (targetChar === null) {
             // Scroll to top for '#'
             firstMatchIndex = 0;
        } else {
            firstMatchIndex = items.findIndex(item =>
                item.title.toLowerCase().startsWith(targetChar)
            );
        }


        if (firstMatchIndex !== -1) {
            // Find the corresponding DOM element
            // We use the index as a fallback selector mechanism
            const listItem = scrollContainerRef.current.querySelector(`li:nth-child(${firstMatchIndex + 1})`) as HTMLLIElement;

            if (listItem) {
                 // Calculate offset relative to the scroll container
                 const offsetTop = listItem.offsetTop - scrollContainerRef.current.offsetTop; // Adjust if container has padding/border

                 scrollContainerRef.current.scrollTo({
                     top: offsetTop,
                     behavior: 'smooth'
                 });
            } else {
                console.warn("Could not find list item element for index:", firstMatchIndex);
                // Fallback: Scroll to top if '#' or element not found precisely
                if (targetChar === null) {
                    scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        } else if (targetChar === null) {
            // Scroll to top if '#' clicked and list isn't empty but no specific match (shouldn't happen with index 0)
             scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
             console.log(`No items found starting with '${char}'`);
             // Optional: provide feedback or scroll to the bottom/top?
        }
    };

    const handleEditItem = (item: DriveItem) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    const handleSaveItem = async (id: string, type: "book" | "content", data: any) => {
        // ... (implementation unchanged)
        console.log("Saving item:", id, type, data);
        setLoading(true);
        try {
            const response = await fetch(`/api/drive`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, type, data }),
            });
            if (response.ok) {
                setIsEditModalOpen(false);
                await fetchItems(currentParentId);
            } else {
                const errorData = await response.json();
                console.error("Failed to update item:", errorData.error);
                alert(`Failed to update: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error updating item:", error);
            alert(`Error updating item: ${error}`);
        } finally {
            setLoading(false);
            setSelectedItem(null);
        }
    };

    const handleOpenDeleteModal = (item: DriveItem) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const handleTrashItem = async (item: DriveItem) => {
        if (!item) return;
        setIsDeleting(true);
        console.log("Trashing item:", item._id);
        try {
            const response = await fetch(`/api/drive`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item._id, type: item.type, mode: 'trash' }), // Send mode
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            console.log("Item moved to trash successfully");
            // Optimistic UI Update
            setItems(prev => prev.filter(i => i._id !== item._id));
            setFeaturedItems(prev => prev.filter(fi => fi._id !== item._id));
            setIsDeleteModalOpen(false); // Close modal on success
        } catch (error: any) {
            console.error("Failed to trash item:", error);
            alert(`Failed to move to trash: ${error.message || 'Unknown error'}`);
        } finally {
            setIsDeleting(false);
            setItemToDelete(null); // Clear item even on error
        }
    };

    const handlePermanentDeleteItem = async (item: DriveItem) => {
        if (!item) return;
        // Extra confirmation (optional but recommended)
        if (!confirm(`PERMANENTLY DELETE "${item.title}"?\n\nThis action cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        console.log("Permanently deleting item:", item._id);
        // Store original items for potential revert
        const originalItems = [...items];
        const originalFeatured = [...featuredItems];
        // Optimistic UI Update
        setItems(prev => prev.filter(i => i._id !== item._id));
        setFeaturedItems(prev => prev.filter(fi => fi._id !== item._id));

        try {
            const response = await fetch(`/api/drive`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item._id, type: item.type, mode: 'permanent' }), // Send mode
            });
            if (!response.ok) {
                const errorData = await response.json();
                 // Revert optimistic update on failure
                 setItems(originalItems);
                 setFeaturedItems(originalFeatured);
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            console.log("Item permanently deleted successfully");
            setIsDeleteModalOpen(false); // Close modal on success
        } catch (error: any) {
            console.error("Failed to permanently delete item:", error);
             // Ensure UI is reverted if it wasn't already
             setItems(originalItems);
             setFeaturedItems(originalFeatured);
            alert(`Failed to delete: ${error.message || 'Unknown error'}`);
        } finally {
            setIsDeleting(false);
            setItemToDelete(null); // Clear item
        }
    };

    //  const handleDeleteItem = async (item: DriveItem) => {
    //     // ... (implementation unchanged)
    //     if (confirm(`Are you sure you want to delete "${item.title}"? ${item.type === 'book' ? 'Deleting a book might require it to be empty.' : ''}`)) {
    //         console.log("Deleting item:", item._id, item.type);
    //         const originalItems = [...items];
    //         setItems(items.filter(i => i._id !== item._id));
    //         try {
    //             const response = await fetch(`/api/drive`, {
    //                 method: "DELETE",
    //                 headers: { "Content-Type": "application/json" },
    //                 body: JSON.stringify({ id: item._id, type: item.type }),
    //             });
    //             if (!response.ok) {
    //                  const errorData = await response.json();
    //                  console.error("Failed to delete item:", errorData.error);
    //                  alert(`Failed to delete: ${errorData.error || 'Unknown error'}`);
    //                  setItems(originalItems);
    //             } else {
    //                 console.log("Item deleted successfully");
    //                 // If deleting the currently featured item, refetch might be needed to update featured list
    //                 // or simply remove it from featuredItems state as well
    //                 setFeaturedItems(prev => prev.filter(fi => fi._id !== item._id));
    //             }
    //         } catch (error) {
    //             console.error("Error deleting item:", error);
    //             alert(`Error deleting item: ${error}`);
    //             setItems(originalItems);
    //         }
    //     }
    // };

    const handleCreateNewItem = async (data: { type: 'book' | 'content'; title: string; thumbnail?: string; data?: string }) => {
       // ... (implementation unchanged)
       setLoading(true);
        console.log("Creating new item:", data);
        try {
            const response = await fetch("/api/drive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, parentId: currentParentId }),
            });
            if (response.ok) {
                setShowContentModal(false);
                setShowBookModal(false);
                await fetchItems(currentParentId);
            } else {
                const errorData = await response.json();
                console.error("Failed to create item:", errorData.error);
                alert(`Failed to create: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error creating item:", error);
             alert(`Error creating item: ${error}`);
        } finally {
            setLoading(false);
        }
    };


    // --- UI Sub-Components ---

    const Sidebar = () => ( /* ... (Sidebar component unchanged) ... */
        <aside
            className={`h-screen bg-gray-100 dark:bg-slate-800 p-3 flex flex-col border-r border-gray-200 dark:border-slate-700 transition-all duration-300 ease-in-out ${
                isSidebarCollapsed ? "w-20 items-center" : "w-60"
            }`}
        >
            {/* Sidebar Toggle Button */}
             <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`self-end mb-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md ${isSidebarCollapsed ? 'mx-auto' : ''}`}
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isSidebarCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>

             {/* New Item Button */}
             <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                     <Button
                        className={`justify-center shadow-md rounded-2xl py-3 mb-4 ${
                            isSidebarCollapsed ? "w-12 h-12 p-0 text-lg" : "w-32 self-center text-lg"
                        } bg-pink-100 hover:bg-pink-200 dark:bg-pink-500 dark:hover:bg-pink-600 text-pink-700 dark:text-white hover:scale-105 transition-transform`}
                        title="New Item" aria-label="Create New Item"
                    >
                         <Plus className={`h-6 w-6 ${!isSidebarCollapsed ? 'mr-2' : ''}`} />
                         {!isSidebarCollapsed && "New"}
                     </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align={isSidebarCollapsed ? "end" : "center"} className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 shadow-lg rounded-lg">
                     <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer p-2 dark:text-gray-200 text-sm" onClick={() => setShowContentModal(true)}>
                         New Content
                     </DropdownMenuItem>
                     <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer p-2 dark:text-gray-200 text-sm" onClick={() => setShowBookModal(true)}>
                         New Book (Folder)
                     </DropdownMenuItem>
                 </DropdownMenuContent>
             </DropdownMenu>

            {/* Sidebar Navigation */}
            <nav className="flex flex-col gap-1 flex-grow">
                {sidebarNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNavItem === item.label && currentParentId === null;
                    return (
                        <Button
                            key={item.label}
                            variant={isActive ? "secondary" : "ghost"}
                            className={`w-full gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md py-2 px-3 text-sm font-normal ${
                                isSidebarCollapsed ? "justify-center h-12" : "justify-start h-10"
                            } ${isActive ? 'bg-gray-200 dark:bg-slate-700 font-medium' : ''}`}
                            onClick={() => handleSidebarNavClick(item.label)}
                            title={item.label} aria-label={item.label}
                        >
                            <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`} />
                            {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </Button>
                    );
                })}
            </nav>

            {/* Profile/Theme Toggle Section */}
            <div className={`mt-auto flex flex-col gap-2 ${isSidebarCollapsed ? 'items-center' : 'items-stretch'}`}>
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

    const RightIndexBar = () => (
        // Only show if not collapsed and items exist
        <div className={`w-8 flex-shrink-0 h-screen sticky top-0 flex-col items-center justify-center text-xs text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-slate-700 py-4 px-1 ${items.length === 0 ? 'hidden' : 'flex'}`}>
           {alphabetIndex.map((char) => (
               <button // Use button for better semantics if not a true link
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

    const MainHeader = () => ( /* ... (MainHeader component unchanged) ... */
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-hidden">
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb._id}>
                        {index > 0 && (
                            <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
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

            {/* Header Action Icons */}
             <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700" title="Attach"> <Paperclip className="h-5 w-5" /> </Button>
                <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700" title="Calendar"> <Calendar className="h-5 w-5" /> </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700" title="More Actions">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 shadow-lg rounded-lg">
                         <DropdownMenuItem className="dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-sm">Action 1</DropdownMenuItem>
                         <DropdownMenuItem className="dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-sm">Action 2</DropdownMenuItem>
                     </DropdownMenuContent>
                </DropdownMenu>
             </div>
        </header>
    );

    const FilterBar = () => ( /* ... (FilterBar component unchanged) ... */
        <div className="px-6 py-2 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent flex-shrink-0">
             {filterLabels.map((label) => (
                <Button key={label} variant={activeFilter === label ? "secondary" : "ghost"} size="sm"
                    className={`rounded-full px-4 h-8 whitespace-nowrap text-xs ${
                        activeFilter === label ? 'bg-blue-100 dark:bg-blue-600 text-blue-700 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => setActiveFilter(label)} >
                     {label}
                 </Button>
             ))}
             <div className="flex-grow"></div>
             <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 ml-2" title="Search">
                 <Search className="h-5 w-5" />
             </Button>
         </div>
    );

    // --- NEW Featured Section Component ---
    const FeaturedSection = ({ items: featured, onItemClick }: { items: DriveItem[], onItemClick: (item: DriveItem) => void }) => (
        <div className="px-4 sm:px-6 pt-4 pb-2 flex-shrink-0 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" /> Featured
            </h2>
            {featured.length === 0 && !loading && ( // Show only if empty *after* loading
                 <p className="text-xs text-gray-500 dark:text-gray-400">No featured items found.</p>
            )}
             {loading && ( // Show skeletons while loading root items
                 <div className="flex gap-3 overflow-hidden pb-2">
                     {[...Array(4)].map((_, i) => (
                         <Skeleton key={i} className="rounded-lg w-48 h-32 flex-shrink-0" />
                     ))}
                 </div>
             )}
            {!loading && featured.length > 0 && (
                <div className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent pb-2">
                    {featured.map((item) => (
                        <div
                            key={item._id}
                            className="bg-gray-100 dark:bg-slate-800 rounded-lg w-48 h-32 p-3 flex flex-col justify-between flex-shrink-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-blue-300 dark:hover:border-blue-700"
                            onClick={() => onItemClick(item)}
                            title={item.title}
                            role="button"
                            tabIndex={0}
                        >
                            {/* Thumbnail/Icon */}
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
                             {/* Placeholder for content preview or metadata */}
                            <div className="flex-grow flex items-center justify-center text-gray-400 dark:text-gray-600">
                                {/* <p className="text-xs text-center">Preview N/A</p> */}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                {item.type === 'book' ? 'Book' : 'Content'}
                            </p>
                        </div>
                    ))}
                </div>
             )}
        </div>
    );

    // --- Item List Component ---
    const ItemList = () => (
        // Added ref here
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent px-4 sm:px-6 pb-6 pt-4">
            {/* Loading Skeleton */}
            {loading && (
                <ul className="space-y-2">
                    {[...Array(7)].map((_, i) => ( /* Increased skeleton count */
                        <li key={i} className="flex items-center p-2 space-x-3">
                            <Skeleton className="h-10 w-10 rounded" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-3/4 rounded" />
                                <Skeleton className="h-3 w-1/2 rounded" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </li>
                    ))}
                </ul>
            )}

            {/* No Items Message */}
            {!loading && items.length === 0 && (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <FolderKanban className="h-16 w-16 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                    <p className="font-medium">This folder is empty.</p>
                    <p className="text-sm mt-1">Use the 'New' button to add Books or Content.</p>
                </div>
            )}

            {/* Item List */}
            {!loading && items.length > 0 && (
                <ul className="space-y-1">
                    {items.map((item, index) => ( // Added index
                        // Added data-id for potential use, using index for nth-child selector
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
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {item.type === 'book' ? 'Book' : 'Content'} - Modified: {new Date(item.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                             {/* Actions Dropdown */}
                             <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
                                         <DropdownMenuItem className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleOpenDeleteModal(item); }}>
                                             <Trash2 className="h-4 w-4" /> Delete
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

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <MainHeader />

                {/* Conditionally render Featured Section only in root view */}
                {currentParentId === null && (
                    <FeaturedSection items={featuredItems} onItemClick={handleItemClick} />
                )}

                 {/* Conditionally render FilterBar only in root view */}
                 {/* {currentParentId === null && !loading && <FilterBar />} */}

                {/* Display the list of items for the current folder */}
                <ItemList />
            </div>

            {/* Right Index Bar - Show only if not collapsed */}
            {!isSidebarCollapsed && <RightIndexBar />}

            {/* --- Modals --- */}
            <EditItemModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                item={selectedItem}
                onSave={handleSaveItem}
            />
             <ContentModal
                 userId={session?.user?.id || ""}
                 open={showContentModal}
                 onOpenChange={setShowContentModal}
                 onSave={handleCreateNewItem}
             />
             <BookModal
                 open={showBookModal}
                 onOpenChange={setShowBookModal}
                 onSave={handleCreateNewItem}
             />

            <DeleteItemModal
                  open={isDeleteModalOpen}
                  onOpenChange={setIsDeleteModalOpen}
                  item={itemToDelete}
                  onTrash={handleTrashItem}
                  onDelete={handlePermanentDeleteItem}
                  isProcessing={isDeleting}
            />
        </div>
    );
}