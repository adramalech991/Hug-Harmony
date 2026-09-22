/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import QuizForm from "../QuizForm";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuiz = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`);
      if (!res.ok) throw new Error("Failed to load quiz");
      const data = await res.json();
      setQuiz(data);
    } catch {
      toast.error("Failed to load quiz details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-4 md:p-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black">
          Edit Certification Quiz
        </h1>
        <p className="text-muted-foreground mt-2">
          Update your knowledge assessment and questions.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : quiz ? (
        <QuizForm initialData={quiz} />
      ) : (
        <div className="text-center py-20">
          <p className="text-lg text-muted-foreground">Quiz not found</p>
        </div>
      )}
    </motion.div>
  );
}
