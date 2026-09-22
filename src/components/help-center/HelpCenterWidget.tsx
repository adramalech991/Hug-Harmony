"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageCircle,
  Search,
  ChevronLeft,
  FileText,
  ChevronRight,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFAQs, searchChatContent } from "@/actions/help-center";
import { useDebounce } from "use-debounce";
import { motion, AnimatePresence } from "framer-motion";

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

type InfoContent = {
  id: string;
  key?: string | null;
  title: string;
  content: string;
};

export default function HelpCenterWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<{
    faqs: FAQ[];
    contents: InfoContent[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedContent, setSelectedContent] = useState<InfoContent | null>(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState("");

  const contentRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initial Fetch
  useEffect(() => {
    const fetchInitial = async () => {
      const res = await getFAQs();
      if (res.success && res.data) {
        setFaqs(res.data);
      }
    };
    fetchInitial();
  }, []);

  // Search Effect
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults(null);
        return;
      }
      setIsSearching(true);
      const res = await searchChatContent(debouncedQuery);
      if (res.success && res.data) {
        setSearchResults(res.data);
      }
      setIsSearching(false);
    };
    performSearch();
  }, [debouncedQuery]);

  // Highlight text and return HTML with highlighted matches
  const highlightText = useCallback((html: string, query: string): string => {
    if (!query.trim()) return html;

    const words = query
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 2);
    if (words.length === 0) return html;

    const pattern = words
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");

    const regex = new RegExp(`(${pattern})`, "gi");

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    const highlightTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (regex.test(text)) {
          const span = document.createElement("span");
          span.innerHTML = text.replace(
            regex,
            '<mark class="bg-yellow-200 text-yellow-900 rounded px-0.5 highlight-match">$1</mark>',
          );
          node.parentNode?.replaceChild(span, node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = (node as Element).tagName.toLowerCase();
        if (tagName !== "script" && tagName !== "style") {
          Array.from(node.childNodes).forEach(highlightTextNodes);
        }
      }
    };

    Array.from(tempDiv.childNodes).forEach(highlightTextNodes);
    return tempDiv.innerHTML;
  }, []);

  // Scroll to first highlight
  useEffect(() => {
    if (selectedContent && activeSearchQuery) {
      const timer = setTimeout(() => {
        const firstHighlight =
          contentRef.current?.querySelector(".highlight-match");
        if (firstHighlight && scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector(
            "[data-radix-scroll-area-viewport]",
          );
          if (scrollContainer) {
            const highlightRect = firstHighlight.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();

            const scrollTop =
              highlightRect.top -
              containerRect.top +
              scrollContainer.scrollTop -
              100;

            scrollContainer.scrollTo({
              top: Math.max(0, scrollTop),
              behavior: "smooth",
            });

            firstHighlight.classList.add("animate-pulse-highlight");
            setTimeout(() => {
              firstHighlight.classList.remove("animate-pulse-highlight");
            }, 2000);
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedContent, activeSearchQuery]);

  const handleContentClick = (content: InfoContent) => {
    setActiveSearchQuery(searchQuery);
    setSelectedContent(content);
  };

  const handleBack = () => {
    setSelectedContent(null);
    setActiveSearchQuery("");
  };

  const getHighlightedContent = useCallback(() => {
    if (!selectedContent) return "";
    return highlightText(selectedContent.content, activeSearchQuery);
  }, [selectedContent, activeSearchQuery, highlightText]);

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-highlight {
          0%,
          100% {
            background-color: rgb(254 240 138);
            box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4);
          }
          50% {
            background-color: rgb(250 204 21);
            box-shadow: 0 0 0 4px rgba(234, 179, 8, 0);
          }
        }
        .animate-pulse-highlight {
          animation: pulse-highlight 0.6s ease-in-out 3;
        }
      `}</style>

      {/* Floating Button / Widget Container */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-zinc-900 w-[400px] h-[600px] max-h-[80vh] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b bg-[#F3CFC6] dark:bg-[#5a4845] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 font-semibold text-black dark:text-white">
                  {selectedContent ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        className="h-8 w-8 hover:bg-black/10 rounded-full"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <span className="truncate max-w-[200px] text-sm">{selectedContent.title}</span>
                    </div>
                  ) : (
                    <>
                      <MessageCircle className="h-5 w-5" />
                      <span>Help Center</span>
                    </>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 hover:bg-black/10 rounded-full text-black dark:text-white"
                >
                  <Minimize2 className="h-5 w-5" />
                  <span className="sr-only">Minimize</span>
                </Button>
              </div>

              {/* Header Search (Conditioned) */}
              {!selectedContent && (
                <div className="p-4 border-b bg-gray-50/50 dark:bg-zinc-800/50 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-9 bg-white dark:bg-zinc-800 border-gray-200 dark:border-gray-700"
                      placeholder="Search for help..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Content Area */}
              <div className="flex-1 min-h-0 relative bg-white dark:bg-zinc-950">
                <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
                  <div className="p-5">
                    {selectedContent ? (
                      // Content View
                      <div className="space-y-4">
                        <div
                          ref={contentRef}
                          className="prose prose-sm max-w-none dark:prose-invert"
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html: getHighlightedContent(),
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      // Main Menu / Search Results
                      <div className="space-y-6">
                        {searchQuery.trim().length > 0 ? (
                          <div className="space-y-6">
                            {isSearching ? (
                              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                                <span className="text-sm">Searching...</span>
                              </div>
                            ) : (
                              <>
                                {/* Results: Info Contents */}
                                {(searchResults?.contents || []).length > 0 && (
                                  <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pages</h3>
                                    <div className="space-y-1">
                                      {searchResults?.contents.map((content) => (
                                        <button
                                          key={content.id}
                                          onClick={() => handleContentClick(content)}
                                          className="w-full flex items-center justify-between p-3 rounded-lg border border-transparent hover:bg-gray-50 dark:hover:bg-zinc-900 hover:border-gray-100 transition-all text-left group"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                                              <FileText className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <span className="font-medium text-sm block truncate text-foreground">{content.title}</span>
                                            </div>
                                          </div>
                                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Results: FAQs */}
                                {(searchResults?.faqs || []).length > 0 && (
                                  <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">FAQs</h3>
                                    <Accordion type="single" collapsible className="w-full">
                                      {searchResults?.faqs.map((faq) => (
                                        <AccordionItem key={faq.id} value={faq.id} className="border-b-0">
                                          <AccordionTrigger className="text-sm py-2 hover:no-underline px-2 hover:bg-muted/50 rounded-md">
                                            {faq.question}
                                          </AccordionTrigger>
                                          <AccordionContent className="text-sm text-muted-foreground px-2">
                                            {faq.answer}
                                          </AccordionContent>
                                        </AccordionItem>
                                      ))}
                                    </Accordion>
                                  </div>
                                )}

                                {/* No Results */}
                                {(!searchResults?.contents?.length && !searchResults?.faqs?.length) && (
                                  <div className="text-center py-10 text-muted-foreground text-sm">
                                    No results found for &quot;{searchQuery}&quot;
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          /* Default State: Common FAQs */
                          <div className="space-y-4">
                            <div className="text-sm font-medium text-foreground">Common Questions</div>
                            <Accordion type="single" collapsible className="w-full">
                              {faqs.map((faq) => (
                                <AccordionItem key={faq.id} value={faq.id}>
                                  <AccordionTrigger className="text-sm text-left hover:no-underline">
                                    {faq.question}
                                  </AccordionTrigger>
                                  <AccordionContent className="text-sm text-muted-foreground">
                                    {faq.answer}
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                            {faqs.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground text-sm">
                                Loading help topics...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Footer */}
              <div className="p-3 border-t bg-gray-50 dark:bg-zinc-900 text-center">
                <p className="text-xs text-muted-foreground">
                  Can&apos;t find what you need? <Button variant="link" className="h-auto p-0 text-[#E7C4BB]">Contact Support</Button>
                </p>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button */}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-xl bg-[#E7C4BB] hover:bg-[#d4a8a0] text-black transition-all"
              onClick={() => setIsOpen(true)}
            >
              <MessageCircle className="h-7 w-7" />
            </Button>
          </motion.div>
        )}
      </div>
    </>
  );
}
