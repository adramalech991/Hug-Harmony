"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, ArrowLeft, CheckCircle2, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import QuizComponent from "@/components/training/QuizComponent";
import { motion } from "framer-motion";

interface QuizSummary {
    id: string;
    title: string;
    description?: string;
    isProOnboarding: boolean;
    questionCount: number;
    lastAttempt: {
        score: number;
        passed: boolean;
        attemptedAt: string;
    } | null;
}

interface Question {
    id: string;
    text: string;
    options: { id: string; text: string; correct: boolean }[];
}

export default function CertificationQuizTab() {
    const [loading, setLoading] = useState(true);
    const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
    const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
    const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
    const [loadingQuiz, setLoadingQuiz] = useState(false);

    const fetchQuizzes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/quizzes", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load quizzes");
            const data = await res.json();
            setQuizzes(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load available quizzes");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuizzes();
    }, [fetchQuizzes]);

    const handleSelectQuiz = async (quizId: string) => {
        setLoadingQuiz(true);
        try {
            const res = await fetch(`/api/quizzes/${quizId}/questions`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load quiz questions");
            const data = await res.json();
            setQuizQuestions(data.questions);
            setSelectedQuiz(quizId);
        } catch {
            toast.error("Failed to start quiz");
        } finally {
            setLoadingQuiz(false);
        }
    };

    const handleQuizComplete = () => {
        fetchQuizzes();
        // Stay on the quiz to show results? QuizComponent already does that.
    };

    if (loading) {
        return <QuizSkeleton />;
    }

    if (selectedQuiz) {
        const quiz = quizzes.find(q => q.id === selectedQuiz);
        return (
            <div className="space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => {
                        setSelectedQuiz(null);
                        setQuizQuestions([]);
                    }}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Quizzes
                </Button>

                <Card className="bg-gradient-to-r from-[#F3CFC6] to-[#C4C4C4] border-0 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-black flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            {quiz?.title}
                        </CardTitle>
                        {quiz?.description && (
                            <p className="text-sm text-black/70">{quiz.description}</p>
                        )}
                    </CardHeader>
                </Card>

                <QuizComponent
                    questions={quizQuestions}
                    submitUrl={`/api/quizzes/${selectedQuiz}/submit`}
                    onComplete={handleQuizComplete}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-r from-[#F3CFC6] to-[#C4C4C4] border-0 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-black">
                        <ClipboardCheck className="h-6 w-6" />
                        Knowledge Assessments
                    </CardTitle>
                    <p className="text-sm text-black/70">
                        Complete assessments to earn platform certifications and badges.
                    </p>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quizzes.map((quiz) => (
                    <Card
                        key={quiz.id}
                        className={`hover:shadow-lg transition-all cursor-pointer border overflow-hidden flex flex-col ${quiz.lastAttempt?.passed ? "border-green-200" : "hover:border-[#F3CFC6]"
                            }`}
                        onClick={() => handleSelectQuiz(quiz.id)}
                    >
                        <div className={`h-2 w-full ${quiz.lastAttempt?.passed ? "bg-green-500" : quiz.isProOnboarding ? "bg-purple-500" : "bg-[#F3CFC6]"
                            }`} />
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start gap-2">
                                <CardTitle className="text-lg font-bold leading-tight line-clamp-2">
                                    {quiz.title}
                                </CardTitle>
                                {quiz.lastAttempt?.passed && (
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {quiz.isProOnboarding && (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                                        Onboarding
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-muted-foreground border-slate-200">
                                    {quiz.questionCount} Questions
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between pt-2">
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                {quiz.description || "No description provided."}
                            </p>

                            <div className="space-y-3">
                                {quiz.lastAttempt && (
                                    <div className={`text-xs p-2 rounded-lg flex items-center justify-between ${quiz.lastAttempt.passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                        }`}>
                                        <span>Latest Score: {Math.round(quiz.lastAttempt.score)}%</span>
                                        <span className="font-semibold uppercase text-[10px]">
                                            {quiz.lastAttempt.passed ? "Passed" : "Failed"}
                                        </span>
                                    </div>
                                )}
                                <Button
                                    className={`w-full gap-2 rounded-full h-9 text-sm font-semibold transition-all ${quiz.lastAttempt?.passed
                                        ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                                        : "bg-[#F3CFC6] text-black hover:bg-[#e5b8ad]"
                                        }`}
                                    variant={quiz.lastAttempt?.passed ? "outline" : "default"}
                                >
                                    {quiz.lastAttempt?.passed ? "Retake Assessment" : "Start Quiz"}
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {quizzes.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No assessments available at this time.</p>
                        <p className="text-sm">Check back later for new certification opportunities.</p>
                    </div>
                )}
            </div>

            {loadingQuiz && (
                <div className="fixed inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-2xl border border-gray-100">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                            <ClipboardCheck className="h-12 w-12 text-[#F3CFC6]" />
                        </motion.div>
                        <p className="font-bold text-lg">Preparing your assessment...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function QuizSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-2 w-full" />
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <div className="flex gap-2">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-2/3 mb-6" />
                            <Skeleton className="h-10 w-full rounded-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
