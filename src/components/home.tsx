"use client";

import { useSession, signOut } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { Search, Grid, List, Plus, Home, Users, Clock, Star, Trash2, Database, ChevronDown, Share, Download, Edit, Info, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { EditItemModal } from "@/components/EditItemModal";
import { ThemeToggle } from "@/components/theme-toggle";
import { ContentModal } from "@/components/ContentModal";
import { BookModal } from "@/components/BookModal";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DriveItem {
  _id: string;
  data: string;
  type: "book" | "content";
  title: string;
  thumbnail: string;
  modified?: string;
}

interface BookDetails {
  _id: string;
  title: string;
  thumbnail: string;
  contents: DriveItem[];
}

export default function DriveHome() {
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [items, setItems] = useState<DriveItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DriveItem | null>(null);
  const [sortBy, setSortBy] = useState<"title" | "modified">("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showContentModal, setShowContentModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);

  // Updated sorting function to handle undefined title and modified fields
  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "title") {
      const titleA = a.title || "";
      const titleB = b.title || "";
      return sortOrder === "asc" ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
    } else if (sortBy === "modified") {
      const modifiedA = a.modified ? new Date(a.modified).getTime() : 0;
      const modifiedB = b.modified ? new Date(b.modified).getTime() : 0;
      return sortOrder === "asc" ? modifiedA - modifiedB : modifiedB - modifiedA;
    }
    return 0;
  });

  const handleEditItem = async (item: DriveItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveItem = async (id: string, type: "book" | "content", data: any) => {
    try {
      const response = await fetch(`/api/drive`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, type, data }),
      });

      if (response.ok) {
        if (selectedBook && type === "content") {
          setSelectedBook({
            ...selectedBook,
            contents: selectedBook.contents.map((content) =>
              content._id === id ? { ...content, ...data } : content
            ),
          });
        } else {
          setItems(items.map((item) =>
            item._id === id ? { ...item, ...data } : item
          ));
        }
      } else {
        console.error("Failed to update item");
      }
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const fetchContentDetails = async (contentId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drive?contentId=${contentId}`);
      const data = await res.json();
      if (data.error) {
        console.error("Error fetching content:", data.error);
        return;
      }
      router.push(`/create?contentId=${contentId}`);
    } catch (error) {
      console.error("Failed to fetch content details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Updated delete handler to display 'Untitled' if title is undefined
  const handleDeleteItem = async (item: DriveItem) => {
    if (confirm(`Are you sure you want to delete "${item.title || 'Untitled'}"?`)) {
      try {
        const response = await fetch(`/api/drive`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: item._id,
            type: item.type,
          }),
        });

        if (response.ok) {
          if (selectedBook && item.type === "content") {
            setSelectedBook({
              ...selectedBook,
              contents: selectedBook.contents.filter((content) => content._id !== item._id),
            });
          } else {
            setItems(items.filter((i) => i._id !== item._id));
          }
        } else {
          console.error("Failed to delete item");
        }
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  // Fetch drive items and book details
  const fetchDriveItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drive");
      const data = await res.json();
      const books: DriveItem[] = data.books.map((book: any) => ({
        _id: book._id,
        type: "book",
        title: book.title,
        thumbnail: book.thumbnail,
        modified: new Date(book.createdAt).toLocaleDateString(),
        data: "",
      }));
      const contents: DriveItem[] = data.contents.map((content: any) => ({
        _id: content._id,
        type: "content",
        title: content.title,
        thumbnail: content.thumbnail,
        modified: new Date(content.createdAt).toLocaleDateString(),
        data: "",
      }));
      setItems([...books, ...contents]);
    } catch (error) {
      console.error("Failed to fetch drive items:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookDetails = async (bookId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drive?bookId=${bookId}`);
      const data = await res.json();
      const bookData = data.book;
      const bookDetails: BookDetails = {
        _id: bookData._id,
        title: bookData.title,
        thumbnail: bookData.thumbnail,
        contents: bookData.contents.map((content: any) => ({
          _id: content._id,
          type: "content",
          title: content.title,
          thumbnail: content.thumbnail,
          modified: new Date(content.createdAt).toLocaleDateString(),
          data: "",
        })),
      };
      setSelectedBook(bookDetails);
    } catch (error) {
      console.error("Failed to fetch book details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedBook) {
      fetchDriveItems();
    }
  }, [selectedBook]);

  const handleItemClick = (item: DriveItem) => {
    if (item.type === "book") {
      fetchBookDetails(item._id);
    } else {
      fetchContentDetails(item._id);
    }
  };

  // Updated handler to validate title before creating new items
  const handleCreateNewItem = async (data: any) => {
    if (!data.title) {
      console.error("Title is required for new items");
      return;
    }
    try {
      const response = await fetch("/api/drive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const newItem = await response.json();
        const formattedItem: DriveItem = {
          _id: newItem._id,
          type: data.type,
          title: newItem.title,
          thumbnail: newItem.thumbnail,
          modified: new Date(newItem.createdAt).toLocaleDateString(),
          data: "",
        };
        setItems([...items, formattedItem]);
      } else {
        console.error("Failed to create item");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Updated GridView to display 'Untitled' for undefined titles
  const GridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 rounded-lg">
      {sortedItems.map((item) => (
        <div
          key={item._id}
          className="flex flex-col shadow hover:shadow-md transition duration-200 hover:bg-gray-300 dark:hover:bg-slate-700 rounded-xl bg-white dark:bg-slate-800"
        >
          <div
            className="flex-1 p-4 cursor-pointer flex flex-col items-center justify-center"
            onClick={() => handleItemClick(item)}
          >
            <Image
              src={item.thumbnail}
              alt="File preview"
              width={120}
              height={120}
              className="w-full h-full object-contain opacity-100 rounded-xl"
            />
            <h3 className="mt-2 text-sm font-medium text-center truncate w-full dark:text-gray-200">
              {item.title || 'Untitled'}
            </h3>
            {item.modified && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.modified}</p>}
          </div>
          <div className="flex justify-between border-t border-gray-200 dark:border-slate-600 p-2 bg-gray-50 dark:bg-slate-700 rounded-b-xl">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditItem(item)}
              className="p-1 hover:scale-125 dark:text-gray-300 dark:hover:text-indigo-300"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteItem(item)}
              className="p-1 hover:scale-125"
            >
              <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  // Updated ListView to display 'Untitled' for undefined titles
  const ListView = () => (
    <table className="w-full">
      <thead>
        <tr className="border-b dark:border-slate-600">
          <th className="text-left p-3 text-sm font-medium dark:text-gray-300">Name</th>
          <th className="text-left p-3 text-sm font-medium dark:text-gray-300">Type</th>
          <th className="text-left p-3 text-sm font-medium dark:text-gray-300">Last modified</th>
          <th className="w-10"></th>
        </tr>
      </thead>
      <tbody>
        {sortedItems.map((item) => (
          <tr key={item._id} className="group hover:bg-gray-100 dark:hover:bg-slate-700">
            <td className="p-3 flex items-center gap-2 cursor-pointer dark:text-gray-200" onClick={() => handleItemClick(item)}>
              <Image src={item.thumbnail} alt="File icon" width={20} height={20} />
              <span>{item.title || 'Untitled'}</span>
            </td>
            <td className="p-3 cursor-pointer dark:text-gray-300" onClick={() => handleItemClick(item)}>
              {item.type === "book" ? "Folder" : "File"}
            </td>
            <td className="p-3 cursor-pointer dark:text-gray-300" onClick={() => handleItemClick(item)}>
              {item.modified}
            </td>
            <td className="p-3">
              <div className="invisible group-hover:visible">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 dark:text-gray-300 dark:hover:bg-slate-600">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="dark:bg-slate-800 dark:border-slate-700">
                    <DropdownMenuItem className="dark:text-gray-200 dark:hover:bg-slate-700">
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem className="dark:text-gray-200 dark:hover:bg-slate-700">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditItem(item); }} className="dark:text-gray-200 dark:hover:bg-slate-700">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteItem(item); }} className="text-red-500 dark:text-red-400 dark:hover:bg-slate-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* Top Navigation */}
      <header className="h-16 px-4 flex items-center justify-between gap-4 bg-gray-200 dark:bg-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <Image src="/ascii.png" alt="Lumo Creator" width={40} height={40} className="w-10" />
          <span className="text-lg dark:text-gray-200">Lumo Creator</span>
        </div>
        <div className="flex-1 max-w-3xl">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <Input type="search" placeholder="Search in Lumo Creator" className="w-full pl-10 h-12 rounded-lg border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 dark:placeholder-gray-400 mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-200 dark:bg-slate-800 rounded-xl">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-300 dark:hover:bg-slate-700">
                {session?.user?.image ? (
                  <Image src={session.user.image} alt="Profile" width={32} height={32} className="rounded-full" />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center rounded-full hover:scale-105 bg-gray-300 dark:bg-slate-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-100 dark:bg-slate-800 rounded-lg shadow-md border-gray-200 dark:border-slate-700">
              <div className="p-4">
                <div className="flex flex-col items-center justify-center gap-3">
                  {session?.user?.image ? (
                    <Image src={session.user.image} alt="Profile" width={40} height={40} className="rounded-full bg-gray-300 dark:bg-slate-700" />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-300 dark:bg-slate-700">
                      <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium dark:text-gray-200">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
              <DropdownMenuItem className="hover:scale-105 dark:text-gray-200 dark:hover:bg-slate-700" onClick={() => { /* Navigate to settings page */ }}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:scale-105 dark:text-gray-200 dark:hover:bg-slate-700" onClick={() => signOut({ callbackUrl: "https://lumo.aasciihub.com/" })}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex justify-center gap-2">
        {/* Sidebar */}
        <aside className="w-44 p-3 h-auto bg-gray-200 dark:bg-slate-800 rounded-xl mt-4">
          <div className="space-y-1 flex flex-col">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-24 self-center justify-center shadow-md rounded-full py-6 hover:bg-gray-300 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-white hover:scale-110">
                  <Plus className="h-5 w-5 mr-2" />
                  New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-200 dark:bg-slate-800 rounded-lg shadow-md border-gray-200 dark:border-slate-700">
                <DropdownMenuItem className="hover:bg-gray-300 hover:scale-105" onClick={() => setShowContentModal(true)}>
                  New Content
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-300 hover:scale-105" onClick={() => setShowBookModal(true)}>
                  New Book
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="mt-4">
              <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-gray-300 dark:hover:bg-slate-700 dark:text-gray-200 hover:scale-105" onClick={() => router.push("/home")}>
                <Home className="h-5 w-5" />
                Home
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-gray-300 dark:hover:bg-slate-700 dark:text-gray-200 hover:scale-105">
                <Database className="h-5 w-5" />
                My Books
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-gray-300 dark:hover:bg-slate-700 dark:text-gray-200 hover:scale-105">
                <Clock className="h-5 w-5" />
                Recent
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-gray-300 dark:hover:bg-slate-700 dark:text-gray-200 hover:scale-105">
                <Trash2 className="h-5 w-5" />
                Trash
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 rounded-2xl dark:bg-slate-800">
          {selectedBook ? (
            <div>
              <Button variant="ghost" onClick={() => setSelectedBook(null)} className="mb-4 dark:text-gray-200 dark:hover:bg-slate-800">
                ← Back
              </Button>
              {/* Updated book title rendering */}
              <h2 className="text-2xl mb-4 dark:text-gray-200">{selectedBook.title || 'Untitled'}</h2>
              {selectedBook.contents.length > 0 ? (
                <div>{viewMode === "list" ? <ListView /> : <GridView />}</div>
              ) : (
                <p className="dark:text-gray-300">No contents in this book.</p>
              )}
            </div>
          ) : (
            <div>
              <div className="bg-gray-100 dark:bg-slate-800 rounded-lg flex flex-col p-4 mb-4">
                <div className="flex items-center gap-4">
                  <p className="text-xl font-normal dark:text-gray-200 text-center">
                    Welcome back to your Project's, <span>{session?.user?.name}</span>!
                  </p>
                  <div className="ml-auto flex items-center gap-2 rounded-full p-1 bg-white dark:bg-slate-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-8 w-8 dark:text-gray-300 dark:hover:text-indigo-300"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-8 w-8 dark:text-gray-300 dark:hover:text-indigo-300"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-1">
                        Sort By <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-100 dark:bg-slate-800 rounded-lg shadow-md border-gray-200 dark:border-slate-700">
                      <DropdownMenuItem onClick={() => { setSortBy("title"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                        Title {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSortBy("modified"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                        Last Modified {sortBy === "modified" && (sortOrder === "asc" ? "↑" : "↓")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-slate-800 h-screen rounded-lg m-4 p-4">
                {loading ? <p className="dark:text-gray-300">Loading...</p> : viewMode === "list" ? <ListView /> : <GridView />}
              </div>
            </div>
          )}
        </main>
      </div>
      <EditItemModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        item={selectedItem}
        onSave={handleSaveItem}
      />
      <ContentModal
        open={showContentModal}
        onOpenChange={setShowContentModal}
        onSave={handleCreateNewItem}
      />
      <BookModal
        open={showBookModal}
        onOpenChange={setShowBookModal}
        onSave={handleCreateNewItem}
      />
    </div>
  );
}