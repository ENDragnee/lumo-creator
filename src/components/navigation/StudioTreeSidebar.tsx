"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Search, Menu, X, Folder, FileText, Loader2, Plus, Edit, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// Import shared types and modals
import { DriveItem } from '@/types/drive';
import { ContentModal } from '@/components/modals/ContentModal';
import { BookModal } from '@/components/modals/BookModal';
import { EditItemModal } from '@/components/modals/EditItemModal';
import { DeleteItemModal } from '@/components/modals/DeleteItemModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

// --- TYPE DEFINITIONS ---
interface StudioTreeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onContentSelect: (contentId: string) => void;
}

interface SidebarLevelProps {
    parentId: string | null;
    level: number;
    searchQuery: string;
    onContentClick: (contentId:string) => void;
    onEditItem: (item: DriveItem) => void;
    onDeleteItem: (item: DriveItem) => void;
    setParentForNewItem: (parentId: string | null) => void;
}

// --- RECURSIVE FILE TREE LEVEL COMPONENT ---
const SidebarLevel: React.FC<SidebarLevelProps> = ({ parentId, level, searchQuery, onContentClick, onEditItem, onDeleteItem, setParentForNewItem }) => {
    const [items, setItems] = useState<DriveItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());

    const fetchLevelItems = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const parentQuery = `?parentId=${parentId ?? 'null'}`;
            const [bookRes, contentRes] = await Promise.all([
                fetch(`/api/books${parentQuery}`),
                fetch(`/api/content${parentQuery}`),
            ]);
            if (!bookRes.ok || !contentRes.ok) throw new Error("Failed to fetch library items.");

            const booksData = await bookRes.json();
            const contentData = await contentRes.json();
            
            const combined = [
                ...(booksData.data || []),
                ...(contentData.data || [])
            ].sort((a, b) => a.title.localeCompare(b.title));
            
            setItems(combined);
        } catch (err: any) {
            setError("Failed to load.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [parentId]);

    useEffect(() => {
        fetchLevelItems();
    }, [fetchLevelItems]);

    const toggleBookExpansion = (bookId: string) => {
        setExpandedBooks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(bookId)) newSet.delete(bookId);
            else newSet.add(bookId);
            return newSet;
        });
    };

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indentStyle = { paddingLeft: `${level * 1.25 + 0.5}rem` };

    if (isLoading) return <div className="flex items-center p-2 text-sm text-muted-foreground" style={{ paddingLeft: `${level * 1.25 + 0.5}rem` }}><Loader2 className="h-4 w-4 mr-2 animate-spin" /></div>;
    if (error) return <div className="p-2 text-xs text-destructive" style={indentStyle}>{error}</div>;
    if (!isLoading && items.length === 0 && level > 0 && !searchQuery) return <div className="p-1.5 text-xs text-muted-foreground" style={indentStyle}>Empty folder</div>;
    
    return (
        <ul className="space-y-0.5">
            {filteredItems.map(item => {
                const isBook = item.type === 'book';
                const isExpanded = isBook && expandedBooks.has(item._id);
                return (
                    <li key={item._id} className="group/item relative rounded-md">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div
                                    role="button"
                                    onClick={() => isBook ? toggleBookExpansion(item._id) : onContentClick(item._id)}
                                    className={cn(
                                        "flex items-center justify-between w-full hover:bg-muted rounded-md text-sm",
                                        isBook ? "font-medium text-foreground" : "font-normal text-muted-foreground hover:text-foreground"
                                    )}
                                    style={indentStyle}
                                >
                                    <div className="flex items-center gap-2 py-1.5 truncate">
                                        {isBook && <ChevronRight className={cn('h-4 w-4 transition-transform duration-200', isExpanded && 'rotate-90')} />}
                                        {isBook ? <Folder className="h-4 w-4 text-blue-500" /> : <FileText className="h-4 w-4" />}
                                        <span className="truncate">{item.title}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/item:opacity-100"><MoreVertical className="h-4 w-4" /></Button>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onSelect={() => onEditItem(item)} className="gap-2"><Edit className="h-4 w-4" /> Rename</DropdownMenuItem>
                                {isBook && (
                                    <DropdownMenuItem onSelect={() => setParentForNewItem(item._id)} className="gap-2">
                                        <Plus className="h-4 w-4" /> New Item Here
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => onDeleteItem(item)} className="gap-2 text-destructive focus:text-destructive">
                                    <Trash2 className="h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <SidebarLevel {...{ parentId: item._id, level: level + 1, searchQuery, onContentClick, onEditItem, onDeleteItem, setParentForNewItem }} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </li>
                );
            })}
        </ul>
    );
};

