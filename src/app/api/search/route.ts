/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/search/route.ts
// Global search API for searching across all content types

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all"; // all, users, professionals, posts, messages, appointments, merchandise, reviews
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const searchMode = "insensitive" as const;

    // Build search results based on type
    const results: Record<string, unknown[]> = {};
    const counts: Record<string, number> = {};

    const searchPromises: Promise<void>[] = [];

    // Search Users
    const userWhere: Prisma.UserWhereInput = {
      id: { not: userId },
      status: "active",
      OR: [
        { name: { contains: query, mode: searchMode } },
        { firstName: { contains: query, mode: searchMode } },
        { lastName: { contains: query, mode: searchMode } },
        { username: { contains: query, mode: searchMode } },
        { usernameLower: { contains: query.toLowerCase(), mode: searchMode } },
        { email: { contains: query, mode: searchMode } },
      ],
    };

    searchPromises.push((async () => {
      const [users, userCount] = await Promise.all([
        prisma.user.findMany({
          where: userWhere,
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            profileImage: true,
            location: true,
            location2: true,
            biography: true,
            createdAt: true,
          },
          skip: type === "users" ? skip : 0,
          take: type === "users" ? limit : (type === "all" ? 10 : 0),
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where: userWhere }),
      ]);
      if (type === "all" || type === "users") {
        results.users = users.map((user) => ({
          id: user.id,
          type: "user",
          title: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Unknown",
          subtitle: user.email,
          description: user.biography,
          image: user.profileImage,
          metadata: {
            location: user.location,
            location2: user.location2,
            username: user.username,
          },
          createdAt: user.createdAt,
        }));
      }
      counts.users = userCount;
    })());

    // Search Professionals
    const profWhere: Prisma.ProfessionalWhereInput = {
      OR: [
        { name: { contains: query, mode: searchMode } },
        { biography: { contains: query, mode: searchMode } },
        { location: { contains: query, mode: searchMode } },
        { location2: { contains: query, mode: searchMode } },
      ],
    };

    searchPromises.push((async () => {
      const [professionals, professionalCount] = await Promise.all([
        prisma.professional.findMany({
          where: profWhere,
          skip: type === "professionals" ? skip : 0,
          take: type === "professionals" ? limit : (type === "all" ? 10 : 0),
          orderBy: { createdAt: "desc" },
        }),
        prisma.professional.count({ where: profWhere }),
      ]);
      if (type === "all" || type === "professionals") {
        results.professionals = professionals.map((prof) => ({
          id: prof.id,
          type: "professional",
          title: prof.name,
          subtitle: prof.location || undefined,
          description: prof.biography,
          image: prof.image,
          metadata: {
            rating: prof.rating,
            reviewCount: prof.reviewCount,
            rate: prof.rate,
            venue: prof.venue,
            offersVideo: prof.offersVideo,
          },
          createdAt: prof.createdAt,
        }));
      }
      counts.professionals = professionalCount;
    })());

    // Search Posts
    const postWhere: Prisma.PostWhereInput = {
      OR: [
        { title: { contains: query, mode: searchMode } },
        { content: { contains: query, mode: searchMode } },
        { category: { contains: query, mode: searchMode } },
      ],
    };

    searchPromises.push((async () => {
      const [posts, postCount] = await Promise.all([
        prisma.post.findMany({
          where: postWhere,
          include: {
            author: { select: { id: true, name: true, firstName: true, lastName: true, username: true, profileImage: true } },
            replies: { select: { id: true } },
          },
          skip: type === "posts" ? skip : 0,
          take: type === "posts" ? limit : (type === "all" ? 10 : 0),
          orderBy: { createdAt: "desc" },
        }),
        prisma.post.count({ where: postWhere }),
      ]);
      if (type === "all" || type === "posts") {
        results.posts = posts.map((post) => ({
          id: post.id,
          type: "post",
          title: post.title,
          subtitle: post.category,
          description: post.content.substring(0, 200) + (post.content.length > 200 ? "..." : ""),
          metadata: {
            author: {
              id: post.author.id,
              name: post.author.name || `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || post.author.username || "Unknown",
              image: post.author.profileImage,
            },
            replyCount: post.replies.length,
          },
          createdAt: post.createdAt,
        }));
      }
      counts.posts = postCount;
    })());

    // Search Messages
    const msgWhere: Prisma.MessageWhereInput = {
      OR: [{ senderId: userId }, { recipientId: userId }],
      text: { contains: query, mode: searchMode },
      deletedAt: null,
    };

    searchPromises.push((async () => {
      const [messages, messageCount] = await Promise.all([
        prisma.message.findMany({
          where: msgWhere,
          include: {
            senderUser: { select: { id: true, name: true, firstName: true, lastName: true, username: true, profileImage: true } },
            recipientUser: { select: { id: true, name: true, firstName: true, lastName: true, username: true, profileImage: true } },
            conversation: { select: { id: true } },
          },
          skip: type === "messages" ? skip : 0,
          take: type === "messages" ? limit : (type === "all" ? 10 : 0),
          orderBy: { createdAt: "desc" },
        }),
        prisma.message.count({ where: msgWhere }),
      ]);
      if (type === "all" || type === "messages") {
        results.messages = messages.map((msg) => {
          const otherUser = msg.senderId === userId ? msg.recipientUser : msg.senderUser;
          return {
            id: msg.id,
            type: "message",
            title: `Message with ${otherUser?.name || `${otherUser?.firstName || ""} ${otherUser?.lastName || ""}`.trim() || otherUser?.username || "Unknown"}`,
            subtitle: msg.conversation.id,
            description: msg.text,
            metadata: {
              conversationId: msg.conversation.id,
              sender: { id: msg.senderUser.id, name: msg.senderUser.name || "Unknown", image: msg.senderUser.profileImage },
              recipient: { id: msg.recipientUser.id, name: msg.recipientUser.name || "Unknown", image: msg.recipientUser.profileImage },
            },
            createdAt: msg.createdAt,
          };
        });
      }
      counts.messages = messageCount;
    })());

    // Search Appointments
    searchPromises.push((async () => {
      const userApplications = await prisma.professionalApplication.findMany({
        where: { userId, professionalId: { not: null } },
        select: { professionalId: true },
      });
      const professionalIds = userApplications.map((app) => app.professionalId).filter((id): id is string => id !== null);

      const aptWhere: Prisma.AppointmentWhereInput = {
        AND: [
          { OR: [{ userId }, ...(professionalIds.length > 0 ? [{ professionalId: { in: professionalIds } }] : [])] },
          { OR: [{ status: { contains: query, mode: searchMode } }, { disputeReason: { contains: query, mode: searchMode } }, { adminNotes: { contains: query, mode: searchMode } }] },
        ],
      };

      const [appointments, appointmentCount] = await Promise.all([
        prisma.appointment.findMany({
          where: aptWhere,
          include: {
            user: { select: { id: true, name: true, firstName: true, lastName: true, username: true, profileImage: true } },
            professional: { select: { id: true, name: true, image: true } },
          },
          skip: type === "appointments" ? skip : 0,
          take: type === "appointments" ? limit : (type === "all" ? 10 : 0),
          orderBy: { createdAt: "desc" },
        }),
        prisma.appointment.count({ where: aptWhere }),
      ]);
      if (type === "all" || type === "appointments") {
        results.appointments = appointments.map((apt) => ({
          id: apt.id,
          type: "appointment",
          title: `Appointment with ${apt.professional.name}`,
          subtitle: apt.status,
          description: apt.disputeReason || apt.adminNotes || undefined,
          metadata: {
            startTime: apt.startTime,
            endTime: apt.endTime,
            professional: { id: apt.professional.id, name: apt.professional.name, image: apt.professional.image },
          },
          createdAt: apt.createdAt,
        }));
      }
      counts.appointments = appointmentCount;
    })());

    // Search Merchandise
    const merchWhere: Prisma.MerchandiseWhereInput = {
      isActive: true,
      OR: [{ name: { contains: query, mode: searchMode } }, { description: { contains: query, mode: searchMode } }],
    };

    searchPromises.push((async () => {
      const [merchandise, merchandiseCount] = await Promise.all([
        prisma.merchandise.findMany({
          where: merchWhere,
          skip: type === "merchandise" ? skip : 0,
          take: type === "merchandise" ? limit : (type === "all" ? 10 : 0),
          orderBy: { createdAt: "desc" },
        }),
        prisma.merchandise.count({ where: merchWhere }),
      ]);
      if (type === "all" || type === "merchandise") {
        results.merchandise = merchandise.map((item) => ({
          id: item.id,
          type: "merchandise",
          title: item.name,
          subtitle: `$${item.price.toFixed(2)}`,
          description: item.description,
          image: item.image,
          createdAt: item.createdAt,
        }));
      }
      counts.merchandise = merchandiseCount;
    })());

    // Search Reviews
    const reviewWhere: Prisma.ReviewWhereInput = {
      feedback: { contains: query, mode: searchMode },
    };

    searchPromises.push((async () => {
      const [reviews, reviewCount] = await Promise.all([
        prisma.review.findMany({
          where: reviewWhere,
          include: {
            professional: { select: { id: true, name: true, image: true } },
            reviewer: { select: { id: true, name: true, profileImage: true } },
          },
          skip: type === "reviews" ? skip : 0,
          take: type === "reviews" ? limit : (type === "all" ? 10 : 0),
          orderBy: { createdAt: "desc" },
        }),
        prisma.review.count({ where: reviewWhere }),
      ]);
      if (type === "all" || type === "reviews") {
        results.reviews = reviews.map((review) => ({
          id: review.id,
          type: "review",
          title: `Review for ${review.professional.name}`,
          subtitle: `${review.rating}/5 stars`,
          description: review.feedback,
          metadata: { rating: review.rating, professional: review.professional },
          createdAt: review.createdAt,
        }));
      }
      counts.reviews = reviewCount;
    })());

    await Promise.all(searchPromises);

    // Combine results
    const allResults = type === "all"
      ? Object.values(results).flat().sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      : results[type] || [];

    const totalCount = type === "all"
      ? Object.values(counts).reduce((sum, count) => sum + count, 0)
      : counts[type] || 0;

    return NextResponse.json({
      results: allResults.slice(0, limit),
      counts,
      total: totalCount,
      query,
      type,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
