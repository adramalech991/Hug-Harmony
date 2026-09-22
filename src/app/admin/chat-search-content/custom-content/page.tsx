import { getInfoContent } from "@/actions/admin/help-center";
import InfoContentManager from "@/components/admin/InfoContentManager";
import Link from "next/link";
import { LayoutDashboard, FileText, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminCustomContentPage() {
    const res = await getInfoContent();
    const contents = res.success ? res.data : [];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
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
                <Link
                    href="/admin/chat-search-content"
                    className="hover:text-black transition-colors"
                >
                    Chat Search Content
                </Link>
                <span>/</span>
                <span className="text-black font-medium">Custom Content</span>
            </nav>

            {/* Header */}
            <Card className="bg-gradient-to-r from-[#F3CFC6] to-[#C4C4C4] text-black shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8" />
                            <div>
                                <CardTitle className="text-3xl font-bold">Custom Content</CardTitle>
                                <p className="text-sm opacity-80">
                                    Manage informational pages, terms, and platform policies.
                                </p>
                            </div>
                        </div>
                        <Link href="/admin/chat-search-content">
                            <Button variant="ghost" className="text-black hover:bg-white/20">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Content
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
            </Card>

            <InfoContentManager initialContents={contents || []} />
        </div>
    );
}
