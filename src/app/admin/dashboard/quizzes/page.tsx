"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    ClipboardCheck,
    Search,
    Plus,
    Edit,
    Trash2,
    Calendar,
    Eye,
    EyeOff,
    MoreVertical,
    Filter,
    FileText,
    ArrowLeft,
    LayoutDashboard,
    FileQuestion,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Quiz {
    id: string;
    title: string;
    description?: string;
    isActive: boolean;
    isProOnboarding: boolean;
    createdAt: string;
    _count: {
        questions: number;
    };
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function QuizzesPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">(
        "all"
    );
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/quizzes");
            if (!res.ok) throw new Error("Failed to load quizzes");
            const data = await res.json();
            setQuizzes(data);
        } catch {
            toast.error("Failed to load quizzes");
        } finally {
            setLoading(false);
        }
    };

    const toggleActive = async (id: string) => {
        const quiz = quizzes.find((q) => q.id === id);
        if (!quiz) return;

        try {
            const res = await fetch(`/api/admin/quizzes/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !quiz.isActive }),
            });
            if (!res.ok) throw new Error();
            toast.success(
                quiz.isActive ? "Quiz unpublished" : "Quiz published successfully"
            );
            fetchQuizzes();
        } catch {
            toast.error("Failed to update status");
        }
    };

    const deleteQuiz = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/quizzes/${deleteId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error();
            toast.success("Quiz deleted successfully");
            fetchQuizzes();
        } catch {
            toast.error("Failed to delete quiz");
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const filtered = quizzes.filter((q) => {
        const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && q.isActive) ||
            (statusFilter === "draft" && !q.isActive);
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: quizzes.length,
        published: quizzes.filter((q) => q.isActive).length,
        onboarding: quizzes.filter((q) => q.isProOnboarding).length,
    };

    return (
        <motion.div
            className="space-y-6 max-w-7xl mx-auto p-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
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
                <span className="text-black font-medium">Training Quizzes</span>
            </nav>

            <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-r from-[#F3CFC6] to-[#C4C4C4] shadow-lg border-0">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <Link href="/admin/dashboard">
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/10">
                                        <ArrowLeft className="h-6 w-6 text-black" />
                                    </Button>
                                </Link>
                                <div>
                                    <CardTitle className="flex items-center text-2xl text-black">
                                        <FileQuestion className="mr-3 h-7 w-7" />
                                        Certification Quizzes
                                    </CardTitle>
                                    <p className="text-sm text-black/70 mt-1">
                                        Manage knowledge assessments for professionals
                                    </p>
                                </div>
                            </div>
                            <Button
                                asChild
                                className="bg-black hover:bg-black/80 text-white shadow-lg"
                            >
                                <Link href="/admin/dashboard/quizzes/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create New Quiz
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                <Card className="bg-white dark:bg-zinc-900 border-[#C4C4C4]/30">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Quizzes</p>
                                <p className="text-2xl font-bold text-black dark:text-white">
                                    {stats.total}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-[#F3CFC6]/20 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-[#F3CFC6]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-zinc-900 border-[#C4C4C4]/30">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Published</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {stats.published}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <Eye className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-zinc-900 border-[#C4C4C4]/30">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Onboarding</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {stats.onboarding}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <ClipboardCheck className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants}>
                <Card className="border-[#C4C4C4]/30">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search quizzes by title..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 border-[#C4C4C4]/50 focus:border-[#F3CFC6] focus:ring-[#F3CFC6]"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <Select
                                    value={statusFilter}
                                    onValueChange={(v) =>
                                        setStatusFilter(v as "all" | "active" | "draft")
                                    }
                                >
                                    <SelectTrigger className="w-[140px] border-[#C4C4C4]/50">
                                        <SelectValue placeholder="Filter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Quizzes</SelectItem>
                                        <SelectItem value="active">Published</SelectItem>
                                        <SelectItem value="draft">Drafts</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Quiz List */}
            <motion.div variants={itemVariants}>
                <Card className="border-[#C4C4C4]/30 overflow-hidden">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-6 space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <Skeleton className="h-12 w-12 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-5 w-48" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                        <Skeleton className="h-8 w-20" />
                                    </div>
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="h-16 w-16 rounded-full bg-[#F3CFC6]/20 flex items-center justify-center mx-auto mb-4">
                                    <ClipboardCheck className="h-8 w-8 text-[#C4C4C4]" />
                                </div>
                                <p className="text-lg font-medium text-foreground">
                                    {search || statusFilter !== "all"
                                        ? "No quizzes match your filters"
                                        : "No certification quizzes yet"}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Create your first quiz to start certifying professionals
                                </p>
                                {!search && statusFilter === "all" && (
                                    <Button
                                        asChild
                                        className="mt-4 bg-[#F3CFC6] text-black hover:bg-[#e5b8ad]"
                                    >
                                        <Link href="/admin/dashboard/quizzes/create">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Quiz
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-[#C4C4C4]/20">
                                {filtered.map((quiz, index) => (
                                    <motion.div
                                        key={quiz.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-4 hover:bg-[#F3CFC6]/5 dark:hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                            {/* Icon */}
                                            <div className="relative h-12 w-12 bg-gradient-to-br from-[#F3CFC6] to-[#C4C4C4] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden group">
                                                <FileText className="h-6 w-6 text-white" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-2">
                                                    <h3 className="font-semibold text-foreground truncate">
                                                        {quiz.title}
                                                    </h3>
                                                    <div className="flex gap-1.5 translate-y-0.5">
                                                        <Badge
                                                            variant={quiz.isActive ? "default" : "secondary"}
                                                            className={
                                                                quiz.isActive
                                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                            }
                                                        >
                                                            {quiz.isActive ? "Published" : "Draft"}
                                                        </Badge>
                                                        {quiz.isProOnboarding && (
                                                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200">
                                                                Onboarding
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <FileText className="h-3.5 w-3.5" />
                                                        {quiz._count.questions} Questions
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {format(new Date(quiz.createdAt), "MMM d, yyyy")}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => toggleActive(quiz.id)}
                                                    className={
                                                        quiz.isActive
                                                            ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                                            : "border-amber-300 text-amber-700 hover:bg-amber-50"
                                                    }
                                                >
                                                    {quiz.isActive ? (
                                                        <>
                                                            <EyeOff className="h-4 w-4 mr-1.5" />
                                                            Unpublish
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye className="h-4 w-4 mr-1.5" />
                                                            Publish
                                                        </>
                                                    )}
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link
                                                                href={`/admin/dashboard/quizzes/${quiz.id}`}
                                                                className="flex items-center"
                                                            >
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit Quiz
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteId(quiz.id)}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The quiz will be permanently
                            removed and all professional progress associated with it will be archived.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteQuiz}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting ? "Deleting..." : "Delete Quiz"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}
