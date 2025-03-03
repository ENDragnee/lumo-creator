"use client";

import { useSession, signOut } from "next-auth/react";
import React, { useEffect, useState } from "react";
import {
  Search,
  Grid,
  List,
  Plus,
  Home,
  Users,
  Clock,
  Star,
  Trash2,
  Database,
  ChevronDown,
  Share,
  Download,
  Edit,
  Info,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DriveItem {
  _id: string;
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
  const fetchContentDetails = async (contentId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drive?contentId=${contentId}`);
      const data = await res.json();
      console.log(data);
      if (data.error) {
        console.error("Error fetching content:", data.error);
        return;
      }
      // Navigate to the creator page with the contentId as a query parameter.
      router.push(`/create?contentId=${contentId}`);
    } catch (error) {
      console.error("Failed to fetch content details:", error);
    } finally {
      setLoading(false);
    }
  };
  

  // Fetch root drive items (both books and standalone contents)
  const fetchDriveItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drive");
      const data = await res.json();
      // data: { books: [...], contents: [...] }
      const books: DriveItem[] = data.books.map((book: any) => ({
        _id: book._id,
        type: "book",
        title: book.title,
        thumbnail: book.thumbnail,
        modified: new Date(book.createdAt).toLocaleDateString(),
      }));
      const contents: DriveItem[] = data.contents.map((content: any) => ({
        _id: content._id,
        type: "content",
        title: content.title,
        thumbnail: content.thumbnail,
        modified: new Date(content.createdAt).toLocaleDateString(),
      }));
      setItems([...books, ...contents]);
    } catch (error) {
      console.error("Failed to fetch drive items:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch details of a book (populated with its contents)
  const fetchBookDetails = async (bookId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drive?bookId=${bookId}`);
      const data = await res.json();
      // data: { book: { ... } }
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
      // For a content file, fetch the content details and navigate to the creator page.
      fetchContentDetails(item._id);
    }
  };
  
  const GridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
      {items.map((item) => (
        <div
          key={item._id}
          onClick={() => handleItemClick(item)}
          className={`group relative cursor-pointer aspect-square rounded-lg`}
        >
          {/* Star Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Star className="h-4 w-4" />
          </Button>

          {/* Edit Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 left-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit className="h-4 w-4" />
          </Button>

          {/* File Preview */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <Image
              src={`${item.thumbnail}`}
              alt="File preview"
              width={100}
              height={100}
              className="w-full h-full object-contain opacity-50"
            />
          </div>

          {/* File Info */}
          <div className={`absolute bottom-0 left-0 right-0 p-3 `}>
            <h3 className="text-sm font-medium truncate">{item.title}</h3>
            {item.modified && <p className="text-xs opacity-75 mt-0.5">{item.modified}</p>}
          </div>
        </div>
      ))}
    </div>
  );

  const ListView = () => (
    <table className="w-full">
      <thead>
        <tr className={`border-b`}>
          <th className={`text-left p-3 text-sm font-medium`}>
            Name
          </th>
          <th className={`text-left p-3 text-sm font-medium`}>
            Type
          </th>
          <th className={`text-left p-3 text-sm font-medium`}>
            Last modified
          </th>
          <th className="w-10"></th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr
            key={item._id}
            onClick={() => handleItemClick(item)}
            className={`group cursor-pointer`}
          >
            <td className="p-3 flex items-center gap-2">
              <Image
                src={`${item.thumbnail}`}
                alt="File icon"
                width={20}
                height={20}
              />
              <span>{item.title}</span>
            </td>
            <td className="p-3">{item.type === "book" ? "Folder" : "File"}</td>
            <td className={`p-3`}>{item.modified}</td>
            <td className="p-3">
              <div className="invisible group-hover:visible">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
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
    <div className={`min-h-screen`}>
      {/* Top Navigation */}
      <header
        className={`h-16 px-4 flex items-center justify-between gap-4 border-b`}
      >
        <div className="flex items-center gap-2">
          <Image src="/ascii.png" alt="Lumo Creator" width={40} height={40} className="w-10" />
          <span className={`text-lg`}>Lumo Creator</span>
        </div>

        <div className="flex-1 max-w-3xl">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search in Lumo Creator"
              className={`w-full pl-10 h-12 rounded-lg`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">

          {/* Updated User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center rounded-full">
                    <span className="text-sm font-medium text-gray-700">
                      {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center rounded-full">
                      <span className="text-lg font-medium text-gray-700">
                        {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500">{session?.user?.email}</p>
                  </div>
                    <ThemeToggle />
                </div>
              </div>
              <DropdownMenuItem onClick={() => { /* Navigate to settings page */ }}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "https://lumo.aasciihub.com/" })}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`w-60 p-3 h-[calc(100vh-4rem)]`}>
          <div className="space-y-1">
            <Button
              className={`w-32 shadow-sm rounded-full py-6`}
              onClick={() => router.push("/create")}
            >
              <Plus className="h-5 w-5 mr-2" />
              New
            </Button>

            <div className="mt-4">
              <Button variant="ghost" className={`w-full justify-start gap-2`}>
                <Home className="h-5 w-5" />
                Home
              </Button>
              <Button variant="ghost" className={`w-full justify-start gap-2`}>
                <Database className="h-5 w-5" />
                My Project
              </Button>
              <Button variant="ghost" className={`w-full justify-start gap-2`}>
                <Users className="h-5 w-5" />
                Shared with me
              </Button>
              <Button variant="ghost" className={`w-full justify-start gap-2`}>
                <Clock className="h-5 w-5" />
                Recent
              </Button>
              <Button variant="ghost" className={`w-full justify-start gap-2`}>
                <Star className="h-5 w-5" />
                Starred
              </Button>
              <Button variant="ghost" className={`w-full justify-start gap-2`}>
                <Trash2 className="h-5 w-5" />
                Trash
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4">
          {selectedBook ? (
            <div>
              <Button variant="ghost" onClick={() => setSelectedBook(null)} className="mb-4">
                ← Back
              </Button>
              <h2 className="text-2xl mb-4">{selectedBook.title}</h2>
              {selectedBook.contents.length > 0 ? (
                <div>
                  {viewMode === "list" ? <ListView /> : <GridView />}
                </div>
              ) : (
                <p>No contents in this book.</p>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="ghost"
                  className={`font-normal text-xl pl-0 hover:bg-transparent`}
                >
                  My Project
                  <ChevronDown className="h-5 w-5 ml-1" />
                </Button>

                <div className={`ml-auto flex items-center gap-2 rounded-full p-1`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-full h-8 w-8 ${viewMode === "list"}`}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-full h-8 w-8 ${viewMode === "grid"}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Info className={`h-5 w-5}`} />
                </Button>
              </div>

              <div className="flex gap-2 mb-4">
                <Button variant="outline">
                  Tag
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline">
                  People
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline">
                  Modified
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <div>
                {loading ? <p>Loading...</p> : viewMode === "list" ? <ListView /> : <GridView />}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
