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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("POST /api/professional-posts/[id]/replies: No session or user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is an approved professional
    const professional = await getApprovedProfessional(session.user.id);
    if (!professional) {
      return NextResponse.json(
        { error: "Access denied. Only approved professionals can reply in this forum." },
        { status: 403 }
      );
    }

    // Extract post ID from the URL
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 2]; // Get segment before "replies"

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      console.error("POST /api/professional-posts/[id]/replies: Invalid post ID", { id });
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const { content, parentReplyId } = await request.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      console.error("POST /api/professional-posts/[id]/replies: Missing or invalid content", {
        content,
        parentReplyId,
      });
      return NextResponse.json(
        { error: "Missing required field: content" },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await prisma.professionalPost.findUnique({ where: { id } });
    if (!post) {
      console.error("POST /api/professional-posts/[id]/replies: Post not found", {
        postId: id,
      });
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify parent reply exists if provided
    if (parentReplyId) {
      if (!/^[0-9a-fA-F]{24}$/.test(parentReplyId)) {
        return NextResponse.json(
          { error: "Invalid parent reply ID format" },
          { status: 400 }
        );
      }

      const parentReply = await prisma.professionalReply.findUnique({
        where: { id: parentReplyId },
      });

      if (!parentReply) {
        console.error("POST /api/professional-posts/[id]/replies: Parent reply not found", {
          parentReplyId,
        });
        return NextResponse.json(
          { error: "Parent reply not found" },
          { status: 404 }
        );
      }

      // Verify parent reply belongs to the same post
      if (parentReply.postId !== id) {
        return NextResponse.json(
          { error: "Parent reply does not belong to this post" },
          { status: 400 }
        );
      }
    }

    const reply = await prisma.professionalReply.create({
      data: {
        content: content.trim(),
        postId: id,
        authorId: session.user.id,
        professionalId: professional.id,
        parentReplyId: parentReplyId || null,
      },
    });

    return NextResponse.json(
      {
        id: reply.id,
        content: reply.content,
        author: {
          name: session.user.name || professional.name || "Unknown",
          avatar:
            session.user.image ||
            professional.image ||
            "/assets/images/avatar-placeholder.png",
        },
        timestamp: reply.createdAt.toISOString(),
        parentReplyId: reply.parentReplyId || undefined,
        childReplies: [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/professional-posts/[id]/replies error:", error);
    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 }
    );
  }
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
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 2];

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    // Verify post exists
    const post = await prisma.professionalPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const replies = await prisma.professionalReply.findMany({
      where: { postId: id, parentReplyId: null },
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
    });

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

    return NextResponse.json(formatReplies(replies));
  } catch (error) {
    console.error("GET /api/professional-posts/[id]/replies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch replies" },
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

    const { replyId } = await request.json();

    if (!replyId || !/^[0-9a-fA-F]{24}$/.test(replyId)) {
      return NextResponse.json({ error: "Invalid reply ID" }, { status: 400 });
    }

    const reply = await prisma.professionalReply.findUnique({
      where: { id: replyId },
      select: { authorId: true },
    });

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    // Only allow the author or an admin to delete
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (reply.authorId !== session.user.id && !user?.isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own replies" },
        { status: 403 }
      );
    }

    await prisma.professionalReply.delete({
      where: { id: replyId },
    });

    return NextResponse.json({ message: "Reply deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/professional-posts/[id]/replies error:", error);
    return NextResponse.json(
      { error: "Failed to delete reply" },
      { status: 500 }
    );
  }
}