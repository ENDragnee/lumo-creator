// @/types/drive.ts

// This interface covers all properties needed by the Home page, Edit modal, and Delete modal for Books.
export interface HomePageBook {
  _id: string;
  type: 'book';
  title: string;
  description?: string;
  tags?: string[];
  genre?: string;
  updatedAt: string;
  contentCount?: number;
}

// This interface covers all properties needed for Content items.
export interface HomePageContent {
  _id: string;
  type: 'content';
  title: string;
  thumbnail: string;
  tags?: string[];
  lastModifiedAt?: string;
  createdAt: string;
}

// This is the single source of truth for what a "DriveItem" is.
export type DriveItem = HomePageBook | HomePageContent;
