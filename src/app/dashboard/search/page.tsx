"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  X,
  Briefcase,
  MessageSquare,
  Calendar,
  ShoppingBag,
  Star,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  Keyboard,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface SearchResult {
  id: string;
  type: "user" | "professional" | "post" | "message" | "appointment" | "merchandise" | "review";
  title: string;
  subtitle?: string;
  description?: string;
  image?: string | null;
  metadata?: {
    rating?: number;
    price?: number;
    location?: string;
    conversationId?: string;
    professional?: {
      id: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  createdAt: string | Date;
}

interface SearchResponse {
  results: SearchResult[];
  counts: Record<string, number>;
  total: number;
  query: string;
  type: string;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const typeConfig = {
  all: { label: "All", icon: Search, color: "bg-gray-500" },
  users: { label: "Users", icon: Users, color: "bg-blue-500" },
  professionals: { label: "Professionals", icon: Briefcase, color: "bg-purple-500" },
  posts: { label: "Posts", icon: FileText, color: "bg-green-500" },
  messages: { label: "Messages", icon: MessageSquare, color: "bg-yellow-500" },
  appointments: { label: "Appointments", icon: Calendar, color: "bg-red-500" },
  merchandise: { label: "Merchandise", icon: ShoppingBag, color: "bg-orange-500" },
  reviews: { label: "Reviews", icon: Star, color: "bg-pink-500" },
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

function SearchPageContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize from URL parameters
  const getUrlParam = (key: string) => searchParams.get(key) || "";

  const [searchQuery, setSearchQuery] = useState(getUrlParam("q"));
  const [activeType, setActiveType] = useState<string>(getUrlParam("type") || "all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // Perform search
  const performSearch = useCallback(
    async (query: string, type: string, pageNum: number = 1) => {
      if (!query || query.trim().length < 2) {
        setResults([]);
        setHasSearched(false);
        setCounts({});
        return;
      }

      setLoading(true);
      setHasSearched(true);

      try {
        const params = new URLSearchParams({
          q: query.trim(),
          type: type,
          page: pageNum.toString(),
          limit: "20",
        });

        const response = await fetch(`/api/search?${params}`);
        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data: SearchResponse = await response.json();
        setResults(data.results);
        setCounts(data.counts);
        setTotalPages(data.pagination.totalPages);
        setPage(pageNum);
      } catch (error) {
        console.error("Search error:", error);
        toast.error("Failed to perform search");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Core effect: Sync state with URL and trigger search
  useEffect(() => {
    const q = getUrlParam("q");
    const type = getUrlParam("type") || "all";
    const p = parseInt(getUrlParam("page") || "1", 10);

    setSearchQuery(q);
    setActiveType(type);
    setPage(p);

    if (q.length >= 2) {
      performSearch(q, type, p);
    } else {
      setResults([]);
      setHasSearched(false);
      setCounts({});
    }
  }, [searchParams, performSearch]);

  // Keyboard shortcut handler (/ to focus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
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

  // Handle input changes with a debounce to update the URL
  useEffect(() => {
    if (searchQuery.length === 0 && getUrlParam("q")) {
      router.push("/dashboard/search");
      return;
    }

    if (searchQuery.length >= 2 && searchQuery !== getUrlParam("q")) {
      const timer = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("q", searchQuery);
        params.set("page", "1"); // Reset page on new search
        router.push(`/dashboard/search?${params.toString()}`);
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, router]);

  // Handle type change
  const handleTypeChange = (newType: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", newType);
    params.set("page", "1");
    router.push(`/dashboard/search?${params.toString()}`);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      performSearch(searchQuery, activeType, newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case "user":
        router.push(`/dashboard/users/${result.id}`);
        break;
      case "professional":
        router.push(`/dashboard/professionals/${result.id}`);
        break;
      case "post":
        router.push(`/dashboard/forum/${result.id}`);
        break;
      case "message":
        router.push(`/dashboard/messaging/${result.metadata?.conversationId}`);
        break;
      case "appointment":
        router.push(`/dashboard/appointments/${result.id}`);
        break;
      case "merchandise":
        router.push(`/dashboard/merchandise/${result.id}`);
        break;
      case "review":
        router.push(`/dashboard/professionals/${result.metadata?.professional?.id}`);
        break;
    }
  };

  // Format date
  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - d.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  // Get result icon
  const getResultIcon = (type: string) => {
    const config = typeConfig[type as keyof typeof typeConfig];
    return config?.icon || Search;
  };

  // Unauthenticated
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <motion.div
      className="space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Search</h1>
          <p className="text-muted-foreground mt-1">
            Search across all content in the platform
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search users, professionals, posts, messages...  "
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (searchQuery.trim().length >= 2) {
                  router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }
            }}
            className="pl-12 pr-12 h-12 text-lg rounded-lg border bg-white shadow-sm focus:ring-2 focus:ring-[#F3CFC6]/50"
            data-search-input
            aria-label="Search everything"
          />
          {/* Right side container - either shows clear button OR keyboard hint */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setResults([]);
                  setHasSearched(false);
                  router.push("/dashboard/search");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center text-xs text-muted-foreground">
                <Keyboard className="h-3 w-3 mr-1" aria-hidden="true" />
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                  /
                </kbd>
              </div>
            )}
          </div>
        </div>

        {/* Type Filter Tabs */}
        <Tabs value={activeType} onValueChange={handleTypeChange}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            {Object.entries(typeConfig).map(([key, config]) => {
              const Icon = config.icon;
              const count = counts[key] || 0;
              return (
                <TabsTrigger key={key} value={key} className="relative">
                  <Icon className="h-4 w-4 mr-2" />
                  {config.label}
                  {hasSearched && count > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 min-w-[20px] px-1.5 text-xs"
                    >
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasSearched && results.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search query or filters
            </p>
          </CardContent>
        </Card>
      ) : hasSearched && results.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {counts[activeType] || results.length} result
              {(counts[activeType] || results.length) !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {results.map((result) => {
                const Icon = getResultIcon(result.type);
                return (
                  <motion.div
                    key={`${result.type}-${result.id}`}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleResultClick(result)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Avatar/Icon */}
                          {result.image ? (
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={result.image} />
                              <AvatarFallback>
                                <Icon className="h-6 w-6" />
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div
                              className={`h-12 w-12 rounded-full flex items-center justify-center ${typeConfig[result.type as keyof typeof typeConfig]?.color || "bg-gray-500"} text-white`}
                            >
                              <Icon className="h-6 w-6" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg truncate">
                                    {result.title}
                                  </h3>
                                  <Badge variant="outline" className="text-xs">
                                    {typeConfig[result.type as keyof typeof typeConfig]?.label}
                                  </Badge>
                                </div>
                                {result.subtitle && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {result.subtitle}
                                  </p>
                                )}
                                {result.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {result.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Metadata */}
                            {result.metadata && (
                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                {result.metadata.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    {result.metadata.rating}
                                  </div>
                                )}
                                {result.metadata.price && (
                                  <span>${Number(result.metadata.price).toFixed(2)}</span>
                                )}
                                {result.metadata.location && (
                                  <span>{String(result.metadata.location)}</span>
                                )}
                                <span>{formatDate(result.createdAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start searching</h3>
            <p className="text-muted-foreground">
              Enter at least 2 characters to search across all content
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Search</h1>
            <p className="text-muted-foreground mt-1">
              Search across all content in the platform
            </p>
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}