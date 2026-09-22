"use server";

import prisma from "@/lib/prisma";

export async function getFAQs() {
    try {
        const faqs = await prisma.fAQ.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
        });
        return { success: true, data: faqs };
    } catch (error) {
        console.error("Error fetching FAQs:", error);
        return { success: false, error: "Failed to fetch FAQs" };
    }
}

export async function getInfoContent(key: string) {
    try {
        const content = await prisma.infoContent.findFirst({
            where: { key },
        });
        return { success: true, data: content };
    } catch (error) {
        console.error(`Error fetching info content ${key}:`, error);
        return { success: false, error: "Failed to fetch content" };
    }
}

export async function searchChatContent(query: string) {
    if (!query || query.trim().length === 0) {
        return { success: true, data: { faqs: [], contents: [] } };
    }

    try {
        // Search FAQs
        const faqs = await prisma.fAQ.findMany({
            where: {
                isActive: true,
                OR: [
                    { question: { contains: query, mode: "insensitive" } },
                    { answer: { contains: query, mode: "insensitive" } },
                ],
            },
            take: 5,
        });

        // Search InfoContent
        const contents = await prisma.infoContent.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { content: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                key: true,
                title: true,
                content: true
            },
            take: 2,
        });

        return { success: true, data: { faqs, contents } };
    } catch (error) {
        console.error("Error searching chat content:", error);
        return { success: false, error: "Failed to search" };
    }
}
