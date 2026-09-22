/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Find the primary onboarding quiz
    const quiz = await prisma.quiz.findFirst({
      where: { isProOnboarding: true, isActive: true },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quiz) {
      // Fallback or error?
      // For now, return empty or a specific error
      return NextResponse.json(
        { error: "Onboarding quiz not found" },
        { status: 404 },
      );
    }

    // Shuffle options for security/variety
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

    return NextResponse.json(shuffled);
  } catch (error) {
    console.error("GET Onboarding Questions Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
