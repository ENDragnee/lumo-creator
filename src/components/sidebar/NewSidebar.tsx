// components/navigation/NewSidebar.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, Search, Menu, X, Folder, FileText, Loader2, Home,
    Plus, FolderPlus, MoreVertical, Edit, Trash2 // Added missing icons
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation'; // Use next/navigation
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/theme-toggle'; // Assuming this exists
// Removed Link import as we use button onClick now for content navigation
// import Link from 'next/link';
import { SidebarDriveItem } from '@/app/api/sidebar-items/route'; // Adjust import path

// Import Modals
import { ContentModal } from '@/components/Modals/ContentModal'; // Adjust path
import { BookModal } from '@/components/Modals/BookModal'; // Adjust path
import { EditItemModal } from '@/components/Modals/EditItemModal'; // Adjust path
import { DeleteItemModal } from '@/components/Modals/DeleteItemModal'; // Adjust path
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";


// --- Define SidebarProps ---
interface NewSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
  // --- ADDED: Callback for content selection ---
  onContentSelect: (contentId: string) => void;
}

// --- Define SidebarLevelProps ---
interface SidebarLevelProps {
    parentId: string | null;
    level: number;
    searchQuery: string;
    // --- UPDATED: Signature to accept contentId ---
    onContentClick: (contentId: string) => void;
    // --- ADDED: Action handlers and refetch ---
    onEditItem: (item: SidebarDriveItem) => void;
    onDeleteItem: (item: SidebarDriveItem) => void;
    refetchData: () => void;
}

type ActionItem = SidebarDriveItem | null;


