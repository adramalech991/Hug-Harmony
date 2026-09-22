/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  Save,
  ArrowLeft,
  Settings2,
  HelpCircle,
  ClipboardCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

interface Option {
  id: string;
  text: string;
  correct: boolean;
}

interface Question {
  id?: string;
  text: string;
  order: number;
  options: Option[];
}

interface QuizFormProps {
  initialData?: {
    id: string;
    title: string;
    description?: string;
    isActive: boolean;
    isProOnboarding: boolean;
    questions: Question[];
  };
}

export default function QuizForm({ initialData }: QuizFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [isProOnboarding, setIsProOnboarding] = useState(
    initialData?.isProOnboarding ?? false,
  );
  const [questions, setQuestions] = useState<Question[]>(
    initialData?.questions || [
      {
        text: "",
        order: 0,
        options: [
          { id: "a", text: "", correct: false },
          { id: "b", text: "", correct: false },
        ],
      },
    ],
  );

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        order: questions.length,
        options: [
          { id: "a", text: "", correct: false },
          { id: "b", text: "", correct: false },
        ],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    const next = [...questions];
    next.splice(index, 1);
    // Reorder
    next.forEach((q, i) => (q.order = i));
    setQuestions(next);
  };

  const updateQuestionText = (index: number, text: string) => {
    const next = [...questions];
    next[index].text = text;
    setQuestions(next);
  };

  const addOption = (qIndex: number) => {
    const next = [...questions];
    const charCode = 97 + next[qIndex].options.length; // 'a', 'b', etc
    next[qIndex].options.push({
      id: String.fromCharCode(charCode),
      text: "",
      correct: false,
    });
    setQuestions(next);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const next = [...questions];
    next[qIndex].options.splice(oIndex, 1);
    setQuestions(next);
  };

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    const next = [...questions];
    next[qIndex].options[oIndex].text = text;
    setQuestions(next);
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    const next = [...questions];
    next[qIndex].options.forEach((opt, i) => {
      opt.correct = i === oIndex;
    });
    setQuestions(next);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === questions.length - 1) return;

    const next = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

    // Update order property
    next.forEach((q, i) => (q.order = i));
    setQuestions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return toast.error("Title is required");
    if (questions.length === 0)
      return toast.error("At least one question is required");

    // Validation
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text)
        return toast.error(`Question ${i + 1} text is required`);
      const hasCorrect = questions[i].options.some((o) => o.correct);
      if (!hasCorrect)
        return toast.error(
          `Question ${i + 1} needs one correct answer selected`,
        );
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j].text)
          return toast.error(
            `Question ${i + 1} Option ${j + 1} text is required`,
          );
      }
    }

    setLoading(true);
    try {
      const url = initialData?.id
        ? `/api/admin/quizzes/${initialData.id}`
        : "/api/admin/quizzes";
      const method = initialData?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          isActive,
          isProOnboarding,
          questions,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save quiz");
      }

      toast.success(initialData?.id ? "Quiz updated" : "Quiz created");
      router.push("/admin/dashboard/quizzes");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/admin/dashboard/quizzes">
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Settings Card */}
        <Card className="border-[#C4C4C4]/30 shadow-md">
          <CardHeader className="bg-[#F3CFC6]/10 border-b border-[#C4C4C4]/20">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Settings2 className="h-5 w-5 text-[#F3CFC6]" />
              Quiz Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Platform Guidelines & Safety"
                    className="border-[#C4C4C4]/50 focus:border-[#F3CFC6]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain what this quiz covers..."
                    className="border-[#C4C4C4]/50 focus:border-[#F3CFC6] min-h-[100px]"
                  />
                </div>
              </div>

              <div className="space-y-6 p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-dashed border-[#C4C4C4]/40">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Active Status</Label>
                    <p className="text-xs text-muted-foreground">
                      Should this quiz be available to professionals?
                    </p>
                  </div>
                  <Checkbox
                    checked={isActive}
                    onCheckedChange={(val) => setIsActive(!!val)}
                    className="h-6 w-6 data-[state=checked]:bg-[#F3CFC6] data-[state=checked]:border-[#F3CFC6]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Pro Onboarding</Label>
                    <p className="text-xs text-muted-foreground">
                      Mark as a required quiz for new professional applications.
                    </p>
                  </div>
                  <Checkbox
                    checked={isProOnboarding}
                    onCheckedChange={(val) => setIsProOnboarding(!!val)}
                    className="h-6 w-6 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                </div>

                <div className="pt-4 border-t border-[#C4C4C4]/20 text-xs text-muted-foreground flex gap-2">
                  <HelpCircle className="h-4 w-4 flex-shrink-0" />
                  Professionals must score 100% on onboarding quizzes to
                  proceed. Multiple quizzes can be marked as onboarding.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold text-black flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-[#F3CFC6]" />
              Questions
              <Badge
                variant="secondary"
                className="ml-2 bg-[#C4C4C4]/20 text-black"
              >
                {questions.length}
              </Badge>
            </h2>
            <Button
              type="button"
              onClick={addQuestion}
              className="bg-black hover:bg-black/80 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {questions.map((q, qIndex) => (
                <motion.div
                  key={qIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative group"
                >
                  <Card className="border-[#C4C4C4]/30 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#F3CFC6]" />
                    <CardHeader className="py-3 px-6 bg-gray-50/50 dark:bg-zinc-800/50 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-black text-white text-xs font-bold">
                          {qIndex + 1}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveQuestion(qIndex, "up")}
                            disabled={qIndex === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveQuestion(qIndex, "down")}
                            disabled={qIndex === questions.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeQuestion(qIndex)}
                        disabled={questions.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <Label>Question Text</Label>
                        <Input
                          value={q.text}
                          onChange={(e) =>
                            updateQuestionText(qIndex, e.target.value)
                          }
                          placeholder="Type your question here..."
                          className="border-[#C4C4C4]/50 focus:border-[#F3CFC6] text-lg font-medium"
                        />
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                            Options
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(qIndex)}
                            className="h-8 text-xs border-[#F3CFC6] text-[#F3CFC6] hover:bg-[#F3CFC6]/10"
                            disabled={q.options.length >= 6}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map((option, oIndex) => (
                            <div
                              key={oIndex}
                              className="flex items-center gap-2 group/opt p-2 border border-[#C4C4C4]/30 rounded-lg hover:border-[#F3CFC6]/50 transition-colors bg-white dark:bg-zinc-900"
                            >
                              <div
                                onClick={() => setCorrectOption(qIndex, oIndex)}
                                className={`h-10 w-10 flex items-center justify-center rounded-full cursor-pointer transition-all ${
                                  option.correct
                                    ? "bg-emerald-500 text-white shadow-lg"
                                    : "bg-gray-100 text-gray-400 hover:bg-[#F3CFC6]/20 hover:text-[#F3CFC6]"
                                }`}
                              >
                                {option.correct ? (
                                  <Check className="h-5 w-5" />
                                ) : (
                                  <span className="text-xs font-bold uppercase">
                                    {option.id}
                                  </span>
                                )}
                              </div>
                              <Input
                                value={option.text}
                                onChange={(e) =>
                                  updateOptionText(
                                    qIndex,
                                    oIndex,
                                    e.target.value,
                                  )
                                }
                                placeholder={`Option ${option.id.toUpperCase()}...`}
                                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-10 px-0"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover/opt:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                onClick={() => removeOption(qIndex, oIndex)}
                                disabled={q.options.length <= 2}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        {!q.options.some((o) => o.correct) && (
                          <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                            <ArrowLeft className="h-3 w-3 rotate-180" /> Please
                            select the correct answer
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="sticky bottom-6 flex justify-end gap-3 pt-6 z-10">
          <Button
            type="button"
            variant="outline"
            className="bg-white"
            onClick={() => router.push("/admin/dashboard/quizzes")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-black hover:bg-black/90 text-white gap-2 px-8 py-6 h-auto text-lg shadow-xl hover:shadow-2xl transition-all"
            disabled={loading}
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Plus className="h-5 w-5" />
                </motion.div>
                Saving Quiz...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                {initialData ? "Update Quiz" : "Create Quiz"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
