/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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

    if (!quiz || !quiz.isActive) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Shuffle options
    const shuffled = quiz.questions.map((q) => {
      const options = (q.options as any[]).map((o) => ({ ...o }));
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      return {
        id: q.id,
        text: q.text,
        options,
      };
    });

    return NextResponse.json({
      id: quiz.id,
      title: quiz.title,
      questions: shuffled,
    });
  } catch (error) {
    console.error("GET Quiz Questions Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
