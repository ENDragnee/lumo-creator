// components/navigation/NewSidebar.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, Search, Menu, X, Folder, FileText, Loader2, Home,
    Plus, FolderPlus, MoreVertical, Edit, Trash2
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarDriveItem } from '@/app/api/sidebar-items/route';

// Modals (assuming paths are correct)
import { ContentModal } from '@/components/modals/ContentModal';
import { BookModal } from '@/components/modals/BookModal';
import { EditItemModal } from '@/components/modals/EditItemModal';
import { DeleteItemModal } from '@/components/modals/DeleteItemModal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

// --- Define SidebarProps ---
interface NewSidebarProps {
  // Removed isOpen, setIsOpen, isMobile as parent controls layout
  onContentSelect: (contentId: string) => void;
  // We might still need isCollapsed state from parent later if we want an icon-only view
  // isCollapsed?: boolean; // Optional for future refinement
}

// --- Define SidebarLevelProps (Unchanged) ---
interface SidebarLevelProps {
    parentId: string | null;
    level: number;
    searchQuery: string;
    onContentClick: (contentId: string) => void;
    onEditItem: (item: SidebarDriveItem) => void;
    onDeleteItem: (item: SidebarDriveItem) => void;
    refetchData: () => void;
}

type ActionItem = SidebarDriveItem | null;


