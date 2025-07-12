"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useEditor } from '@craftjs/core';
import { fetchMedia, removeMediaItem } from '@/app/store/slices/mediaSlice';
import { AppDispatch, RootState } from '@/app/store/store';
import { ImageComponent } from '@/components/editor-components/ImageComponent';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { ImageUploader } from './ImageUploader'; // Import the uploader

export function ImageToolPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: mediaItems, status } = useSelector((state: RootState) => state.media);
  const { connectors } = useEditor();

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchMedia());
    }
  }, [status, dispatch]);

  const images = mediaItems.filter(item => item.mediaType === 'image');

  const handleDelete = async (mediaId: string) => {
    dispatch(removeMediaItem(mediaId)); // Optimistic delete
    try {
      const response = await fetch(`/api/media/${mediaId}`, { method: 'DELETE' });
      if (!response.ok) {
        console.error("Failed to delete on server, refetching...");
        dispatch(fetchMedia()); // Refetch to revert state
      }
    } catch (error) {
      console.error("Error during deletion:", error);
      dispatch(fetchMedia()); // Refetch to revert state
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex-shrink-0 border-b">
        <h2 className="text-lg font-semibold">Image Library</h2>
      </div>
      <div className="p-4 border-b">
        <ImageUploader />
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <p className="text-sm text-muted-foreground mb-4">Drag an image onto the canvas.</p>
        {status === 'loading' && <Loader2 className="mx-auto my-8 animate-spin text-primary" />}
        {status === 'succeeded' && images.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">No images found. Upload one to get started.</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {images.map(image => (
            <div key={image._id} className="relative group">
              <div
                ref={(ref: HTMLDivElement | null) => {
                  if(ref){
                    connectors.create(ref, <ImageComponent src={image.path} />)
                  }
                }}
                className="cursor-grab aspect-square bg-muted rounded-md overflow-hidden border hover:border-primary transition-all"
              >
                <img src={image.path} alt={image.filename} className="w-full h-full object-cover" />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(image._id)}
                aria-label="Delete image"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
