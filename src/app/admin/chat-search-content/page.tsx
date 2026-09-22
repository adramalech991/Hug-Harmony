"use client";
import Link from "next/link";
import { MessageCircle, FileText, ArrowRight, LayoutDashboard, ArrowLeft, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminChatSearchContentPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-7xl mx-auto space-y-6"
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-black/60 mb-2">
        <Link
          href="/admin/dashboard"
          className="flex items-center hover:text-black transition-colors"
        >
          <LayoutDashboard className="h-4 w-4 mr-1" />
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-black font-medium">Chat Search Content</span>
      </nav>

      {/* Header */}
      <Card className="bg-gradient-to-r from-[#F3CFC6] to-[#C4C4C4] text-black shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-8 w-8" />
              <div>
                <CardTitle className="text-3xl font-bold">Chat Search Content</CardTitle>
                <p className="text-sm opacity-80">
                  Manage FAQs and Custom Informational Content.
                </p>
              </div>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="ghost" className="text-black hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FAQs Card */}
        <Link href="/admin/chat-search-content/faqs" className="block group">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-[#E7C4BB]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#E7C4BB]/20 flex items-center justify-center text-[#E7C4BB]">
                  <MessageCircle className="h-6 w-6" />
                </div>
                FAQs
              </CardTitle>
              <CardDescription>
                Manage frequently asked questions, answers, and display order for search.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm font-medium text-[#E7C4BB] group-hover:underline">
                Manage FAQs <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Custom Content Card */}
        <Link href="/admin/chat-search-content/custom-content" className="block group">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <FileText className="h-6 w-6" />
                </div>
                Custom Content
              </CardTitle>
              <CardDescription>
                Create and manage custom informational pages and policies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm font-medium text-blue-500 group-hover:underline">
                Manage Custom Content <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </motion.div>
  );
}
