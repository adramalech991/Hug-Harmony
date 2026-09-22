import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Helper function to check if user is an approved professional
async function getApprovedProfessional(userId: string) {
  const application = await prisma.professionalApplication.findUnique({
    where: { userId },
    include: { professional: true },
  });

  if (!application || application.status !== "APPROVED" || !application.professional) {
    return null;
  }

  return application.professional;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is an approved professional
    const professional = await getApprovedProfessional(session.user.id);
    if (!professional) {
      return NextResponse.json(
        { error: "Access denied. Only approved professionals can access this forum." },
        { status: 403 }
      );
    }

    const posts = await prisma.professionalPost.findMany({
      include: {
        author: {
          select: {
            name: true,
            profileImage: true,
            professionalApplication: {
              select: { status: true },
            },
          },
        },
        professional: { select: { name: true, image: true } },
        replies: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      posts.map((post) => ({
        id: post.id,
        user: {
          name: post.author?.name || post.professional?.name || "Unknown",
          avatar:
            post.author?.profileImage ||
            post.professional?.image ||
            "/assets/images/avatar-placeholder.png",
          isProfessional:
            post.author?.professionalApplication?.status === "APPROVED",
        },
        title: post.title,
        content: post.content,
        category: post.category || "General",
        timestamp: post.createdAt.toLocaleString(),
        createdAt: post.createdAt.toISOString(),
        replies: post.replies.length,
      }))
    );
  } catch (error) {
    console.error("GET /api/professional-posts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch professional posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("POST /api/professional-posts: No session or user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is an approved professional
    const professional = await getApprovedProfessional(session.user.id);
    if (!professional) {
      return NextResponse.json(
        { error: "Access denied. Only approved professionals can post in this forum." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, category } = body;

    console.log("POST /api/professional-posts received:", {
      title,
      content,
      category,
      authorId: session.user.id,
      professionalId: professional.id,
    });

    if (!title || !content) {
      console.error("POST /api/professional-posts: Missing fields", {
        title,
        content,
        category,
      });
      return NextResponse.json(
        {
          error: "Missing required fields",
          fields: { title, content, category },
        },
        { status: 400 }
      );
    }

    const post = await prisma.professionalPost.create({
      data: {
        title,
        content,
        category: category || "General",
        authorId: session.user.id,
        professionalId: professional.id,
      },
    });

    return NextResponse.json(
      {
        id: post.id,
        user: {
          name: session.user.name || professional.name || "Unknown",
          avatar:
            session.user.image ||
            professional.image ||
            "/assets/images/avatar-placeholder.png",
          isProfessional: true,
        },
        title: post.title,
        content: post.content,
        category: post.category || "General",
        timestamp: post.createdAt.toLocaleString(),
        createdAt: post.createdAt.toISOString(),
        replies: 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/professional-posts error:", error);
    return NextResponse.json(
      { error: "Failed to create professional post" },
      { status: 500 }
    );
  }
}