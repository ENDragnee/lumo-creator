"use client";

import { useSession, signOut } from "next-auth/react";
import React, { useEffect, useState } from "react";
import {
    Search,
    Plus,
    Star,         // For Starred/Saved + Sidebar placeholders
    Trash2,       // For Trash + Item Deletion
    Database,     // For My Books/Projects + Placeholder Icon
    ChevronDown,  // For Dropdowns
    Share,        // For Item Action
    Download,     // For Item Action
    Edit,         // For Item Action
    Info,         // Keep if used anywhere
    ChevronLeft,  // For Back Button
    ChevronRight, // For Featured Section Link
    Paperclip,    // For Header Action + Placeholder Icon
    Calendar,     // For Header Action
    MoreVertical, // For Dropdowns/Menus
    Home,         // For Sidebar
    FolderKanban, // For Sidebar (Projects)
    SquareStack,  // For Sidebar (Templates)
    Clock,        // For Sidebar (Recent)
    PanelLeftClose, // For Sidebar Toggle
    PanelRightOpen, // For Sidebar Toggle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Keep if search is needed anywhere
import { useRouter } from "next/navigation";
import Image from "next/image";
import { EditItemModal } from "@/components/EditItemModal";
import { ThemeToggle } from "@/components/theme-toggle"; // Keep if needed
import { ContentModal } from "@/components/Modals/ContentModal";
import { BookModal } from "@/components/Modals/BookModal";
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenu,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Interfaces ---
interface DriveItem {
    _id: string;
    type: "book" | "content";
    title: string;
    thumbnail: string;
    modified?: string; // Keep optional
}

interface BookDetails {
    _id: string;
    title: string;
    thumbnail: string;
    contents: DriveItem[];
}

// --- Placeholder Data ---
const filterLabels = ["Label", "Docs", "Sheets", "Slides", "Forms", "Drawings", "Other"];
const featuredCardData = [
    { id: "1", rank: "1st" },
    { id: "2", rank: "2nd" },
    { id: "3", rank: "3rd" },
    { id: "4", rank: "4th" },
    { id: "5", rank: "5th" },
];
const alphabetIndex = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];


