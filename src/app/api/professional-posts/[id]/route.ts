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

export async function GET(request: Request) {
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

    // Extract post ID from the URL
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      console.error("GET /api/professional-posts/[id]: Invalid post ID", { id });
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await prisma.professionalPost.findUnique({
      where: { id },
      include: {
        author: { select: { name: true, profileImage: true } },
        professional: { select: { name: true, image: true } },
        replies: {
          where: { parentReplyId: null },
          include: {
            author: { select: { name: true, profileImage: true } },
            professional: { select: { name: true, image: true } },
            childReplies: {
              include: {
                author: { select: { name: true, profileImage: true } },
                professional: { select: { name: true, image: true } },
                childReplies: {
                  include: {
                    author: { select: { name: true, profileImage: true } },
                    professional: { select: { name: true, image: true } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!post) {
      console.error("GET /api/professional-posts/[id]: Post not found", { postId: id });
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    interface ReplyNode {
      id: string;
      content: string;
      createdAt: Date;
      author: { name: string | null; profileImage: string | null } | null;
      professional: { name: string | null; image: string | null } | null;
      parentReplyId: string | null;
      childReplies?: ReplyNode[];
    }

    interface FormattedReply {
      id: string;
      content: string;
      author: {
        name: string;
        avatar: string;
      };
      timestamp: string;
      parentReplyId?: string;
      childReplies: FormattedReply[];
    }

    const formatReplies = (replies: ReplyNode[]): FormattedReply[] =>
      replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        author: {
          name: reply.author?.name || reply.professional?.name || "Unknown",
          avatar:
            reply.author?.profileImage ||
            reply.professional?.image ||
            "/assets/images/avatar-placeholder.png",
        },
        timestamp: reply.createdAt.toISOString(),
        parentReplyId: reply.parentReplyId || undefined,
        childReplies: formatReplies(reply.childReplies || []),
      }));

    return NextResponse.json({
      id: post.id,
      user: {
        name: post.author?.name || post.professional?.name || "Unknown",
        avatar:
          post.author?.profileImage ||
          post.professional?.image ||
          "/assets/images/avatar-placeholder.png",
      },
      title: post.title,
      content: post.content,
      category: post.category || "General",
      timestamp: post.createdAt.toISOString(),
      replies: formatReplies(post.replies),
    });
  } catch (error) {
    console.error("GET /api/professional-posts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch professional post" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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

    // Extract post ID from the URL
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      console.error("DELETE /api/professional-posts/[id]: Invalid post ID", { id });
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await prisma.professionalPost.findUnique({
      where: { id },
      select: { authorId: true, professionalId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only allow the author or an admin to delete
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (post.authorId !== session.user.id && !user?.isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own posts" },
        { status: 403 }
      );
    }

    await prisma.professionalPost.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/professional-posts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete professional post" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    // Extract post ID from the URL
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      console.error("PATCH /api/professional-posts/[id]: Invalid post ID", { id });
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await prisma.professionalPost.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only allow the author to edit
    if (post.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own posts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, category } = body;

    const updatedPost = await prisma.professionalPost.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
      },
      include: {
        author: { select: { name: true, profileImage: true } },
        professional: { select: { name: true, image: true } },
        replies: { select: { id: true } },
      },
    });

    return NextResponse.json({
      id: updatedPost.id,
      user: {
        name: updatedPost.author?.name || updatedPost.professional?.name || "Unknown",
        avatar:
          updatedPost.author?.profileImage ||
          updatedPost.professional?.image ||
          "/assets/images/avatar-placeholder.png",
      },
      title: updatedPost.title,
      content: updatedPost.content,
      category: updatedPost.category || "General",
      timestamp: updatedPost.createdAt.toLocaleString(),
      createdAt: updatedPost.createdAt.toISOString(),
      replies: updatedPost.replies.length,
    });
  } catch (error) {
    console.error("PATCH /api/professional-posts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update professional post" },
      { status: 500 }
    );
  }
}