/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const answerSchema = z.object({
  questionId: z.string(),
  answerId: z.string(),
});
const submitSchema = z.object({
  answers: z.array(answerSchema),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { answers } = submitSchema.parse(await req.json());
    const userId = session.user.id;

    const app = await prisma.professionalApplication.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });

    if (
      !app ||
      (app.status !== "QUIZ_PENDING" &&
        app.status !== "ADMIN_REVIEW" &&
        app.status !== "APPROVED")
    ) {
      return NextResponse.json(
        { error: "Quiz not available" },
        { status: 400 },
      );
    }

    // Fetch the onboarding quiz
    const quiz = await prisma.quiz.findFirst({
      where: { isProOnboarding: true, isActive: true },
      include: { questions: true },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Onboarding quiz not configured." },
        { status: 500 },
      );
    }

    // Build correct answers map
    const correctMap = new Map();
    quiz.questions.forEach((q) => {
      const options = q.options as any[];
      const correctOpt = options.find((o) => o.correct);
      if (correctOpt) {
        correctMap.set(q.id, correctOpt.id);
      }
    });

    const results = answers.map(({ questionId, answerId }) => ({
      questionId,
      answerId,
      correct: correctMap.get(questionId) === answerId,
    }));

    const correctCount = results.filter((r) => r.correct).length;
    const score = (correctCount / correctMap.size) * 100;
    const passed = score >= 80;

    await prisma.$transaction(async (tx) => {
      const nextEligibleAt = passed
        ? null
        : new Date(Date.now() + 24 * 60 * 60 * 1000);

      await tx.proQuizAttempt.create({
        data: {
          applicationId: app.id,
          quizId: quiz.id,
          score,
          passed,
          answers: results,
          nextEligibleAt,
        },
      });

      const newStatus = passed ? "ADMIN_REVIEW" : "QUIZ_FAILED";
      await tx.professionalApplication.update({
        where: { id: app.id },
        data: {
          status: newStatus,
          quizPassedAt: passed ? new Date() : undefined,
        },
      });

      // If they are already approved (experienced path) and passed the quiz, verify them
      if (passed && app.status === "APPROVED") {
        const application = await tx.professionalApplication.findUnique({
          where: { id: app.id },
          select: { professionalId: true },
        });
        if (application?.professionalId) {
          await tx.professional.update({
            where: { id: application.professionalId },
            data: { isVerified: true },
          });
        }
      }
    });

    return NextResponse.json({
      score,
      passed,
      nextEligibleAt: passed
        ? null
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