// --- Main Component ---
export default function DriveHomeRedesigned() {
    const { data: session } = useSession();
    const [items, setItems] = useState<DriveItem[]>([]);
    const [selectedBook, setSelectedBook] = useState<BookDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<DriveItem | null>(null);
    const [showContentModal, setShowContentModal] = useState(false);
    const [showBookModal, setShowBookModal] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>(filterLabels[0]); // State for selected filter tab
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // State for sidebar collapse
    const [activeNavItem, setActiveNavItem] = useState<string>("Home"); // State to highlight active sidebar item

    // Define the sidebar navigation items
    const sidebarNavItems = [
        { label: "Home", icon: Home, href: "/home" }, // Assumes /home exists
        { label: "Projects", icon: FolderKanban, onClick: () => { setSelectedBook(null); /* setActiveNavItem("Projects"); */ } }, // Navigate to root/project list
        { label: "Templates", icon: SquareStack, onClick: () => console.log("Navigate to Templates") }, // Placeholder
        { label: "Recent", icon: Clock, onClick: () => console.log("Show Recent Items") }, // Placeholder
        { label: "Starred", icon: Star, onClick: () => console.log("Show Starred Items") }, // Placeholder
        { label: "Trash", icon: Trash2, onClick: () => console.log("Navigate to Trash") }, // Placeholder
    ];

    // --- Core Data Fetching & Mutation Logic ---

    const fetchDriveItems = async () => {
        if (selectedBook) return; // Don't fetch all if viewing a specific book
        setLoading(true);
        console.log("Fetching drive items...");
        try {
            const res = await fetch("/api/drive");
            const data = await res.json();
            if (data.error) {
                console.error("API Error fetching items:", data.error);
                setItems([]);
                return;
            }
            const books: DriveItem[] = (data.books || []).map((book: any) => ({
                _id: book._id,
                type: "book",
                title: book.title,
                thumbnail: book.thumbnail || "/placeholder-folder.png", // Fallback image
                modified: book.createdAt ? new Date(book.createdAt).toLocaleDateString() : undefined,
            }));
            console.log("Fetched books:", data);
            const contents: DriveItem[] = (data.contents || []).map((content: any) => ({
                _id: content._id,
                type: "content",
                title: content.title,
                thumbnail: content.thumbnail || "/placeholder-file.png", // Fallback image
                modified: content.createdAt ? new Date(content.createdAt).toLocaleDateString() : undefined,
            }));
            setItems([...books, ...contents]);
        } catch (error) {
            console.error("Failed to fetch drive items:", error);
            setItems([]); // Set empty on error
        } finally {
            setLoading(false);
        }
    };

    const fetchBookDetails = async (bookId: string) => {
        setLoading(true);
        console.log("Fetching book details for:", bookId);
        try {
            const res = await fetch(`/api/drive?bookId=${bookId}`);
            const data = await res.json();
            if (data.error || !data.book) {
                console.error("Error fetching book details:", data.error || 'Book not found');
                setSelectedBook(null);
                setActiveNavItem("Projects"); // Go back to projects view if book fails
                return;
            }
            const bookData = data.book;
            const bookDetails: BookDetails = {
                _id: bookData._id,
                title: bookData.title,
                thumbnail: bookData.thumbnail || "/placeholder-folder.png",
                contents: (bookData.contents || []).map((content: any) => ({
                    _id: content._id,
                    type: "content",
                    title: content.title,
                    thumbnail: content.thumbnail || "/placeholder-file.png",
                    modified: content.createdAt ? new Date(content.createdAt).toLocaleDateString() : undefined,
                })),
            };
            setSelectedBook(bookDetails);
            // Optionally set active nav item here if needed
        } catch (error) {
            console.error("Failed to fetch book details:", error);
            setSelectedBook(null);
            setActiveNavItem("Projects");
        } finally {
            setLoading(false);
        }
    };

    const fetchContentDetails = async (contentId: string) => {
        console.log("Navigating to content:", contentId);
        // Consider adding a loading state here if navigation is slow
        router.push(`/create?contentId=${contentId}`); // Navigate to editor/viewer page
    };

    useEffect(() => {
        // Fetch initial items when component mounts or when navigating back to main view
        if (!selectedBook) {
            fetchDriveItems();
        }
        // Add dependency array for specific data reloading if needed, e.g., [session, selectedBook]
    }, [selectedBook]); // Re-fetch when selectedBook changes (e.g., becomes null)

    const handleItemClick = (item: DriveItem) => {
        if (item.type === "book") {
            fetchBookDetails(item._id);
            // Optionally setActiveNavItem based on viewing a book
        } else {
            fetchContentDetails(item._id);
        }
    };

    const handleEditItem = (item: DriveItem) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    const handleSaveItem = async (id: string, type: "book" | "content", data: any) => {
        console.log("Saving item:", id, type, data);
        // Add optimistic UI update here if desired
        try {
            const response = await fetch(`/api/drive`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, type, data }),
            });

            if (response.ok) {
                setIsEditModalOpen(false); // Close modal on success
                // Refresh data after save
                if (selectedBook && type === 'content' && selectedBook._id) {
                   await fetchBookDetails(selectedBook._id); // Refresh book contents
                } else if (!selectedBook) {
                   await fetchDriveItems(); // Refresh main list if not in book view
                }
                // Optionally refresh if saving a book title while not in book view
                 else if (type === 'book' && !selectedBook) {
                    await fetchDriveItems();
                 }
            } else {
                console.error("Failed to update item, server response:", await response.text());
                // Show error to user
            }
        } catch (error) {
            console.error("Error updating item:", error);
            // Show error to user
        } finally {
            // Revert optimistic update if it failed
        }
    };

    const handleDeleteItem = async (item: DriveItem) => {
        if (confirm(`Are you sure you want to delete "${item.title}"? This action might be permanent.`)) {
            console.log("Deleting item:", item._id, item.type);
             // Add optimistic UI update here if desired
            try {
                const response = await fetch(`/api/drive`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: item._id, type: item.type }),
                });

                if (response.ok) {
                    // Refresh data after delete
                     if (selectedBook && item.type === 'content' && selectedBook._id) {
                       await fetchBookDetails(selectedBook._id); // Refresh book contents
                     } else if (!selectedBook) {
                        await fetchDriveItems(); // Refresh main list
                     }
                     // Handle case where the deleted item *is* the selected book
                      else if (item.type === 'book' && selectedBook && item._id === selectedBook._id) {
                          setSelectedBook(null); // Go back to main view
                          setActiveNavItem("Projects"); // Reset nav item
                          await fetchDriveItems(); // Fetch fresh list
                      }
                } else {
                    console.error("Failed to delete item, server response:", await response.text());
                    // Show error to user
                }
            } catch (error) {
                console.error("Error deleting item:", error);
                 // Show error to user
            } finally {
                 // Revert optimistic update if it failed
            }
        }
    };

    const handleCreateNewItem = async (data: { type: 'book' | 'content'; title: string; /* other fields */ }) => {
        setLoading(true); // Show loading feedback on create button or globally
        console.log("Creating new item:", data);
        try {
            const response = await fetch("/api/drive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (response.ok) {
                const newItem = await response.json();
                console.log("Item created successfully:", newItem);
                setShowContentModal(false); // Close modals on success
                setShowBookModal(false);
                await fetchDriveItems(); // Refresh the main list to show the new item
                // Optionally navigate to the new item or highlight it
            } else {
                console.error("Failed to create item, server response:", await response.text());
                 // Show error in modal or as a toast
            }
        } catch (error) {
            console.error("Error creating item:", error);
            // Show error in modal or as a toast
        } finally {
            setLoading(false);
        }
    };


    // --- UI Sub-Components ---

    const Sidebar = () => (
        <aside
            className={`h-screen bg-gray-100 dark:bg-slate-800 p-3 flex flex-col border-r border-gray-200 dark:border-slate-700 transition-all duration-300 ease-in-out ${
                isSidebarCollapsed ? "w-20 items-center" : "w-60" // Dynamic width
            }`}
        >
            {/* Sidebar Toggle Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`self-end mb-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md ${isSidebarCollapsed ? 'mx-auto' : ''}`} // Center when collapsed
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isSidebarCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>

            {/* New Item Button */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        className={`justify-center shadow-md rounded-2xl py-3 mb-4 ${
                            isSidebarCollapsed
                                ? "w-12 h-12 p-0 text-lg" // Smaller, icon only
                                : "w-32 self-center text-lg" // Original size
                        } bg-pink-100 hover:bg-pink-200 dark:bg-pink-500 dark:hover:bg-pink-600 text-pink-700 dark:text-white hover:scale-105 transition-transform`}
                        title="New Item"
                         aria-label="Create New Item"
                    >
                        <Plus className={`h-6 w-6 ${!isSidebarCollapsed ? 'mr-2' : ''}`} />
                        {!isSidebarCollapsed && "New"}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align={isSidebarCollapsed ? "end" : "center"}
                    className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 shadow-lg rounded-lg"
                 >
                    <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer p-2 dark:text-gray-200 text-sm" onClick={() => setShowContentModal(true)}>
                        New Content
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer p-2 dark:text-gray-200 text-sm" onClick={() => setShowBookModal(true)}>
                        New Book
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Sidebar Navigation */}
            <nav className="flex flex-col gap-1 flex-grow"> {/* flex-grow pushes profile down */}
                {sidebarNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNavItem === item.label && !selectedBook; // Only active if not viewing a book override
                    return (
                        <Button
                            key={item.label}
                            variant={isActive ? "secondary" : "ghost"}
                            className={`w-full gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md py-2 px-3 text-sm font-normal ${ // Reset font weight
                                isSidebarCollapsed ? "justify-center h-12" : "justify-start h-10"
                            } ${isActive ? 'bg-gray-200 dark:bg-slate-700 font-medium' : ''}`}
                            onClick={() => {
                                setActiveNavItem(item.label); // Set active item on click
                                if (item.onClick) item.onClick();
                                else if (item.href) router.push(item.href);
                            }}
                            title={item.label} // Tooltip
                             aria-label={item.label}
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
                     {/* Keep ThemeToggle if you have it */}
                     {/* <ThemeToggle /> */}
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
                 {/* Optional: Show only avatar when collapsed */}
                 {isSidebarCollapsed && session?.user?.image && (
                     <Image src={session.user.image} alt="Profile" width={32} height={32} className="rounded-full mt-2 cursor-pointer" title={`${session.user.name}\n${session.user.email}`}/>
                 )}
            </div>
        </aside>
    );

    const MainHeader = () => (
        <header className="h-16 px-6 flex items-center justify-between border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-4">
                {/* Back Button Logic: Goes back from book view, otherwise maybe does nothing or opens menu */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => selectedBook ? setSelectedBook(null) : console.log("No action / Open menu")}
                    className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                    disabled={!selectedBook} // Disable if not in a book view
                    aria-label={selectedBook ? "Back to Projects" : "Header Action"}
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-medium text-gray-800 dark:text-gray-200 truncate">
                    {selectedBook ? selectedBook.title : activeNavItem} {/* Dynamic Title */}
                </h1>
            </div>
            {/* Header Action Icons */}
            <div className="flex items-center gap-2">
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

    const FilterBar = () => (
        // Hide filter bar if not relevant to the current view (e.g., Trash, Templates)
        <div className="px-6 py-2 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent flex-shrink-0">
            {filterLabels.map((label) => (
                <Button
                    key={label}
                    variant={activeFilter === label ? "secondary" : "ghost"}
                    size="sm"
                    className={`rounded-full px-4 h-8 whitespace-nowrap text-xs ${ // Smaller text
                        activeFilter === label
                        ? 'bg-blue-100 dark:bg-blue-600 text-blue-700 dark:text-white font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => setActiveFilter(label)} // Add logic to filter 'items' based on this later
                >
                    {label}
                </Button>
            ))}
            <div className="flex-grow"></div> {/* Pushes search icon */}
            <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 ml-2" title="Search">
                <Search className="h-5 w-5" />
            </Button>
        </div>
    );

     const FeaturedCards = () => (
        // Hide featured cards if not relevant (e.g., Trash)
        <div className="p-6 flex-shrink-0">
            {/* Optional Title */}
            {/* <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-3">Highlights</h2> */}
            <div className="relative">
                <div className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent pb-4 -mb-4"> {/* Scrollbar padding trick */}
                    {featuredCardData.map((card) => (
                        <div key={card.id} className="bg-gray-200 dark:bg-slate-700 rounded-xl w-60 h-40 p-4 flex flex-col justify-between items-center flex-shrink-0 shadow hover:shadow-lg transition-shadow cursor-pointer"
                             onClick={() => console.log(`Card ${card.id} clicked`)} // Placeholder action
                             title={`Featured Item ${card.rank}`}
                             role="button"
                             tabIndex={0} // Make it focusable
                        >
                            {/* Placeholder Shapes */}
                            <div className="flex gap-4 items-center w-full justify-center flex-grow text-gray-400 dark:text-slate-500">
                                <SquareStack className="w-10 h-10 opacity-50 transform -rotate-12" />
                                <FolderKanban className="w-12 h-12 opacity-50" />
                                <Database className="w-10 h-10 opacity-50 rounded-full transform rotate-12"/>
                            </div>
                            {/* Rank Indicator */}
                            <div className="mt-2 self-end">
                                <span className="bg-gray-400 dark:bg-slate-500 text-white dark:text-gray-900 text-xs font-semibold px-3 py-1 rounded-full">
                                    {card.rank}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Position "Show all" inside the relative container */}
                <Button variant="link" className="absolute right-0 -bottom-1 text-sm text-blue-600 dark:text-blue-400 hover:underline pr-6 h-auto py-0" onClick={() => console.log("Show all featured")}>
                    Show all
                </Button>
            </div>
        </div>
    );

    const FeaturedList = () => (
        <div className="p-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center cursor-pointer" onClick={() => console.log("Featured section clicked")}>
                    Featured
                    <ChevronRight className="h-5 w-5 ml-1 text-gray-500" />
                </h2>
                {/* Optional: Add sorting or other controls here if needed */}
            </div>
            {loading && <p className="text-gray-500 dark:text-gray-400 text-center py-4">Loading items...</p>}
            {!loading && items.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-4">No items found. Try creating a new Book or Content!</p>}
            {!loading && items.length > 0 && (
                <ul className="space-y-1">
                    {items.map((item) => (
                        <li key={item._id} className="group flex items-center p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors duration-150" >
                            {/* Icon/Thumbnail */}
                            <div className="flex-shrink-0 w-10 h-10 mr-3 bg-gray-200 dark:bg-slate-600 rounded flex items-center justify-center overflow-hidden" onClick={() => handleItemClick(item)}>
                                {item.thumbnail && !item.thumbnail.includes('/placeholder-') ? ( // Check for placeholder
                                    <Image src={item.thumbnail} alt="" width={24} height={24} className="object-contain w-6 h-6" />
                                ) : (
                                    item.type === 'book'
                                        ? <FolderKanban className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                                        : <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                                )}
                            </div>
                             {/* Text Content */}
                            <div className="flex-1 min-w-0" onClick={() => handleItemClick(item)}>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={item.title}>{item.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {/* Customize this supporting text as needed */}
                                    {item.type === 'book' ? 'Book' : 'Content'} - Modified: {item.modified || 'N/A'}
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
                                        <DropdownMenuItem className="dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2">
                                            <Share className="h-4 w-4" /> Share
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleDeleteItem(item); }}>
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


    const RightIndexBar = () => (
         // Conditionally render based on view or user preference if needed
         <div className="w-8 flex-shrink-0 h-screen sticky top-0 flex flex-col items-center justify-center text-xs text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-slate-700 py-4 px-1">
            {alphabetIndex.map((char) => (
                <a key={char} href={`#${char}`} className="py-0.5 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={(e) => e.preventDefault() /* Implement scroll logic here */}>
                    {char}
                </a>
            ))}
        </div>
    );

    // --- Main JSX Return ---
    return (
        <div className="flex h-screen bg-white dark:bg-slate-900 overflow-hidden text-gray-900 dark:text-gray-200">
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0"> {/* Crucial for preventing overflow */}
                <MainHeader />

                {/* Conditional Content: Book View vs. Main Nav View */}
                {selectedBook ? (
                     // --- Book Detail View ---
                    <div className="p-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                         {loading && <p className="text-gray-500 dark:text-gray-400 text-center py-4">Loading book contents...</p>}
                         {!loading && selectedBook.contents.length === 0 && (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">This book is empty. Add some content!</p>
                         )}
                         {!loading && selectedBook.contents.length > 0 && (
                             <ul className="space-y-1">
                                 {selectedBook.contents.map((item) => (
                                     // Re-use list item structure from FeaturedList (or simplify)
                                     <li key={item._id} className="group flex items-center p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors duration-150" >
                                          {/* Icon */}
                                         <div className="flex-shrink-0 w-10 h-10 mr-3 bg-gray-200 dark:bg-slate-600 rounded flex items-center justify-center" onClick={() => handleItemClick(item)}>
                                             {item.thumbnail && !item.thumbnail.includes('/placeholder-') ? (
                                                 <Image src={`${process.env.NEXT_PUBLIC_CREATOR_URL}${item.thumbnail}`} alt="" width={24} height={24} className="object-contain w-6 h-6" />
                                             ) : (
                                                 <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400"/>
                                             )}
                                         </div>
                                          {/* Text */}
                                         <div className="flex-1 min-w-0" onClick={() => handleItemClick(item)}>
                                             <p className="text-sm font-medium truncate" title={item.title}>{item.title}</p>
                                             <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                 Content - Modified: {item.modified || 'N/A'}
                                             </p>
                                         </div>
                                          {/* Actions */}
                                         <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                              {/* Simplified actions or same dropdown */}
                                             <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600" title="Edit" onClick={(e) => {e.stopPropagation(); handleEditItem(item);}}><Edit className="h-4 w-4"/></Button>
                                             <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20" title="Delete" onClick={(e) => {e.stopPropagation(); handleDeleteItem(item);}}><Trash2 className="h-4 w-4"/></Button>
                                         </div>
                                     </li>
                                 ))}
                             </ul>
                         )}
                    </div>
                ) : (
                    // --- Main Navigation View ---
                    <>
                        {/* Conditionally show FilterBar/FeaturedCards based on activeNavItem */}
                         { (activeNavItem === "Home" || activeNavItem === "Projects") && <FilterBar /> }
                         { (activeNavItem === "Home" || activeNavItem === "Projects") && <FeaturedCards /> }
                         {/* The FeaturedList can show different content based on activeNavItem */}
                         {/* For simplicity, now it always shows the main items, but could be filtered */}
                         <FeaturedList />
                         {/* Add placeholder content for Templates, Recent, Starred, Trash views */}
                         { (activeNavItem !== "Home" && activeNavItem !== "Projects") && (
                             <div className="p-6 flex-1 text-center text-gray-500 dark:text-gray-400">
                                 Content for "{activeNavItem}" view goes here.
                             </div>
                         )}
                    </>
                )}
            </div>

            {/* Right Index Bar - Hide when sidebar collapsed or in certain views? */}
            { !isSidebarCollapsed && (activeNavItem === "Home" || activeNavItem === "Projects" || selectedBook) && <RightIndexBar />}

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
                onSave={handleCreateNewItem} // Use the unified creator
            />
            <BookModal
                open={showBookModal}
                onOpenChange={setShowBookModal}
                onSave={handleCreateNewItem} // Use the unified creator
            />
        </div>
    );
}
