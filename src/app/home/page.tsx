"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Folder, Loader2, Edit, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DriveItem, HomePageCollection, HomePageContent } from "@/types/drive";
import { CollectionCard } from "@/components/cards/CollectionCard";
import { ContentCard } from "@/components/cards/ContentCard";
import { CollectionCardList } from "@/components/cards/CollectionCardList";
import { ContentCardList } from "@/components/cards/ContentCardList";
import { CollectionModal } from "@/components/modals/CollectionModal";
import { ContentModal } from "@/components/modals/ContentModal";
import { EditItemModal } from "@/components/modals/EditItemModal";
import { DeleteItemModal } from "@/components/modals/DeleteItemModal";
import { DriveHeader } from "@/components/layout/DriveHeader";
import { useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import { ErrorFallback } from "@/components/error-fallback";
import { toast } from "sonner"; // Assuming you use a toast library for notifications

interface Breadcrumb {
  id: string | null;
  title: string;
}

// Helper function to fetch drive data
const fetchDriveItems = async (parentId: string | null): Promise<{ collections: HomePageCollection[]; content: HomePageContent[] }> => {
  if (parentId) {
    const res = await fetch(`/api/collections/${parentId}`);
    if (!res.ok) throw new Error("Failed to fetch collection contents.");
    const collectionData = await res.json();
    return {
      collections: collectionData.data.childCollections || [],
      content: collectionData.data.childContent || [],
    };
  } else {
    // For the root view, fetch top-level items in parallel
    const [collectionRes, contentRes] = await Promise.all([
      fetch(`/api/collections?parentId=null`),
      fetch(`/api/content?parentId=null`),
    ]);
    if (!collectionRes.ok || !contentRes.ok) throw new Error("Failed to fetch root data.");
    const collectionData = await collectionRes.json();
    const contentData = await contentRes.json();
    return {
      collections: collectionData.data || [],
      content: contentData.data || [],
    };
  }
};

export default function HomePage() {
  const { status } = useSession();
  const queryClient = useQueryClient();

  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: null, title: "My Home" }]);

  const viewMode = useAppSelector((state: RootState) => state.view.viewMode);

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DriveItem | null>(null);

  // --- REFACTOR: Data fetching is now managed by useQuery ---
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching, // useful for showing loading indicators on refetches
  } = useQuery({
    queryKey: ["driveItems", currentParentId], // Unique key for this query
    queryFn: () => fetchDriveItems(currentParentId),
    enabled: status === "authenticated", // Only run the query when the user is logged in
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
  });

  // --- REFACTOR: Deletion is handled by useMutation ---
  const deleteMutation = useMutation({
    mutationFn: async (item: DriveItem) => {
      const endpoint = item.type === "collection" ? `/api/collections/${item._id}` : `/api/content/${item._id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(`Failed to delete ${item.type}.`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Item moved to trash.");
      // Invalidate the query to trigger a refetch of the current folder's content
      queryClient.invalidateQueries({ queryKey: ["driveItems", currentParentId] });
    },
    onError: (err: Error) => {
      toast.error(`Could not delete item: ${err.message}`);
    },
  });

  // Derived state from query data
  const collections = data?.collections || [];
  const content = data?.content || [];

  const combinedItems: DriveItem[] = [
    ...collections.map((c) => ({ ...c, type: "collection" as const })),
    ...content.map((c) => ({ ...c, type: "content" as const })),
  ].sort((a, b) => {
    const dateA = a.type === "collection" ? a.updatedAt : a.lastModifiedAt || a.createdAt;
    const dateB = b.type === "collection" ? b.updatedAt : b.lastModifiedAt || b.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const handleCollectionClick = (collectionId: string) => {
    const clickedCollection = collections.find((c) => c._id === collectionId);
    if (clickedCollection) {
      setCurrentParentId(collectionId);
      setBreadcrumbs((prev) => [...prev, { id: collectionId, title: clickedCollection.title }]);
    }
  };

  const handleBreadcrumbClick = (crumbId: string | null, index: number) => {
    setCurrentParentId(crumbId);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  const openEditModal = (item: DriveItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (item: DriveItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };
  
  // --- REFACTOR: Modal success and delete confirmation now use React Query's tools ---
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["driveItems", currentParentId] });
  };
  
  const handleTrashConfirm = (item: DriveItem) => {
    deleteMutation.mutate(item);
  };

  const ItemActions = ({ item }: { item: DriveItem }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
          className="h-8 w-8 rounded-full data-[state=open]:bg-muted"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => openEditModal(item)} className="gap-2">
          <Edit className="h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => openDeleteModal(item)}
          className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" /> Move to Trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const ItemGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-4 sm:p-6">
      {combinedItems.map((item, index) =>
        item.type === "collection" ? (
          <CollectionCard
            key={item._id}
            item={item}
            index={index}
            onItemClick={handleCollectionClick}
            actionNode={<ItemActions item={item} />}
          />
        ) : (
          <ContentCard key={item._id} item={item} index={index} actionNode={<ItemActions item={item} />} />
        )
      )}
    </div>
  );

  const ItemList = () => (
    <div className="p-4 sm:p-6 space-y-1.5">
      {combinedItems.map((item, index) =>
        item.type === "collection" ? (
          <CollectionCardList
            key={item._id}
            item={item}
            index={index}
            onItemClick={handleCollectionClick}
            actionNode={<ItemActions item={item} />}
          />
        ) : (
          <ContentCardList key={item._id} item={item} index={index} actionNode={<ItemActions item={item} />} />
        )
      )}
    </div>
  );
  
  // --- REFACTOR: Updated loading and error states using `useQuery` return values ---
  if (status === "loading" || (isLoading && breadcrumbs.length === 1)) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <DriveHeader
        breadcrumbs={breadcrumbs}
        onBreadcrumbClick={handleBreadcrumbClick}
        onNewCollection={() => setIsCollectionModalOpen(true)}
        onNewContent={() => setIsContentModalOpen(true)}
      />
      <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {isFetching && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isFetching && isError && (
          <div className="text-center py-16 text-destructive">
            <ErrorFallback error={error as Error} onRetry={refreshData} />
          </div>
        )}
        {!isFetching && !isError && combinedItems.length === 0 && (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
            <Folder className="h-20 w-20 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">This folder is empty</p>
          </div>
        )}
        {!isFetching && !isError && combinedItems.length > 0 && (viewMode === "grid" ? <ItemGrid /> : <ItemList />)}
      </div>
      
      {/* Modals now use `refreshData` which invalidates the query on success */}
      <CollectionModal
        open={isCollectionModalOpen}
        onOpenChange={setIsCollectionModalOpen}
        onSuccess={refreshData}
        parentId={currentParentId}
      />
      <ContentModal
        open={isContentModalOpen}
        onOpenChange={setIsContentModalOpen}
        onSuccess={refreshData}
        parentId={currentParentId}
      />
      <EditItemModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={refreshData}
        item={selectedItem}
      />
      <DeleteItemModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleTrashConfirm}
        item={selectedItem}
      />
    </>
  );
}
