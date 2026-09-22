"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- FAQs ---

export async function getAdminFAQs() {
    try {
        const faqs = await prisma.fAQ.findMany({
            orderBy: { order: "asc" },
        });
        return { success: true, data: faqs };
    } catch (error) {
        console.error("Error fetching admin FAQs:", error);
        return { success: false, error: "Failed to fetch FAQs" };
    }
}


export async function createFAQ(data: { question: string; answer: string; order?: number }) {
    try {
        await prisma.fAQ.create({
            data: {
                question: data.question,
                answer: data.answer,
                order: data.order ?? 0,
                isActive: true,
            },
        });
        revalidatePath("/admin/help-center/faqs");
        return { success: true };
    } catch (error) {
        console.error("Error creating FAQ:", error);
        return { success: false, error: "Failed to create FAQ" };
    }
}

export async function updateFAQ(id: string, data: { question?: string; answer?: string; order?: number; isActive?: boolean }) {
    try {
        await prisma.fAQ.update({
            where: { id },
            data,
        });
        revalidatePath("/admin/help-center/faqs");
        return { success: true };
    } catch (error) {
        console.error("Error updating FAQ:", error);
        return { success: false, error: "Failed to update FAQ" };
    }
}

export async function deleteFAQ(id: string) {
    try {
        await prisma.fAQ.delete({
            where: { id },
        });
        revalidatePath("/admin/help-center/faqs");
        return { success: true };
    } catch (error) {
        console.error("Error deleting FAQ:", error);
        return { success: false, error: "Failed to delete FAQ" };
    }
}

// --- Info Content (formerly Policies) ---

export async function getInfoContent() {
    try {
        const content = await prisma.infoContent.findMany({
            orderBy: { order: "asc" },
        });
        return { success: true, data: content };
    } catch (error) {
        console.error("Error fetching info content:", error);
        return { success: false, error: "Failed to fetch content" };
    }
}

export async function getInfoContentByKey(key: string) {
    try {
        const content = await prisma.infoContent.findFirst({
            where: { key }
        });
        return { success: true, data: content };
    } catch (error) {
        console.error(`Error fetching info content by key ${key}:`, error);
        return { success: false, error: "Failed to fetch content" };
    }
}

export async function createInfoContent(data: { title: string; content: string; key?: string; order?: number }) {
    try {
        await prisma.infoContent.create({
            data: {
                title: data.title,
                content: data.content,
                key: data.key,
                order: data.order ?? 0,
            },
        });
        revalidatePath("/admin/help-center/policies");
        return { success: true };
    } catch (error) {
        console.error("Error creating info content:", error);
        return { success: false, error: "Failed to create content" };
    }
}

export async function updateInfoContent(id: string, data: { title?: string; content?: string; key?: string; order?: number }) {
    try {
        await prisma.infoContent.update({
            where: { id },
            data,
        });
        revalidatePath("/admin/help-center/policies");
        // Revalidate public pages if it's a system doc
        if (data.key === "terms") revalidatePath("/terms");
        if (data.key === "privacy") revalidatePath("/privacy-policy");

        return { success: true };
    } catch (error) {
        console.error("Error updating info content:", error);
        return { success: false, error: "Failed to update content" };
    }
}

export async function upsertInfoContent(key: string, title: string, content: string) {
    try {
        const existing = await prisma.infoContent.findFirst({
            where: { key }
        });

        if (existing) {
            await prisma.infoContent.update({
                where: { id: existing.id },
                data: { title, content }
            });
        } else {
            await prisma.infoContent.create({
                data: { key, title, content }
            });
        }

        revalidatePath("/admin/help-center/policies");
        revalidatePath("/terms");
        revalidatePath("/privacy-policy");
        return { success: true };
    } catch (error) {
        console.error("Error upserting info content:", error);
        return { success: false, error: "Failed to update content" };
    }
}

export async function deleteInfoContent(id: string) {
    try {
        await prisma.infoContent.delete({
            where: { id },
        });
        revalidatePath("/admin/help-center/policies");
        return { success: true };
    } catch (error) {
        console.error("Error deleting info content:", error);
        return { success: false, error: "Failed to delete content" };
    }
}
