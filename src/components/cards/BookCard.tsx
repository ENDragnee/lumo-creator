"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Folder, FileText } from "lucide-react";

// This interface should match the book data structure used on your home page.
interface BookCardProps {
  item: {
    _id: string;
    title: string;
    updatedAt: string;
    contentCount?: number; // The number of items inside the book
  };
  index: number; // For staggering animations
  onItemClick: (id: string) => void; // Function to handle navigation into the book
}

export function BookCard({ item, index, onItemClick }: BookCardProps) {
  return (
    <motion.div
      // Staggered animation for a pleasant loading effect
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3, ease: "easeOut" }}
      className="h-full w-full"
    >
      <Card
        onClick={() => onItemClick(item._id)}
        className="w-full h-full cursor-pointer transition-all duration-300 overflow-hidden group relative bg-background border hover:shadow-lg hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onItemClick(item._id);
          }
        }}
      >
        <CardContent className="p-4 flex flex-col h-full justify-between">
          {/* Top Section: Icon and Title */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-800/50">
                <Folder className="w-7 h-7 text-blue-500 dark:text-blue-400" />
              </div>
              <p
                title={item.title}
                className="text-base font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors"
              >
                {item.title}
              </p>
            </div>
          </div>

          {/* Bottom Section: Metadata */}
          <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5" title={`${item.contentCount ?? 0} items inside`}>
              <FileText className="w-3.5 h-3.5" />
              <span>{item.contentCount ?? 0} items</span>
            </div>
            <span title={`Last updated on ${new Date(item.updatedAt).toLocaleString()}`}>
              {new Date(item.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