// --- Main Sidebar Component (Modified) ---
const NewSidebar: React.FC<NewSidebarProps> = ({ onContentSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // Removed sidebarRef as positioning is now handled by parent
  const userMenuRef = useRef<HTMLDivElement>(null);

  // --- State for Modals & Actions (Unchanged) ---
  const [showContentModal, setShowContentModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ActionItem>(null);
  const [itemToDelete, setItemToDelete] = useState<ActionItem>(null);
  const [currentParentIdForNewItem, setCurrentParentIdForNewItem] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // --- Modal Open Handlers (Unchanged) ---
  const handleEditItemClick = (item: SidebarDriveItem) => {
    setItemToEdit(item);
    setIsEditModalOpen(true);
  };

  const handleDeleteItemClick = (item: SidebarDriveItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  // --- API Call Handlers (Unchanged) ---
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


  // --- Click Outside Handler (Simplified for User Menu) ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close user menu now
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
  }, [isUserMenuOpen]); // Removed dependencies related to sidebar open/mobile

  // --- Content Click Handler (Simplified) ---
  const handleContentClickInternal = (contentId: string) => {
      onContentSelect(contentId); // Notify parent
      // No longer closes sidebar itself
  };

  // --- Trigger Refresh Function (Unchanged) ---
  const triggerRefetch = useCallback(() => {
      setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <>
      {/* REMOVED Mobile Overlay */}
      {/* REMOVED Sidebar Container div with fixed positioning */}

      {/* Use a simple div that fills its container (provided by Sidebar.tsx) */}
      <div className="flex flex-col h-full w-full bg-background dark:bg-slate-900 text-foreground dark:text-slate-100 overflow-hidden bg-gray-100 rounded-lg border border-gray-300 dark:border-slate-900">
        {/* Header */}
        {/* Removed outer container that managed justify-between/center based on isOpen */}
        {/* Header might need slight adjustments depending on whether parent shows title */}
        <div className="flex items-center justify-between p-2 h-16  flex-shrink-0">
            {/* We might want a title here, or maybe the parent <Sidebar> handles the title */}
             <div className="font-semibold text-lg ml-2">
                    <a href="/">Creator Studio</a> {/* Or dynamic based on parent state */}
             </div>
           {/* REMOVED Mobile Close Button */}
           {/* REMOVED Desktop Open/Close Toggle */}
        </div>

        {/* Navigation Content */}
        {/* Removed AnimatePresence and motion.div related to isOpen */}
        <div className="flex-1 overflow-hidden flex flex-col">
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
                   <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <Input
                     type="text" placeholder="Search library..." value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full h-9 pl-8 pr-2 rounded-md text-sm bg-muted/50 dark:bg-slate-800 focus:border-indigo-500 focus:ring-indigo-500"
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
        </div>
        {/* REMOVED Collapsed View Icons section */}

        {/* Footer (User Menu & Theme) */}
        <div className={cn("mt-auto p-2 dark:border-slate-700 flex-shrink-0")}>
           {session?.user?.name && (
             <div className="relative" ref={userMenuRef}>
               {/* Keep the internal structure, remove isOpen checks for layout */}
               <div className="flex items-center justify-between">
                 <button
                   onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                   className='flex items-center rounded-md p-1 text-left w-full hover:bg-muted dark:hover:bg-slate-800'
                   aria-label="User menu"
                 >
                   {/* User Avatar Placeholder */}
                   <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold shrink-0 text-sm">
                     {session.user.name.charAt(0).toUpperCase()}
                   </div>
                   <span className="ml-2 text-sm font-medium truncate flex-1">{session.user.name}</span>
                 </button>
                 {/* Theme Toggle is always visible here now */}
                 <ThemeToggle />
               </div>
               {/* User Menu Dropdown */}
               {isUserMenuOpen && ( // Only check if menu should be open
                 <div className="absolute bottom-full left-2 right-2 mb-2 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 bg-background dark:bg-slate-800">
                   <div className="py-1">
                     {/* Pass empty string or handle navigation differently if needed */}
                     <button onClick={() => { router.push('/progress'); setIsUserMenuOpen(false); /* handleContentClickInternal(''); */ }} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-muted dark:hover:bg-slate-700 rounded">Progress</button>
                     <button onClick={() => { signOut(); setIsUserMenuOpen(false); /* handleContentClickInternal(''); */ }} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400">Logout</button>
                   </div>
                 </div>
               )}
             </div>
           )}
           {/* Theme toggle for logged-out */}
           {!session?.user?.name && (
              <div className="flex justify-center mt-2">
                  <ThemeToggle />
              </div>
           )}
        </div>
      </div> {/* End of the main filling div */}

      {/* --- Modals (Unchanged) --- */}
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
      <EditItemModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        item={itemToEdit as any}
        onSave={handleSaveChanges}
      />
      <DeleteItemModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        item={itemToDelete as any}
        onTrash={handleTrashItem}
        isProcessing={isProcessingAction}
      />
    </>
  );
};

// --- Recursive Sidebar Level Component (No changes needed here for structure, only maybe styling) ---
const SidebarLevel: React.FC<SidebarLevelProps> = ({
    parentId,
    level,
    searchQuery,
    onContentClick,
    onEditItem,
    onDeleteItem,
    refetchData
 }) => {
    const [items, setItems] = useState<SidebarDriveItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());

    // Fetching logic (Unchanged)
    const fetchLevelItems = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        console.log(`Fetching sidebar items for parent: ${parentId ?? 'root'}`);
        try {
            const parentQuery = parentId === null ? 'null' : parentId;
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
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [parentId]);

    useEffect(() => {
        fetchLevelItems();
    }, [fetchLevelItems]); // Refetch triggered by parent's key prop

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

    const indentStyle = { paddingLeft: `${level * 1.25}rem` };

    // --- Loading/Error/Empty states (Unchanged) ---
    if (isLoading && level === 0) {
        return (
             <div className="flex items-center justify-center p-4 text-muted-foreground" style={indentStyle}>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
             </div>
        );
    }
     if (isLoading && level > 0) {
        return (
             <div className="flex items-center p-1 text-xs text-muted-foreground" style={indentStyle}>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Loading...
             </div>
        );
    }
    if (error) {
        return <div className="p-2 text-xs text-red-500" style={indentStyle}>{error}</div>;
    }
    if (!isLoading && filteredItems.length === 0 && searchQuery) {
        return <div className="p-2 text-xs text-muted-foreground" style={indentStyle}>No matches found.</div>;
    }
     if (!isLoading && items.length === 0 && level > 0) {
         return <div className="p-1 text-xs text-muted-foreground" style={indentStyle}>Empty folder.</div>;
     }
      if (!isLoading && items.length === 0 && level === 0) {
         return <div className="p-2 text-sm text-muted-foreground" style={indentStyle}>No books or content found.</div>;
      }

    // --- List Rendering (Minor style tweaks possible) ---
    return (
        <ul className="space-y-0.5">
            {filteredItems.map(item => {
                const isBook = item.type === 'book';
                const isExpanded = isBook && expandedBooks.has(item._id);

                return (
                    <li key={item._id} className="group relative rounded">
                        <div className="flex items-center justify-between w-full hover:bg-muted dark:hover:bg-slate-800 rounded">
                            {isBook ? (
                                <Button
                                    variant="ghost"
                                    className="flex-grow h-auto justify-start text-left py-1.5 px-2 rounded text-sm font-normal" // Added font-normal
                                    style={indentStyle}
                                    onClick={() => toggleBookExpansion(item._id)}
                                    title={item.title}
                                >
                                    <ChevronRight className={cn(
                                        'w-4 h-4 mr-1.5 transition-transform duration-200 flex-shrink-0 text-muted-foreground', // Added color
                                        isExpanded && 'transform rotate-90',
                                        !item.hasChildren && 'opacity-0'
                                    )} />
                                    <Folder className="w-4 h-4 mr-1.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                    <span className="truncate">{item.title}</span>
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    className="flex-grow h-auto justify-start text-left py-1.5 px-2 rounded text-sm font-normal text-foreground/80 hover:text-foreground" // Adjusted text colors
                                    style={indentStyle}
                                    onClick={() => onContentClick(item._id)}
                                    title={item.title}
                                >
                                    <span className="w-4 h-4 mr-1.5 flex-shrink-0" /> {/* Indentation spacer */}
                                    <FileText className="w-4 h-4 mr-1.5 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">{item.title}</span>
                                </Button>
                            )}

                            {/* Action Menu Trigger (Unchanged logic, minor style consistency) */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                     <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 transform -translate-y-1/2 z-10 flex-shrink-0 text-muted-foreground hover:bg-muted/80" // Adjusted colors
                                        aria-label={`Actions for ${item.title}`}
                                        onClick={(e) => e.stopPropagation()}
                                     >
                                        <MoreVertical className="h-4 w-4" />
                                     </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
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
                        </div>

                        {/* Recursive Render for Books (Unchanged) */}
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


export default NewSidebar; // Ensure export default is present
