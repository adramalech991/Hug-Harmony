/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  text: string;
  options: { id: string; text: string; correct: boolean }[];
}

interface QuizComponentProps {
  questions: Question[];
  submitUrl: string;
  onComplete?: (result: any) => void;
  readOnly?: boolean;
}

export default function QuizComponent({
  questions,
  submitUrl,
  onComplete,
  readOnly = false,
}: QuizComponentProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, answerId]) => ({
            questionId,
            answerId,
          })),
        }),
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Submission failed");
      }

      setScore(result.score);
      setSubmitted(true);

      if (result.passed) {
        toast.success(
          `🎉 Congratulations! You passed with ${Math.round(result.score)}%`,
        );
        if (onComplete) onComplete(result);
      } else {
        toast.error(
          `Score: ${Math.round(result.score)}%. You need 80% to pass.`,
        );
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <Card className="shadow-lg border-0">
      <CardContent className="p-6 space-y-8">
        {questions.map((q, i) => {
          const correctOpt =
            readOnly || submitted ? q.options.find((o) => o.correct) : null;

          return (
            <motion.div
              key={q.id}
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <p className="font-medium text-lg">
                <span className="text-[#F3CFC6] mr-2">Q{i + 1}.</span>
                {q.text}
              </p>

              <RadioGroup
                value={answers[q.id]}
                onValueChange={(v) =>
                  !readOnly &&
                  !submitted &&
                  setAnswers({ ...answers, [q.id]: v })
                }
                className="space-y-2"
                disabled={readOnly || submitted}
              >
                {q.options.map((opt) => {
                  const isCorrect = opt.correct;
                  const isSelected = answers[q.id] === opt.id;

                  let styleClass = "border-gray-200";
                  if (readOnly || submitted) {
                    if (isCorrect) styleClass = "bg-green-50 border-green-300";
                    else if (isSelected && !isCorrect)
                      styleClass = "bg-red-50 border-red-300";
                  } else if (isSelected) {
                    styleClass = "bg-[#F3CFC6]/20 border-[#F3CFC6]";
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${!readOnly && !submitted ? "cursor-pointer hover:bg-gray-50" : ""} ${styleClass}`}
                    >
                      <RadioGroupItem value={opt.id} id={`${q.id}-${opt.id}`} />
                      <Label
                        htmlFor={`${q.id}-${opt.id}`}
                        className={`flex-1 flex items-center justify-between ${!readOnly && !submitted ? "cursor-pointer" : ""}`}
                      >
                        <span>{opt.text}</span>
                        {(readOnly || submitted) && isCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>

              {/* Show correct answer if readOnly or submitted */}
              {correctOpt && (readOnly || submitted) && (
                <p className="text-sm text-green-700 font-medium pl-2">
                  ✓ Correct: {correctOpt.text}
                </p>
              )}

              {i < questions.length - 1 && (
                <div className="border-b border-dashed pt-4" />
              )}
            </motion.div>
          );
        })}

        {/* Submit Button */}
        {!readOnly && !submitted && (
          <div className="pt-6 border-t">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              className="w-full bg-[#F3CFC6] hover:bg-[#e5b8ad] text-black rounded-full h-12 text-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : allAnswered ? (
                "Submit Quiz"
              ) : (
                `Answer All Questions (${answeredCount}/${questions.length})`
              )}
            </Button>
          </div>
        )}

        {submitted && score !== null && (
          <div className="pt-6 border-t text-center">
            <p className="text-xl font-bold mb-2">
              You scored {Math.round(score)}%
            </p>
            {score >= 80 ? (
              <p className="text-green-600">Passed!</p>
            ) : (
              <p className="text-red-600">Failed. Please try again later.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
