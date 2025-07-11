"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Folder, FileText, Plus, ChevronRight, Loader2, LayoutGrid, List, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

// **THE FIX**: Import the centralized types.
import { DriveItem, HomePageBook, HomePageContent } from "@/types/drive";

// --- Type Definitions for this specific page ---
// These are now just for local convenience if needed, but the core type is imported.
interface Breadcrumb { id: string | null; title: string; }
type ViewMode = 'grid' | 'list';

// --- Import Card and Modal Components ---
import { BookCard } from "@/components/cards/BookCard";
import { ContentCard } from "@/components/cards/ContentCard";
import { BookCardList } from "@/components/cards/BookCardList";
import { ContentCardList } from "@/components/cards/ContentCardList";
import { BookModal } from "@/components/modals/BookModal";
import { ContentModal } from "@/components/modals/ContentModal";
import { EditItemModal } from "@/components/modals/EditItemModal";
import { DeleteItemModal } from "@/components/modals/DeleteItemModal";

export default function HomePage() {
    const { status } = useSession();
    const router = useRouter();

    const [books, setBooks] = useState<HomePageBook[]>([]);
    const [content, setContent] = useState<HomePageContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: null, title: 'My Home' }]);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    // --- Modal States ---
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isContentModalOpen, setIsContentModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    // Use the imported DriveItem type for state
    const [selectedItem, setSelectedItem] = useState<DriveItem | null>(null);

    const fetchData = useCallback(async (parentId: string | null) => {
        if (status !== 'authenticated') return;
        setLoading(true);
        setError(null);
        
        const parentQuery = parentId ? `?parentId=${parentId}` : '?parentId=null';

        try {
            const [bookRes, contentRes] = await Promise.all([
                fetch(`/api/books${parentQuery}`),
                fetch(`/api/content${parentQuery}`)
            ]);

            if (!bookRes.ok || !contentRes.ok) {
                const errorData = !bookRes.ok ? await bookRes.json() : await contentRes.json();
                throw new Error(errorData.message || 'Failed to fetch data.');
            }

            const bookData = await bookRes.json();
            const contentData = await contentRes.json();

            setBooks((bookData.data || []) as HomePageBook[]);
            setContent((contentData.data || []) as HomePageContent[]);
        } catch (e: any) {
            console.error("Fetch error:", e);
            setError(e.message || "An unknown error occurred.");
            setBooks([]);
            setContent([]);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchData(currentParentId);
        } else if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [currentParentId, fetchData, status, router]);

    const handleBookClick = (bookId: string) => {
        const clickedBook = books.find(b => b._id === bookId);
        if (clickedBook) {
            setCurrentParentId(bookId);
            setBreadcrumbs(prev => [...prev, { id: bookId, title: clickedBook.title }]);
        }
    };
    
    const handleBreadcrumbClick = (crumbId: string | null, index: number) => {
        setCurrentParentId(crumbId);
        setBreadcrumbs(prev => prev.slice(0, index + 1));
    };

    const openEditModal = (item: DriveItem) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (item: DriveItem) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };
    
    // The handler's parameter is now correctly typed as DriveItem
    const handleTrashConfirm = async (item: DriveItem) => {
        const endpoint = item.type === 'book' ? `/api/books/${item._id}` : `/api/content/${item._id}`;
        try {
            const res = await fetch(endpoint, { method: 'DELETE' });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || `Failed to delete ${item.type}`);
            }
            fetchData(currentParentId);
        } catch (err: any) {
            console.error(err);
            setError(`Could not delete item: ${err.message}`);
        }
    };

    const combinedItems: DriveItem[] = [
      ...books.map(b => ({ ...b, type: 'book' as const })),
      ...content.map(c => ({ ...c, type: 'content' as const }))
    ].sort((a, b) => {
        const dateA = a.type === 'book' ? a.updatedAt : (a.lastModifiedAt || a.createdAt);
        const dateB = b.type === 'book' ? b.updatedAt : (b.lastModifiedAt || b.createdAt);
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    const Header = () => (
        <header className="flex-shrink-0 p-4 sm:p-6 border-b flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id || 'root'}>
                        {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`px-2 h-9 text-base font-medium truncate ${index === breadcrumbs.length - 1 ? "text-foreground cursor-default" : "text-muted-foreground"}`}
                            onClick={() => handleBreadcrumbClick(crumb.id, index)}
                            disabled={index === breadcrumbs.length - 1}
                        >
                            {crumb.title}
                        </Button>
                    </React.Fragment>
                ))}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <div className="hidden sm:flex items-center">
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} aria-label="Grid View">
                        <LayoutGrid className="h-5 w-5" />
                    </Button>
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} aria-label="List View">
                        <List className="h-5 w-5" />
                    </Button>
                </div>
                <ThemeToggle />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-5 w-5" />
                            <span className="hidden sm:inline">New</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setIsContentModalOpen(true)} className="gap-2 cursor-pointer">
                           <FileText className="h-4 w-4 text-primary" /> New Content
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setIsBookModalOpen(true)} className="gap-2 cursor-pointer">
                           <Folder className="h-4 w-4 text-blue-500" /> New Book
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );

    const ItemGrid = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-4 sm:p-6">
          {combinedItems.map((item, index) =>
            item.type === 'book' ? (
              <BookCard key={item._id} item={item} index={index} onItemClick={handleBookClick} />
            ) : (
              <ContentCard key={item._id} item={item} index={index} />
            )
          )}
        </div>
    );
    
    const ItemList = () => (
        <div className="p-4 sm:p-6 space-y-1.5">
            {combinedItems.map((item, index) => 
                <DropdownMenu key={item._id}>
                    <DropdownMenuTrigger asChild>
                        <div role="button" tabIndex={0} onContextMenu={(e: React.MouseEvent) => e.preventDefault()}>
                            {item.type === 'book' ? (
                                <BookCardList item={item} index={index} onItemClick={handleBookClick} onOpenActions={(e: React.MouseEvent) => e.preventDefault()}/>
                            ) : (
                                <ContentCardList item={item} index={index} onOpenActions={(e: React.MouseEvent) => e.preventDefault()}/>
                            )}
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openEditModal(item)} className="gap-2">
                            <Edit className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openDeleteModal(item)} className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="h-4 w-4" /> Move to Trash
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );

    if (status === 'loading' || (status === 'authenticated' && loading && breadcrumbs.length === 1)) {
         return (
            <div className="flex justify-center items-center h-screen bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background text-foreground">
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <div className="flex-1 overflow-y-auto">
                    {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
                    {!loading && error && (
                        <div className="text-center py-16 text-destructive">
                            <p className="font-semibold">Error: {error}</p>
                            <Button onClick={() => fetchData(currentParentId)} variant="outline" size="sm" className="mt-4">Retry</Button>
                        </div>
                    )}
                    {!loading && !error && combinedItems.length === 0 && (
                        <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
                            <Folder className="h-20 w-20 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">This folder is empty</p>
                            <p className="text-sm mt-1 max-w-xs">Click the 'New' button to create your first Book or Content item here.</p>
                        </div>
                    )}
                    {!loading && !error && combinedItems.length > 0 && (
                         viewMode === 'grid' ? <ItemGrid /> : <ItemList />
                    )}
                </div>
            </main>
            
            {/* Modals */}
            <BookModal open={isBookModalOpen} onOpenChange={setIsBookModalOpen} onSuccess={() => fetchData(currentParentId)} parentId={currentParentId} />
            <ContentModal open={isContentModalOpen} onOpenChange={setIsContentModalOpen} onSuccess={() => fetchData(currentParentId)} parentId={currentParentId} />
            <EditItemModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} onSuccess={() => fetchData(currentParentId)} item={selectedItem} />
            {/* The onConfirm prop now correctly matches the type expected by the modal */}
            <DeleteItemModal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} onConfirm={handleTrashConfirm} item={selectedItem} />
        </div>
    );
}
