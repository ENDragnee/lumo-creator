// @/components/cards/BookCardList.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Folder, FileText, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IBook {
  _id: string;
  title: string;
  updatedAt: string | Date;
  contentCount?: number;
}

interface BookCardListProps {
  item: IBook;
  index: number;
  onItemClick: (id: string) => void;
  onOpenActions: (e: React.MouseEvent, item: IBook & { type: 'book' }) => void;
}

export function BookCardList({ item, index, onItemClick, onOpenActions }: BookCardListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className="w-full"
    >
      <div
        onClick={() => onItemClick(item._id)}
        className="group flex items-center p-2.5 w-full cursor-pointer transition-colors duration-200 rounded-lg hover:bg-muted/50"
      >
        <div className="flex-shrink-0 w-10 h-10 mr-4 bg-muted rounded-lg flex items-center justify-center">
          <Folder className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate" title={item.title}>
            {item.title}
          </p>
          <p className="text-xs text-muted-foreground truncate" title={`Modified: ${new Date(item.updatedAt).toLocaleString()}`}>
            Modified: {new Date(item.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-4 mx-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>{item.contentCount ?? 0} items</span>
          </div>
        </div>
        <div className="ml-auto opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
           <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-8 w-8"
                onClick={(e) => onOpenActions(e, { ...item, type: 'book' } )}
            >
              <MoreVertical className="h-4 w-4" />
           </Button>
        </div>
      </div>
    </motion.div>
  );
}