// --- MAIN SIDEBAR COMPONENT ---
export function StudioTreeSidebar({ isOpen, onClose, onContentSelect }: StudioTreeSidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    
    // State for Modals
    const [modalState, setModalState] = useState<{
        isBookOpen: boolean;
        isContentOpen: boolean;
        isEditOpen: boolean;
        isDeleteOpen: boolean;
        selectedItem: DriveItem | null;
        parentForNew: string | null;
    }>({
        isBookOpen: false,
        isContentOpen: false,
        isEditOpen: false,
        isDeleteOpen: false,
        selectedItem: null,
        parentForNew: null,
    });
    
    // Refresh key to force re-fetch in the tree
    const [refreshKey, setRefreshKey] = useState(0);
    const forceRefetch = () => setRefreshKey(k => k + 1);

    // Mobile detection effect
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close mobile sidebar when content is selected
    const handleContentClick = (contentId: string) => {
        onContentSelect(contentId);
        if (isMobile) {
            onClose();
        }
    };

    // Modal action handlers
    const openEditModal = (item: DriveItem) => setModalState(s => ({ ...s, isEditOpen: true, selectedItem: item }));
    const openDeleteModal = (item: DriveItem) => setModalState(s => ({ ...s, isDeleteOpen: true, selectedItem: item }));
    const setParentForNewItem = (parentId: string | null) => setModalState(s => ({ ...s, isContentOpen: true, parentForNew: parentId }));

    const sidebarContent = (
        <div className={cn(
            "flex flex-col h-full bg-background border-r w-72"
        )}>
            <div className="flex items-center justify-between p-2 border-b h-14 shrink-0">
                <h2 className="font-semibold text-lg px-2">Studio Library</h2>
                {isMobile && <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>}
            </div>
            <div className="p-2 shrink-0">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button className="w-full gap-2"><Plus className="h-4 w-4"/>New</Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem onSelect={() => setModalState(s => ({ ...s, isContentOpen: true, parentForNew: null }))} className="gap-2"><FileText className="h-4 w-4"/>New Content</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setModalState(s => ({ ...s, isBookOpen: true, parentForNew: null }))} className="gap-2"><Folder className="h-4 w-4"/>New Book (Folder)</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="p-2 shrink-0">
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            </div>
            <ScrollArea className="flex-1">
                <div key={refreshKey} className="p-2">
                    <SidebarLevel parentId={null} level={0} searchQuery={searchQuery} onContentClick={handleContentClick} onEditItem={openEditModal} onDeleteItem={openDeleteModal} setParentForNewItem={setParentForNewItem}/>
                </div>
            </ScrollArea>
        </div>
    );

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    isMobile ? (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 z-40"
                                onClick={onClose}
                            />
                            <motion.aside
                                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="fixed top-0 left-0 h-full z-50"
                            >
                                {sidebarContent}
                            </motion.aside>
                        </>
                    ) : (
                        <motion.aside
                            initial={{ width: 0 }}
                            animate={{ width: 288 }} // w-72
                            exit={{ width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0 overflow-hidden"
                        >
                           {sidebarContent}
                        </motion.aside>
                    )
                )}
            </AnimatePresence>

            {/* Modals */}
            <BookModal open={modalState.isBookOpen} onOpenChange={(open) => setModalState(s => ({ ...s, isBookOpen: open }))} onSuccess={forceRefetch} parentId={modalState.parentForNew} />
            <ContentModal open={modalState.isContentOpen} onOpenChange={(open) => setModalState(s => ({ ...s, isContentOpen: open }))} onSuccess={forceRefetch} parentId={modalState.parentForNew} />
            <EditItemModal open={modalState.isEditOpen} onOpenChange={(open) => setModalState(s => ({ ...s, isEditOpen: open }))} onSuccess={forceRefetch} item={modalState.selectedItem} />
            <DeleteItemModal open={modalState.isDeleteOpen} onOpenChange={(open) => setModalState(s => ({ ...s, isDeleteOpen: open }))} onConfirm={async (item) => {
                const endpoint = item.type === 'book' ? `/api/books/${item._id}` : `/api/content/${item._id}`;
                await fetch(endpoint, { method: 'DELETE' });
                forceRefetch();
            }} item={modalState.selectedItem} />
        </>
    );
}
