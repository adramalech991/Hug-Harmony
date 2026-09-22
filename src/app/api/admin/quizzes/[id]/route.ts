/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const quizUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  isProOnboarding: z.boolean().optional(),
  questions: z
    .array(
      z.object({
        id: z.string().optional(),
        text: z.string().min(1, "Question text is required"),
        order: z.number().default(0),
        options: z
          .array(
            z.object({
              id: z.string(),
              text: z.string().min(1, "Option text is required"),
              correct: z.boolean(),
            }),
          )
          .min(2, "At least two options are required"),
      }),
    )
    .optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("GET Quiz Detail Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = quizUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 },
      );
    }

    const { title, description, isActive, isProOnboarding, questions } =
      result.data;

    const updatedQuiz = await prisma.$transaction(async (tx) => {
      const existing = await tx.quiz.findUnique({ where: { id } });
      if (!existing) throw new Error("Quiz not found");

      // Update quiz metadata
      await tx.quiz.update({
        where: { id },
        data: {
          title: title ?? undefined,
          description: description ?? undefined,
          isActive: isActive ?? undefined,
          isProOnboarding: isProOnboarding ?? undefined,
        },
      });

      // Update questions if provided
      if (questions) {
        // Simple approach: delete all existing questions and recreation them
        // This is safe even with QuizAttempt as questions don't have FKs elsewhere (except the Quiz itself)
        await tx.quizQuestion.deleteMany({
          where: { quizId: id },
        });

        await tx.quizQuestion.createMany({
          data: questions.map((q) => ({
            quizId: id,
            text: q.text,
            order: q.order,
            options: q.options as any,
          })),
        });
      }

      return await tx.quiz.findUnique({
        where: { id },
        include: { questions: true },
      });
    });

    return NextResponse.json(updatedQuiz);
  } catch (error: any) {
    console.error("PATCH Quiz Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.quiz.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Quiz Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
