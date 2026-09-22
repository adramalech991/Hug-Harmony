import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const quizzes = await prisma.quiz.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { questions: true }
                },
                attempts: {
                    where: { userId: session.user.id },
                    orderBy: { attemptedAt: "desc" },
                    take: 1
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const formatted = quizzes.map(q => ({
            id: q.id,
            title: q.title,
            description: q.description,
            isProOnboarding: q.isProOnboarding,
            questionCount: q._count.questions,
            lastAttempt: q.attempts[0] || null
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("GET Quizzes Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
