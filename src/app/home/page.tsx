"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Folder, Loader2, Edit, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DriveItem, HomePageBook, HomePageContent } from "@/types/drive";
import { BookCard } from "@/components/cards/BookCard";
import { ContentCard } from "@/components/cards/ContentCard";
import { BookCardList } from "@/components/cards/BookCardList";
import { ContentCardList } from "@/components/cards/ContentCardList";
import { BookModal } from "@/components/modals/BookModal";
import { ContentModal } from "@/components/modals/ContentModal";
import { EditItemModal } from "@/components/modals/EditItemModal";
import { DeleteItemModal } from "@/components/modals/DeleteItemModal";
import { DriveHeader } from "@/components/layout/DriveHeader";
import { useAppSelector } from "@/app/store/hooks"; // FIX: Corrected import path
import { RootState } from "@/app/store/store";

interface Breadcrumb { id: string | null; title: string; }

export default function HomePage() {
    const { status } = useSession();
    const [books, setBooks] = useState<HomePageBook[]>([]);
    const [content, setContent] = useState<HomePageContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: null, title: 'My Home' }]);
    
    const viewMode = useAppSelector((state: RootState) => state.view.viewMode);

    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isContentModalOpen, setIsContentModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
            if (!bookRes.ok || !contentRes.ok) throw new Error('Failed to fetch data.');
            const bookData = await bookRes.json();
            const contentData = await contentRes.json();
            setBooks(bookData.data || []);
            setContent(contentData.data || []);
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        if (status === 'authenticated') fetchData(currentParentId);
    }, [currentParentId, fetchData, status]);

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
    
    const handleTrashConfirm = async (item: DriveItem) => {
        const endpoint = item.type === 'book' ? `/api/books/${item._id}` : `/api/content/${item._id}`;
        try {
            const res = await fetch(endpoint, { method: 'DELETE' });
            if (!res.ok) throw new Error(`Failed to delete ${item.type}`);
            fetchData(currentParentId);
        } catch (err: any) {
            setError(`Could not delete item: ${err.message}`);
        }
    };

    const combinedItems: DriveItem[] = [
      ...books.map(b => ({ ...b, type: 'book' as const })),
      ...content.map(c => ({ ...c, type: 'content' as const }))
    ].sort((a, b) => {
        // FIX: Access the correct date field based on item type
        const dateA = a.type === 'book' ? a.updatedAt : (a.lastModifiedAt || a.createdAt);
        const dateB = b.type === 'book' ? b.updatedAt : (b.lastModifiedAt || b.createdAt);
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    
    const ItemActions = ({ item }: { item: DriveItem }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="h-8 w-8 rounded-full data-[state=open]:bg-muted">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onSelect={() => openEditModal(item)} className="gap-2"><Edit className="h-4 w-4" /> Edit</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => openDeleteModal(item)} className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="h-4 w-4" /> Move to Trash</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const ItemGrid = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-4 sm:p-6">
          {combinedItems.map((item, index) =>
            item.type === 'book' ? (
              <BookCard key={item._id} item={item} index={index} onItemClick={handleBookClick} actionNode={<ItemActions item={item} />} />
            ) : (
              <ContentCard key={item._id} item={item} index={index} actionNode={<ItemActions item={item} />} />
            )
          )}
        </div>
    );
    
    const ItemList = () => (
        <div className="p-4 sm:p-6 space-y-1.5">
            {combinedItems.map((item, index) => 
                item.type === 'book' ? (
                    <BookCardList key={item._id} item={item} index={index} onItemClick={handleBookClick} actionNode={<ItemActions item={item} />} />
                ) : (
                    <ContentCardList key={item._id} item={item} index={index} actionNode={<ItemActions item={item} />} />
                )
            )}
        </div>
    );
    
    if (status === 'loading' || (status === 'authenticated' && loading && breadcrumbs.length === 1)) {
         return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    return (
        <>
            <DriveHeader 
                breadcrumbs={breadcrumbs}
                onBreadcrumbClick={handleBreadcrumbClick}
                onNewBook={() => setIsBookModalOpen(true)}
                onNewContent={() => setIsContentModalOpen(true)}
            />
            <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
                {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
                {!loading && error && <div className="text-center py-16 text-destructive"><p className='font-semibold'>Error: {error}</p></div>}
                {!loading && !error && combinedItems.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
                        <Folder className="h-20 w-20 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">This folder is empty</p>
                    </div>
                )}
                {!loading && !error && combinedItems.length > 0 && (
                     viewMode === 'grid' ? <ItemGrid /> : <ItemList />
                )}
            </div>
            
            <BookModal open={isBookModalOpen} onOpenChange={setIsBookModalOpen} onSuccess={() => fetchData(currentParentId)} parentId={currentParentId} />
            <ContentModal open={isContentModalOpen} onOpenChange={setIsContentModalOpen} onSuccess={() => fetchData(currentParentId)} parentId={currentParentId} />
            <EditItemModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} onSuccess={() => fetchData(currentParentId)} item={selectedItem} />
            <DeleteItemModal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} onConfirm={handleTrashConfirm} item={selectedItem} />
        </>
    );
}
