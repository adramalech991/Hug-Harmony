// app/dashboard/edit-profile/professional-application/quiz/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, Trophy } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import QuizComponent from "@/components/training/QuizComponent";

interface Question {
  id: string;
  text: string;
  options: { id: string; text: string; correct: boolean }[];
}

type PageStatus =
  | "loading"
  | "error"
  | "not_eligible"
  | "already_passed"
  | "ready";

export default function QuizPage() {
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(
    null
  );

  const { status } = useSession();
  const router = useRouter();

  // Check eligibility and fetch quiz
  const initialize = useCallback(async () => {
    try {
      // First check application status
      const statusRes = await fetch("/api/professionals/onboarding/status", {
        credentials: "include",
      });

      if (!statusRes.ok) {
        setPageStatus("error");
        return;
      }

      const statusData = await statusRes.json();
      setApplicationStatus(statusData.step);

      // No application - redirect to form
      if (!statusData.application || statusData.step === "FORM") {
        router.push("/dashboard/edit-profile/professional-application");
        return;
      }

      // Video not completed - redirect to video
      if (statusData.step === "VIDEO_PENDING") {
        router.push("/dashboard/edit-profile/professional-application/video");
        return;
      }

      // Already passed - show success state but allow viewing
      if (
        statusData.step === "QUIZ_PASSED" ||
        statusData.step === "ADMIN_REVIEW" ||
        statusData.step === "APPROVED"
      ) {
        setPageStatus("already_passed");
        return;
      }

      // Check cooldown for failed attempts
      if (statusData.step === "QUIZ_FAILED") {
        const cooldownRes = await fetch(
          "/api/professionals/onboarding/quiz/cooldown",
          { credentials: "include" }
        );

        if (cooldownRes.ok) {
          const cooldownData = await cooldownRes.json();
          if (!cooldownData.eligible) {
            router.push(
              "/dashboard/edit-profile/professional-application/quiz/cooldown"
            );
            return;
          }
        }
      }

      // Fetch questions
      const questionsRes = await fetch(
        "/api/professionals/onboarding/quiz/questions",
        { credentials: "include" }
      );

      if (!questionsRes.ok) {
        throw new Error("Failed to load questions");
      }

      const questionsData = await questionsRes.json();
      setQuestions(questionsData);
      setPageStatus("ready");
    } catch (error) {
      console.error("Initialize error:", error);
      toast.error("Failed to load quiz");
      setPageStatus("error");
    }
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      initialize();
    }
  }, [status, router, initialize]);

  const handleComplete = () => {
    router.push("/dashboard/edit-profile/professional-application/status");
  };

  // Loading state
  if (status === "loading" || pageStatus === "loading") {
    return <LoadingSkeleton />;
  }

  // Error state
  if (pageStatus === "error") {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load quiz. Please try again.
            <Button
              variant="link"
              className="p-0 h-auto ml-2"
              onClick={() => {
                setPageStatus("loading");
                initialize();
              }}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Already passed state
  if (pageStatus === "already_passed") {
    return (
      <motion.div
        className="p-4 space-y-6 max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-[#F3CFC6] to-[#C4C4C4] shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Link href="/dashboard/edit-profile/professional-application/status">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Link>
              </Button>
              <CardTitle className="text-xl text-black">
                Quiz Completed
              </CardTitle>
              <div className="w-20" />
            </div>
          </CardHeader>
        </Card>

        <Alert className="border-green-500 bg-green-50">
          <Trophy className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">
            You&apos;ve Already Passed!
          </AlertTitle>
          <AlertDescription className="text-green-700">
            Great job! You&apos;ve already completed the quiz successfully.
            {applicationStatus === "APPROVED" ? (
              <span> Your application has been approved!</span>
            ) : (
              <span> Your application is under review.</span>
            )}
          </AlertDescription>
        </Alert>

        <Card className="shadow-lg">
          <CardContent className="p-6 space-y-4">
            <p className="text-muted-foreground">
              You can view your application status or return to the dashboard.
            </p>
            <div className="flex gap-3">
              <Button
                asChild
                className="flex-1 bg-[#F3CFC6] hover:bg-[#e5b8ad] text-black rounded-full"
              >
                <Link href="/dashboard/edit-profile/professional-application/status">
                  View Application Status
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 rounded-full">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="p-4 space-y-6 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <Card className="bg-gradient-to-r from-[#F3CFC6] to-[#C4C4C4] shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-2 items-start justify-between">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Link href="/dashboard/edit-profile/professional-application/status">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Status
              </Link>
            </Button>
            <CardTitle className="text-xl text-black">
              Step 3: Knowledge Quiz
            </CardTitle>
            <div className="w-20" />
          </div>
        </CardHeader>
      </Card>

      {/* Dev Mode Notice */}
      <Alert className="border-amber-500 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Development Mode</AlertTitle>
        <AlertDescription className="text-amber-700">
          Correct answers are highlighted for testing purposes.
        </AlertDescription>
      </Alert>

      <QuizComponent
        questions={questions}
        submitUrl="/api/professionals/onboarding/quiz/submit"
        onComplete={handleComplete}
      />
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <Card className="bg-gradient-to-r from-[#F3CFC6] to-[#C4C4C4] shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-6 w-48" />
            <div className="w-28" />
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-lg">
        <CardContent className="p-6 space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-full" />
        </CardContent>
      </Card>
    </div>
  );
}