// --- Main Sidebar Component ---
const NewSidebar: React.FC<NewSidebarProps> = ({ isOpen, setIsOpen, isMobile, onContentSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // --- State for Modals & Actions (existing) ---
  const [showContentModal, setShowContentModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ActionItem>(null);
  const [itemToDelete, setItemToDelete] = useState<ActionItem>(null);
  const [currentParentIdForNewItem, setCurrentParentIdForNewItem] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // --- Modal Open Handlers (existing) ---
  const handleEditItemClick = (item: SidebarDriveItem) => {
    setItemToEdit(item);
    setIsEditModalOpen(true);
  };

  const handleDeleteItemClick = (item: SidebarDriveItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  // --- API Call Handlers (existing) ---
  const handleCreateNewItem = async (data: { type: 'book' | 'content'; title: string; thumbnail?: string; /* other fields */ }) => {
    setIsProcessingAction(true);
    console.log("Creating new item:", data, "in parent:", currentParentIdForNewItem);
    try {
      const response = await fetch("/api/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, parentId: currentParentIdForNewItem }), // Use tracked parentId
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create item');
      }
      setShowContentModal(false);
      setShowBookModal(false);
      setRefreshKey(prev => prev + 1); // Trigger refetch for the root level
      // TODO: Need a more targeted refresh if creating in subfolder
      alert('Item created successfully!'); // Replace with toast
    } catch (error: any) {
      console.error("Error creating item:", error);
      alert(`Failed to create: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessingAction(false);
      setCurrentParentIdForNewItem(null); // Reset context
    }
  };

  const handleSaveChanges = async (id: string, type: "book" | "content", data: any) => {
     setIsProcessingAction(true);
     console.log("Saving item:", id, type, data);
     try {
         const response = await fetch(`/api/drive`, {
             method: "PUT",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ id, type, data }),
         });
         if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.error || 'Failed to update item');
         }
         setIsEditModalOpen(false);
         setRefreshKey(prev => prev + 1); // Trigger refetch
         alert('Item updated successfully!'); // Replace with toast
     } catch (error: any) {
         console.error("Error updating item:", error);
         alert(`Failed to update: ${error.message || 'Unknown error'}`);
     } finally {
         setIsProcessingAction(false);
         setItemToEdit(null);
     }
   };

   const handleTrashItem = async (item: ActionItem) => {
     if (!item) return;
     setIsProcessingAction(true);
     console.log("Trashing item:", item._id);
     try {
       const response = await fetch(`/api/drive`, {
         method: "DELETE",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ id: item._id, type: item.type, mode: 'trash' }),
       });
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || 'Failed to move to trash');
       }
       setIsDeleteModalOpen(false);
       setRefreshKey(prev => prev + 1); // Trigger refetch
       alert('Item moved to trash!'); // Replace with toast
     } catch (error: any) {
       console.error("Failed to trash item:", error);
       alert(`Failed to move to trash: ${error.message || 'Unknown error'}`);
     } finally {
       setIsProcessingAction(false);
       setItemToDelete(null);
     }
   };

   const handlePermanentDeleteItem = async (item: ActionItem) => {
     if (!item) return;
     // Consider adding the extra confirm() here too if desired
     setIsProcessingAction(true);
     console.log("Permanently deleting item:", item._id);
     try {
       const response = await fetch(`/api/drive`, {
         method: "DELETE",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ id: item._id, type: item.type, mode: 'permanent' }),
       });
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || 'Failed to delete permanently');
       }
       setIsDeleteModalOpen(false);
       setRefreshKey(prev => prev + 1); // Trigger refetch
       alert('Item permanently deleted!'); // Replace with toast
     } catch (error: any) {
       console.error("Failed to permanently delete item:", error);
       alert(`Failed to delete: ${error.message || 'Unknown error'}`);
     } finally {
       setIsProcessingAction(false);
       setItemToDelete(null);
     }
   };


  // --- Click Outside Handler ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        isMobile &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
          const overlay = document.getElementById('new-sidebar-overlay');
          if (overlay && event.target === overlay) {
              setIsOpen(false);
          }
      }
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile, isUserMenuOpen, setIsOpen]);

  // --- Mobile Sidebar Close + Notify Parent ---
  const handleContentClickInternal = (contentId: string) => {
      onContentSelect(contentId); // Notify parent (Create page)
      if (isMobile) {
          setIsOpen(false);
      }
  };

  // --- Trigger Refresh Function for Levels ---
  const triggerRefetch = useCallback(() => {
      setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div
          id="new-sidebar-overlay"
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        ref={sidebarRef}
        className={cn(
           'fixed top-0 left-0 h-screen transition-transform duration-300 ease-in-out z-40 flex flex-col',
           'border-r border-slate-200 dark:border-slate-700',
           'w-64', // Base width when open
           // Mobile open/close
           isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : '',
           // Desktop open/close
           !isMobile ? (isOpen ? 'w-64' : 'w-16 translate-x-0') : '', // Handles desktop collapse
           'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
        )}
      >
        {/* Header */}
        <div className={cn(
            "flex items-center p-2 h-16 border-b border-slate-200 dark:border-slate-700 flex-shrink-0",
            isOpen ? "justify-between" : "md:justify-center"
            )}>
           {/* Mobile Close Button */}
           {isOpen && isMobile && (
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close sidebar">
                    <X className="w-5 h-5" />
                </Button>
           )}
           {/* Logo/Title */}
           {isOpen && (
                <div className={cn("font-semibold text-lg ml-2", isMobile && "flex-1 text-center mr-10")}>
                    My Studio
                </div>
           )}
          {/* Desktop Open/Close Toggle */}
          {!isOpen && !isMobile && (
             <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} aria-label="Open sidebar">
                <Menu className="w-5 h-5" />
             </Button>
          )}
        </div>

        {/* Navigation Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="sidebar-content"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              {/* Add Item Button */}
              <div className="p-2 flex-shrink-0">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button
                              className="w-full justify-start gap-2 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600"
                              disabled={isProcessingAction}
                           >
                             <Plus className="h-4 w-4" /> Add New
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 ml-2"> {/* Adjust width/position as needed */}
                          <DropdownMenuItem onClick={() => { setCurrentParentIdForNewItem(null); setShowContentModal(true); }}>
                              <FileText className="mr-2 h-4 w-4" />
                              <span>New Content</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setCurrentParentIdForNewItem(null); setShowBookModal(true); }}>
                              <FolderPlus className="mr-2 h-4 w-4" />
                              <span>New Folder (Book)</span>
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>

              {/* Search Bar */}
              <div className="p-2 pt-1 flex-shrink-0">
                 <div className="relative">
                     <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <Input
                       type="text" placeholder="Search library..." value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full h-9 pl-8 pr-2 rounded-md text-sm bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
                     />
                 </div>
              </div>

              {/* Scrollable Item List */}
              <ScrollArea className="flex-grow pt-1 pb-2 px-2">
                 <SidebarLevel
                     key={refreshKey} // Use key to force re-render/re-fetch on action complete
                     parentId={null}
                     level={0}
                     searchQuery={searchQuery}
                     onContentClick={handleContentClickInternal}
                     onEditItem={handleEditItemClick}   // Pass down
                     onDeleteItem={handleDeleteItemClick} // Pass down
                     refetchData={triggerRefetch}      // Pass down
                 />
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed View Icons */}
        {!isOpen && !isMobile && (
            <div className="flex flex-col items-center mt-4 space-y-3 flex-shrink-0">
                 {/* Add collapsed icons here */}
                 <Button variant="ghost" size="icon" title="Home (Example)"> <Home className="w-5 h-5" /> </Button>
                 {/* Add other icons as needed */}
            </div>
        )}

        {/* Footer (User Menu & Theme) */}
        <div className={cn("mt-auto p-2 border-t border-slate-200 dark:border-slate-700 flex-shrink-0", !isOpen && "md:py-2")}>
           {session?.user?.name && (
             <div className="relative" ref={userMenuRef}>
               <div className={cn("flex items-center", isOpen ? "justify-between" : "md:justify-center")}>
                 {/* User Button/Icon */}
                 <button
                   onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                   className={cn('flex items-center rounded-md p-1 text-left', 'hover:bg-slate-100 dark:hover:bg-slate-800', isOpen ? "w-full" : "md:w-auto md:justify-center", !isOpen && !isMobile && "w-full justify-center")}
                   aria-label="User menu"
                   disabled={!isOpen && isMobile} // Disable button when sidebar is collapsed on mobile
                 >
                   {/* User Avatar Placeholder */}
                   <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold shrink-0 text-sm">
                     {session.user.name.charAt(0).toUpperCase()}
                   </div>
                   {isOpen && <span className="ml-2 text-sm font-medium truncate flex-1">{session.user.name}</span>}
                 </button>
                 {/* Theme Toggle inside open sidebar footer */}
                 {isOpen && <ThemeToggle />}
               </div>
               {/* User Menu Dropdown */}
               {isUserMenuOpen && isOpen && (
                 <div className="absolute bottom-full left-2 right-2 mb-2 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 bg-white dark:bg-slate-800">
                   <div className="py-1">
                     <button onClick={() => { router.push('/progress'); setIsUserMenuOpen(false); handleContentClickInternal(''); }} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded">Progress</button>
                     {/* Add Settings link/button */}
                     <button onClick={() => { signOut(); setIsUserMenuOpen(false); handleContentClickInternal(''); }} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400">Logout</button>
                   </div>
                 </div>
               )}
             </div>
           )}
           {/* Theme toggle for logged-out or collapsed desktop */}
           {(!session?.user?.name || (!isOpen && !isMobile)) && (
              <div className={cn("flex", isOpen ? "justify-end pr-1" : "justify-center mt-2 md:mt-0")}>
                  <ThemeToggle />
              </div>
           )}
        </div>
      </div>

      {/* --- Modals --- */}
      <ContentModal
         userId={session?.user?.id || ""}
         open={showContentModal}
         onOpenChange={setShowContentModal}
         onSave={handleCreateNewItem}
         // Pass processing state if modal needs it
         // isProcessing={isProcessingAction}
      />
      <BookModal
         open={showBookModal}
         onOpenChange={setShowBookModal}
         onSave={handleCreateNewItem}
         // Pass processing state if modal needs it
         // isProcessing={isProcessingAction}
      />
      {/* Use the correctly typed item for modals, ensure EditItemModal/DeleteItemModal props match ActionItem or use mapping */}
      <EditItemModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        // Assuming EditItemModal's 'item' prop is compatible with 'ActionItem' or SidebarDriveItem
        // Use a type assertion for now, but ideally ensure types match
        item={itemToEdit as any}
        onSave={handleSaveChanges}
        // Pass processing state if modal needs it
        // isProcessing={isProcessingAction}
      />
      <DeleteItemModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        // Assuming DeleteItemModal's 'item' prop is compatible with 'ActionItem' or SidebarDriveItem
        // Use a type assertion for now
        item={itemToDelete as any}
        onTrash={handleTrashItem}
        onDelete={handlePermanentDeleteItem}
        isProcessing={isProcessingAction}
      />
    </>
  );
};

// --- Recursive Sidebar Level Component ---
const SidebarLevel: React.FC<SidebarLevelProps> = ({
    parentId,
    level,
    searchQuery,
    onContentClick, // Now correctly typed: (contentId: string) => void
    onEditItem,     // Now correctly typed: (item: SidebarDriveItem) => void
    onDeleteItem,   // Now correctly typed: (item: SidebarDriveItem) => void
    refetchData     // Now correctly typed: () => void
 }) => {
    const [items, setItems] = useState<SidebarDriveItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());

    // Fetching logic
    const fetchLevelItems = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        console.log(`Fetching sidebar items for parent: ${parentId ?? 'root'}`);
        try {
            const parentQuery = parentId === null ? 'null' : parentId;
            // Fetch both types for the sidebar structure
            const res = await fetch(`/api/sidebar-items?parentId=${parentQuery}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setItems(data.items || []);
        } catch (err: any) {
            console.error(`Failed to fetch items for parent ${parentId}:`, err);
            setError("Failed to load items.");
            setItems([]); // Clear items on error
        } finally {
            setIsLoading(false);
        }
    }, [parentId]);

    useEffect(() => {
        fetchLevelItems();
    // The refetch is triggered by the parent changing the 'key' prop,
    // so 'refetchData' doesn't need to be in the dependency array here.
    }, [fetchLevelItems]);

    const toggleBookExpansion = (bookId: string) => {
        setExpandedBooks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(bookId)) {
                newSet.delete(bookId);
            } else {
                newSet.add(bookId);
            }
            return newSet;
        });
    };

    // Filter items based on search query
    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indentStyle = { paddingLeft: `${level * 1.25}rem` }; // Adjust multiplier for desired indent

    // --- Loading/Error/Empty states ---
    if (isLoading && level === 0) { // Show top-level loading indicator
        return (
             <div className="flex items-center justify-center p-4 text-slate-500 dark:text-slate-400" style={indentStyle}>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
             </div>
        );
    }
     if (isLoading && level > 0) { // Show nested loading indicator
        return (
             <div className="flex items-center p-1 text-xs text-slate-500 dark:text-slate-400" style={indentStyle}>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Loading...
             </div>
        );
    }
    if (error) {
        return <div className="p-2 text-xs text-red-500" style={indentStyle}>{error}</div>;
    }
    if (!isLoading && filteredItems.length === 0 && searchQuery) {
        // No results for search query at this level
        return <div className="p-2 text-xs text-slate-500 dark:text-slate-400" style={indentStyle}>No matches found.</div>;
    }
     if (!isLoading && items.length === 0 && level > 0) {
        // No items found in this sub-book (and not root level)
         return <div className="p-1 text-xs text-slate-500 dark:text-slate-400" style={indentStyle}>Empty folder.</div>;
     }
      if (!isLoading && items.length === 0 && level === 0) {
         // No items found at root
         return <div className="p-2 text-sm text-slate-500 dark:text-slate-400" style={indentStyle}>No books or content found.</div>;
      }


    return (
        <ul className="space-y-0.5">
            {filteredItems.map(item => {
                const isBook = item.type === 'book';
                const isExpanded = isBook && expandedBooks.has(item._id);

                return (
                    <li key={item._id} className="group relative rounded"> {/* Add relative and group */}
                        {/* Container for item and actions */}
                        <div className="flex items-center justify-between w-full hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                            {isBook ? (
                                <Button
                                    variant="ghost"
                                    className="flex-grow h-auto justify-start text-left py-1.5 px-2 rounded text-sm" // Removed hover bg here
                                    style={indentStyle}
                                    onClick={() => toggleBookExpansion(item._id)}
                                    title={item.title}
                                >
                                    <ChevronRight className={cn(
                                        'w-4 h-4 mr-1.5 transition-transform duration-200 flex-shrink-0',
                                        isExpanded && 'transform rotate-90',
                                        !item.hasChildren && 'opacity-0' // Hide chevron if no children
                                    )} />
                                    <Folder className="w-4 h-4 mr-1.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                    <span className="truncate">{item.title}</span>
                                </Button>
                            ) : (
                                // Content Item Button
                                <Button
                                    variant="ghost"
                                    className="flex-grow h-auto justify-start text-left py-1.5 px-2 rounded text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100" // Removed hover bg here
                                    style={indentStyle}
                                    onClick={() => onContentClick(item._id)} // Pass contentId up
                                    title={item.title}
                                >
                                    <span className="w-4 h-4 mr-1.5 flex-shrink-0" /> {/* Indentation spacer */}
                                    <FileText className="w-4 h-4 mr-1.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{item.title}</span>
                                </Button>
                            )}

                            {/* Action Menu Trigger */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                     <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 transform -translate-y-1/2 z-10 flex-shrink-0" // Position absolutely, show on hover
                                        aria-label={`Actions for ${item.title}`}
                                        onClick={(e) => e.stopPropagation()} // Prevent triggering item click
                                     >
                                        <MoreVertical className="h-4 w-4" />
                                     </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40"> {/* Adjust width */}
                                    {/* Use the passed down handlers */}
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditItem(item); }}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Rename</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
                                        onClick={(e) => { e.stopPropagation(); onDeleteItem(item); }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete...</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div> {/* End flex container */}

                        {/* Recursive Render for Books */}
                        <AnimatePresence initial={false}>
                            {isExpanded && item.hasChildren && (
                                <motion.div
                                    key={item._id + "-content"}
                                    initial="collapsed"
                                    animate="open"
                                    exit="collapsed"
                                    variants={{
                                        open: { opacity: 1, height: "auto" },
                                        collapsed: { opacity: 0, height: 0 }
                                    }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
                                    {/* Pass all necessary props down recursively */}
                                    <SidebarLevel
                                        parentId={item._id}
                                        level={level + 1}
                                        searchQuery={searchQuery}
                                        onContentClick={onContentClick}
                                        onEditItem={onEditItem}
                                        onDeleteItem={onDeleteItem}
                                        refetchData={refetchData}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </li>
                );
            })}
        </ul>
    );
};

export default NewSidebar;