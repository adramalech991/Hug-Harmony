import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const quizSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
    isProOnboarding: z.boolean().default(false),
    questions: z.array(z.object({
        text: z.string().min(1, "Question text is required"),
        order: z.number().default(0),
        options: z.array(z.object({
            id: z.string(),
            text: z.string().min(1, "Option text is required"),
            correct: z.boolean()
        })).min(2, "At least two options are required")
    })).min(1, "At least one question is required")
});

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const quizzes = await prisma.quiz.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { questions: true }
                }
            }
        });

        return NextResponse.json(quizzes);
    } catch (error) {
        console.error("GET Quizzes Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const result = quizSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
        }

        const { title, description, isActive, isProOnboarding, questions } = result.data;

        const quiz = await prisma.$transaction(async (tx) => {
            // If setting this as onboarding, unmark other onboarding quizzes?
            // Actually, user said multiple can be onboarding (like videos), so we don't necessarily unmark.

            const newQuiz = await tx.quiz.create({
                data: {
                    title,
                    description,
                    isActive,
                    isProOnboarding,
                    questions: {
                        create: questions.map((q) => ({
                            text: q.text,
                            order: q.order,
                            options: q.options
                        }))
                    }
                },
                include: {
                    questions: true
                }
            });
            return newQuiz;
        });

        return NextResponse.json(quiz, { status: 201 });
    } catch (error) {
        console.error("POST Quiz Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
