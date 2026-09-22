/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { answers } = submitSchema.parse(await req.json());
    const userId = session.user.id;

    // Fetch the quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!quiz || !quiz.isActive) {
      return NextResponse.json(
        { error: "Quiz not found or inactive" },
        { status: 404 },
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

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId: quiz.id,
        score,
        passed,
        answers: results,
      },
    });

    // Special logic: if this is an onboarding quiz, also update professional application
    if (quiz.isProOnboarding) {
      const app = await prisma.professionalApplication.findUnique({
        where: { userId },
        select: { id: true, status: true },
      });

      if (app) {
        await prisma.$transaction(async (tx) => {
          await tx.proQuizAttempt.create({
            data: {
              applicationId: app.id,
              quizId: quiz.id,
              score,
              passed,
              answers: results,
              nextEligibleAt: passed
                ? null
                : new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });

          if (passed) {
            await tx.professionalApplication.update({
              where: { id: app.id },
              data: {
                status: "ADMIN_REVIEW",
                quizPassedAt: new Date(),
              },
            });

            if (app.status === "APPROVED") {
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
          }
        });
      }
    }

    return NextResponse.json({
      score,
      passed,
      attemptId: attempt.id,
    });
  } catch (error) {
    console.error("Quiz Submit Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
