// @/components/layout/DriveHeader.tsx
"use client";

import React from "react";
import { ChevronRight, LayoutGrid, List, Plus, Folder, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setViewMode } from "@/app/store/slices/viewSlice";
import { RootState } from "@/app/store/store";

interface Breadcrumb {
  id: string | null;
  title: string;
}

interface DriveHeaderProps {
  breadcrumbs: Breadcrumb[];
  onBreadcrumbClick: (crumbId: string | null, index: number) => void;
  onNewContent: () => void;
  // --- REFACTOR: Renamed prop ---
  onNewCollection: () => void;
}

// --- REFACTOR: Updated component signature ---
export function DriveHeader({ breadcrumbs, onBreadcrumbClick, onNewContent, onNewCollection }: DriveHeaderProps) {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state: RootState) => state.view.viewMode);

  return (
    <header className="flex-shrink-0 p-4 sm:p-6 border-b flex items-center justify-between gap-4">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id || "root"}>
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            <Button
              variant="ghost"
              size="sm"
              className={`px-2 h-9 text-base font-medium truncate ${
                index === breadcrumbs.length - 1 ? "text-foreground cursor-default" : "text-muted-foreground"
              }`}
              onClick={() => onBreadcrumbClick(crumb.id, index)}
              disabled={index === breadcrumbs.length - 1}
            >
              {crumb.title}
            </Button>
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="hidden sm:flex items-center">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => dispatch(setViewMode("grid"))}
            aria-label="Grid View"
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => dispatch(setViewMode("list"))}
            aria-label="List View"
          >
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
            <DropdownMenuItem onSelect={onNewContent} className="gap-2 cursor-pointer">
              <FileText className="h-4 w-4 text-primary" /> New Content
            </DropdownMenuItem>
            {/* --- REFACTOR: Updated text and handler --- */}
            <DropdownMenuItem onSelect={onNewCollection} className="gap-2 cursor-pointer">
              <Folder className="h-4 w-4 text-blue-500" /> New Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
