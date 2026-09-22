// src/app/api/admin/users/route.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

import { US_STATES, extractStateFromLocation, findState } from "@/lib/constants/us-states";
import { getStateForCity } from "@/lib/constants/us-cities";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or moderator
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, isModerator: true },
    });

    if (!currentUser?.isAdmin && !currentUser?.isModerator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // New filters
    const location = searchParams.get("location") || "";
    const state = searchParams.get("state") || "";
    const city = searchParams.get("city") || "";
    const activityLevel = searchParams.get("activityLevel") || "";
    const dateFilter = searchParams.get("dateFilter") || "";
    const year = searchParams.get("year") || "";
    const month = searchParams.get("month") || "";
    const includeStats = searchParams.get("includeStats") === "true";

    const skip = (page - 1) * limit;

    // Build where clause for search and filters
    const whereClause: Prisma.UserWhereInput = {
      id: { not: session.user.id }, // Exclude current admin
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      whereClause.status = status;
    }

    // Location filters
    if (location) {
      whereClause.location = { contains: location, mode: "insensitive" };
    }

    if (state && state !== "all") {
      const stateInfo = US_STATES.find(
        (s) => s.abbreviation === state || s.name === state
      );
      if (stateInfo) {
        whereClause.OR = [
          ...(whereClause.OR || []),
          { location: { contains: stateInfo.abbreviation, mode: "insensitive" } },
          { location: { contains: stateInfo.name, mode: "insensitive" } },
        ];
      }
    }

    if (city && city !== "all") {
      whereClause.location = {
        ...((whereClause.location as Prisma.StringFilter) || {}),
        contains: city,
        mode: "insensitive",
      };
    }

    // Date filters
    if (dateFilter) {
      const now = new Date();
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      switch (dateFilter) {
        case "thisWeek":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          break;
        case "lastWeek":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setDate(now.getDate() - now.getDay());
          endDate.setHours(0, 0, 0, 0);
          break;
        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now);
          break;
        case "lastMonth":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case "thisYear":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now);
          break;
        case "lastYear":
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31);
          break;
        case "custom":
          if (year) {
            const yearNum = parseInt(year);
            if (month) {
              const monthNum = parseInt(month) - 1;
              startDate = new Date(yearNum, monthNum, 1);
              endDate = new Date(yearNum, monthNum + 1, 0);
            } else {
              startDate = new Date(yearNum, 0, 1);
              endDate = new Date(yearNum, 11, 31);
            }
          }
          break;
      }

      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    // Activity level filter based on lastOnline
    if (activityLevel && activityLevel !== "all") {
      const now = new Date();
      switch (activityLevel) {
        case "veryActive": // Online in last 24 hours
          whereClause.lastOnline = {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          };
          break;
        case "active": // Online in last 7 days
          whereClause.lastOnline = {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          };
          break;
        case "moderate": // Online in last 30 days
          whereClause.lastOnline = {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          };
          break;
        case "inactive": // Not online in last 30 days
          whereClause.OR = [
            {
              lastOnline: {
                lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
              },
            },
            { lastOnline: null },
          ];
          break;
        case "dormant": // Not online in last 90 days
          whereClause.OR = [
            {
              lastOnline: {
                lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
              },
            },
            { lastOnline: null },
          ];
          break;
      }
    }

    // Build sort object
    const sortObject: Prisma.UserOrderByWithRelationInput = {};
    const validSortFields = [
      "createdAt",
      "lastOnline",
      "name",
      "email",
      "status",
    ];
    const validSortOrder = ["asc", "desc"] as const;

    if (
      validSortFields.includes(sortBy) &&
      validSortOrder.includes(sortOrder as "asc" | "desc")
    ) {
      const key = sortBy as keyof Prisma.UserOrderByWithRelationInput;
      const order: Prisma.SortOrder = sortOrder as Prisma.SortOrder;
      sortObject[key] = order;
    } else {
      sortObject.createdAt = "desc";
    }

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where: whereClause });

    // Fetch users
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        phoneNumber: true,
        profileImage: true,
        location: true,
        biography: true,
        status: true,
        createdAt: true,
        lastOnline: true,
        isAdmin: true,
        emailVerified: true,
        professionalApplication: {
          select: {
            status: true,
            professionalId: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            posts: true,
            sentMessages: true,
            receivedMessages: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: sortObject,
    });

    const formattedUsers = users.map((user) => {
      // Parse location into components
      const locationParts =
        user.location?.split(",").map((s) => s.trim()) || [];
      const parsedLocation = {
        city: locationParts[0] || "",
        state: locationParts[1] || "",
        country: locationParts[2] || locationParts[1] || "",
      };

      // Calculate activity score
      const messageCount =
        user._count.sentMessages + user._count.receivedMessages;
      // const appointmentCount = user._count.appointments;
      // const postCount = user._count.posts;

      let activityLevel = "inactive";
      if (user.lastOnline) {
        const hoursSinceOnline =
          (Date.now() - new Date(user.lastOnline).getTime()) / (1000 * 60 * 60);
        if (hoursSinceOnline < 24) activityLevel = "veryActive";
        else if (hoursSinceOnline < 24 * 7) activityLevel = "active";
        else if (hoursSinceOnline < 24 * 30) activityLevel = "moderate";
        else if (hoursSinceOnline < 24 * 90) activityLevel = "inactive";
        else activityLevel = "dormant";
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        name:
          user.name ||
          (user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : "Unknown User"),
        phoneNumber: user.phoneNumber || "",
        profileImage: user.profileImage || "",
        location: user.location || "",
        parsedLocation,
        biography: user.biography || "",
        status: user.status,
        createdAt: user.createdAt,
        lastOnline: user.lastOnline,
        isAdmin: user.isAdmin,
        emailVerified: user.emailVerified,
        activityLevel,
        professionalApplication: {
          status: user.professionalApplication?.status || null,
          professionalId: user.professionalApplication?.professionalId || null,
        },
        stats: {
          appointments: user._count.appointments,
          posts: user._count.posts,
          messages: messageCount,
        },
      };
    });

    // Generate statistics if requested
    let statistics = null;
    if (includeStats) {
      // Get all users matching the filter for stats (without pagination)
      const allFilteredUsers = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          profileImage: true,
          createdAt: true,
          lastOnline: true,
          status: true,
          location: true,
          professionalApplication: {
            select: {
              status: true,
              professionalId: true,
            },
          },
        },
      });

      // Monthly registration stats (last 12 months)
      const monthlyStats: { [key: string]: number } = {};
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyStats[key] = 0;
      }

      allFilteredUsers.forEach((user) => {
        const date = new Date(user.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyStats[key] !== undefined) {
          monthlyStats[key]++;
        }
      });

      // Weekly registration stats (last 8 weeks)
      const weeklyStats: { [key: string]: number } = {};
      for (let i = 7; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 7);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const key = weekStart.toISOString().split("T")[0];
        weeklyStats[key] = 0;
      }

      allFilteredUsers.forEach((user) => {
        const date = new Date(user.createdAt);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const key = weekStart.toISOString().split("T")[0];
        if (weeklyStats[key] !== undefined) {
          weeklyStats[key]++;
        }
      });

      // Status distribution
      const statusDistribution = {
        active: 0,
        suspended: 0,
      };

      allFilteredUsers.forEach((user) => {
        if (user.status === "active") statusDistribution.active++;
        else if (user.status === "suspended") statusDistribution.suspended++;
      });

      // Professional status distribution
      const proStatusDistribution = {
        professional: 0,
        pending: 0,
        notApplied: 0,
        rejected: 0,
      };

      allFilteredUsers.forEach((user) => {
        if (user.professionalApplication?.professionalId) {
          proStatusDistribution.professional++;
        } else if (
          user.professionalApplication?.status &&
          [
            "FORM_PENDING",
            "FORM_SUBMITTED",
            "VIDEO_PENDING",
            "QUIZ_PENDING",
            "ADMIN_REVIEW",
          ].includes(user.professionalApplication.status)
        ) {
          proStatusDistribution.pending++;
        } else if (user.professionalApplication?.status === "REJECTED") {
          proStatusDistribution.rejected++;
        } else {
          proStatusDistribution.notApplied++;
        }
      });

      // Activity level distribution
      const activityDistribution = {
        veryActive: 0,
        active: 0,
        moderate: 0,
        inactive: 0,
        dormant: 0,
      };

      allFilteredUsers.forEach((user) => {
        if (user.lastOnline) {
          const hoursSinceOnline =
            (Date.now() - new Date(user.lastOnline).getTime()) /
            (1000 * 60 * 60);
          if (hoursSinceOnline < 24) activityDistribution.veryActive++;
          else if (hoursSinceOnline < 24 * 7) activityDistribution.active++;
          else if (hoursSinceOnline < 24 * 30) activityDistribution.moderate++;
          else if (hoursSinceOnline < 24 * 90) activityDistribution.inactive++;
          else activityDistribution.dormant++;
        } else {
          activityDistribution.dormant++;
        }
      });

      // Map distribution (replacing topLocations)
      const locationMap = new Map<string, any>();
      allFilteredUsers.forEach((user) => {
        if (!user.location) return;

        const parts = user.location.split(",").map((s) => s.trim());
        const city = parts[0] || "Unknown";

        // Find matching US state
        let stateInfo = extractStateFromLocation(user.location);

        // Fallback: If no state found in location string, try to find state by city name
        if (!stateInfo && city !== "Unknown") {
          const cityState = getStateForCity(city);
          if (cityState) {
            stateInfo = findState(cityState.stateAbbr);
          }
        }

        if (!stateInfo) return; // Skip non-US or unresolvable locations

        const key = `${city}-${stateInfo.abbreviation}`;

        if (locationMap.has(key)) {
          const existing = locationMap.get(key)!;
          existing.count++;
          existing.items.push({
            id: user.id,
            name: user.name || "Unknown",
            image: user.profileImage,
            createdAt: user.createdAt,
          });
        } else {
          // Add a small deterministic jitter based on city name so markers don't overlap exactly
          const jitterLat = (city.split("").reduce((a, b) => a + b.charCodeAt(0), 0) % 40 - 20) / 100;
          const jitterLng = (city.split("").reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0) % 40 - 20) / 100;

          locationMap.set(key, {
            state: stateInfo.name,
            stateAbbr: stateInfo.abbreviation,
            city,
            latitude: stateInfo.latitude + jitterLat,
            longitude: stateInfo.longitude + jitterLng,
            count: 1,
            items: [
              {
                id: user.id,
                name: user.name || "Unknown",
                image: user.profileImage,
                createdAt: user.createdAt,
              },
            ],
          });
        }
      });

      const mapLocationData = [...locationMap.values()];
      const topLocations = mapLocationData
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((l) => ({ location: `${l.city}, ${l.stateAbbr}`, count: l.count }));

      statistics = {
        totalFiltered: allFilteredUsers.length,
        monthlyRegistrations: Object.entries(monthlyStats).map(
          ([month, count]) => ({
            month,
            count,
          })
        ),
        weeklyRegistrations: Object.entries(weeklyStats).map(
          ([week, count]) => ({
            week,
            count,
          })
        ),
        statusDistribution,
        proStatusDistribution,
        activityDistribution,
        topLocations,
        mapLocationData,
      };
    }

    // Get cities for selected state (for dependent dropdown)
    let citiesForState: string[] = [];
    if (state && state !== "all") {
      const stateInfo = US_STATES.find(
        (s) => s.abbreviation === state || s.name === state
      );
      if (stateInfo) {
        // Import and use the getCitiesForState helper
        const { getCitiesForState } = await import("@/lib/constants/us-cities");
        citiesForState = getCitiesForState(stateInfo.abbreviation);
      }
    }

    return NextResponse.json({
      data: formattedUsers,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit),
        hasMore: page < Math.ceil(totalUsers / limit),
      },
      filterOptions: {
        states: US_STATES.map((s) => ({
          name: s.name,
          abbreviation: s.abbreviation,
        })),
        cities: citiesForState,
      },
      statistics,
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
