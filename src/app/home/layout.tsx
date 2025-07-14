"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Simple cn utility for merging class names
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

const navigation = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Trash", href: "/home/trash", icon: Trash2 },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="h-screen w-full flex items-center justify-center bg-background"></div>;
  }
  
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar - visible on medium screens and up */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r border-border bg-muted/20">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="px-4 mb-4">
             <h1 className="text-2xl font-bold text-primary">My Drive</h1>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  (pathname === item.href)
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 flex-shrink-0 h-5 w-5",
                    (pathname === item.href)
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Bottom Navigation Bar - visible on small screens */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around z-10">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center p-2 text-xs font-medium transition-colors",
               (pathname === item.href)
                ? "text-primary bg-muted/50"
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            <item.icon className="h-5 w-5 mb-0.5" aria-hidden="true" />
            <span>{item.name}</span>
          </Link>
        ))}
        {/* Add padding to content to avoid overlap with bottom bar */}
        <div className="pb-16"></div>
      </nav>
    </div>
  );
}
