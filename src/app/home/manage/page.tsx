"use client";

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Link as LinkIcon, List } from "lucide-react";
import { ErrorFallback } from '@/components/error-fallback';
import { VisualEditor } from '@/components/manage/VisualEditor';
import { ListView } from '@/components/manage/ListView';
import { toast } from "sonner";

// Type definition for the data fetched by our API
export interface IContentGraphItem {
  _id: string;
  title: string;
  prerequisites?: string[];
  thumbnail: string | null;
}

// API Fetching Functions
const fetchCollections = async () => {
  const res = await fetch('/api/collections?parentId=null'); // Fetch top-level collections
  if (!res.ok) throw new Error('Failed to fetch collections');
  const data = await res.json();
  return data.data;
};

const fetchContentGraph = async (collectionId: string) => {
  if (!collectionId) return [];
  const res = await fetch(`/api/collections/${collectionId}/content-graph`);
  if (!res.ok) throw new Error('Failed to fetch content graph');
  const data = await res.json();
  return data.data as IContentGraphItem[];
};

const updatePrerequisites = async ({ contentId, prerequisites }: { contentId: string, prerequisites: string[] }) => {
  const res = await fetch(`/api/content/${contentId}/prerequisites`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prerequisites }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update prerequisites');
  }
  return res.json();
};

export default function ManageContentPage() {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const queryClient = useQueryClient();

  // Query to fetch the list of collections for the dropdown
  const { data: collections, isLoading: isLoadingCollections } = useQuery({
    queryKey: ['collectionsList'],
    queryFn: fetchCollections,
  });

  // Query to fetch the content graph for the selected collection
  const { data: contentItems, isLoading: isLoadingContent, isError, error, refetch } = useQuery({
    queryKey: ['contentGraph', selectedCollectionId],
    queryFn: () => fetchContentGraph(selectedCollectionId),
    enabled: !!selectedCollectionId, // Only run this query if a collection is selected
  });

  // Mutation for updating prerequisites
  const mutation = useMutation({
    mutationFn: updatePrerequisites,
    onSuccess: () => {
      toast.success('Prerequisites updated successfully!');
      // When an update is successful, refetch the graph data to keep the UI in sync
      queryClient.invalidateQueries({ queryKey: ['contentGraph', selectedCollectionId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    }
  });

  const handlePrerequisitesChange = (contentId: string, prerequisites: string[]) => {
    mutation.mutate({ contentId, prerequisites });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Manager</h1>
          <p className="text-muted-foreground">Visually organize the learning path for your content.</p>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Select a Collection</label>
          <Select onValueChange={setSelectedCollectionId} value={selectedCollectionId}>
            <SelectTrigger className="w-full md:w-[280px]">
              <SelectValue placeholder="Choose a collection to manage..." />
            </SelectTrigger>
            <SelectContent>
              {isLoadingCollections ? (
                <div className="p-4 text-center">Loading...</div>
              ) : (
                collections?.map((col: any) => (
                  <SelectItem key={col._id} value={col._id}>{col.title}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {selectedCollectionId ? (
        isLoadingContent ? (
          <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : isError ? (
          <ErrorFallback error={error} onRetry={refetch} />
        ) : (
          <Tabs defaultValue="visual" className="w-full">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2">
              <TabsTrigger value="visual"><LinkIcon className="h-4 w-4 mr-2"/>Visual Editor</TabsTrigger>
              <TabsTrigger value="list"><List className="h-4 w-4 mr-2"/>List View</TabsTrigger>
            </TabsList>
            <TabsContent value="visual" className="pt-4">
              <VisualEditor contentItems={contentItems || []} onPrerequisitesChange={handlePrerequisitesChange} />
            </TabsContent>
            <TabsContent value="list" className="pt-4">
              <ListView contentItems={contentItems || []} onPrerequisitesChange={handlePrerequisitesChange} />
            </TabsContent>
          </Tabs>
        )
      ) : (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
          <p className="text-lg text-muted-foreground">Please select a collection to begin managing content.</p>
        </div>
      )}
    </div>
  );
}
