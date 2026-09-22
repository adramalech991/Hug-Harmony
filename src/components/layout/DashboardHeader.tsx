// components/DashboardHeader.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Keyboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import NotificationsDropdown from "@/components/NotificationsDropdown";

export default function DashboardHeader() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Keyboard shortcut handler (/ to focus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not already in an input/textarea
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Escape to clear and blur
      if (
        e.key === "Escape" &&
        document.activeElement === searchInputRef.current
      ) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle search submission (Enter key)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      searchInputRef.current?.blur();
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  return (
    <header className="flex h-14 items-center gap-3 md:gap-4 border-b bg-white px-3 md:px-4 lg:px-6 sticky top-0 z-20">
      {/* Centered Search Bar - takes available space and centers */}
      <form onSubmit={handleSearch} className="flex-1 max-w-none lg:max-w-2xl lg:mx-auto">
        <div className="relative">
          <Search
            className="absolute left-3 md:left-4 top-1/2 h-4 w-4 md:h-5 md:w-5 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search everything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 md:pl-12 pr-9 md:pr-12 h-9 md:h-10 text-sm md:text-base rounded-md border bg-white shadow-sm focus:ring-2 focus:ring-[var(--brand-pink)]/50 w-full"
            data-search-input
            aria-label="Search everything"
          />
          {/* Right side container - either shows clear button OR keyboard hint */}
          <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 flex items-center">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden="true" />
              </button>
            ) : (
              <div className="hidden lg:flex items-center text-xs text-muted-foreground">
                <Keyboard className="h-3 w-3 mr-1" aria-hidden="true" />
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                  /
                </kbd>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Right side - Notifications and Home */}
      <div className="hidden lg:flex items-center gap-2 md:gap-4 flex-shrink-0">
        <NotificationsDropdown />

        <Link
          href="/dashboard"
          className="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-md border bg-white shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Image
            src="/hh-icon.png"
            alt="Dashboard Home"
            width={24}
            height={24}
            className="h-5 w-5 md:h-6 md:w-6 object-contain"
          />
        </Link>
      </div>
    </header>
  );
}
