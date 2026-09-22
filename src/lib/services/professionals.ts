// lib/services/professionals.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type {
  Professional,
  ProfessionalDetail,
  ProfessionalFilters,
  ProfessionalsResponse,
} from "@/types/professional";

// Online status thresholds in milliseconds
const ONLINE_THRESHOLDS: Record<string, number> = {
  "24hrs": 24 * 60 * 60 * 1000,
  "1day": 24 * 60 * 60 * 1000,
  "1week": 7 * 24 * 60 * 60 * 1000,
  "1month": 30 * 24 * 60 * 60 * 1000,
  "1year": 365 * 24 * 60 * 60 * 1000,
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Convert time slot string to minutes from midnight
 */
function timeToMinutes(slot: string): number {
  const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Convert slot time string to Date object
 */
function slotToDate(slot: string, baseDate: Date): Date {
  const minutes = timeToMinutes(slot);
  const result = new Date(baseDate);
  result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return result;
}

interface GetProfessionalsOptions {
  filters: ProfessionalFilters;
  excludeUserId?: string;
  includeAvailability?: boolean;
}

/**
 * Get list of professionals with filtering, sorting, and pagination
 */
export async function getProfessionals(
  options: GetProfessionalsOptions
): Promise<ProfessionalsResponse> {
  const { filters, excludeUserId, includeAvailability = false } = options;
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  // Build Prisma where clause
  const where: Prisma.ProfessionalWhereInput = {};

  // Exclude self if user is a professional
  if (excludeUserId) {
    const userApplication = await prisma.professionalApplication.findFirst({
      where: { userId: excludeUserId, status: "APPROVED" },
      select: { professionalId: true },
    });

    if (userApplication?.professionalId) {
      where.id = { not: userApplication.professionalId };
    }
  }

  // Search filter (name or biography)
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { biography: { contains: filters.search, mode: "insensitive" } },
      { location: { contains: filters.search, mode: "insensitive" } },
      { location2: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  // Venue filter
  if (filters.venue && filters.venue !== "both") {
    where.venue = { in: [filters.venue, "both"] };
  }

  // Rating filter
  if (filters.minRating && filters.minRating > 0) {
    where.rating = { gte: filters.minRating };
  }

  // Rate filter
  if (filters.minRate !== undefined || filters.maxRate !== undefined) {
    where.rate = {};
    if (filters.minRate !== undefined) {
      where.rate.gte = filters.minRate;
    }
    if (filters.maxRate !== undefined) {
      where.rate.lte = filters.maxRate;
    }
  }

  // Language filter
  if (filters.languages) {
    const languageList = Array.isArray(filters.languages)
      ? filters.languages
      : typeof filters.languages === 'string'
        ? (filters.languages as string).split(",").map((l: string) => l.trim())
        : [];

    if (languageList.length > 0) {
      where.languages = {
        hasSome: languageList,
      };
    }
  }

  if (filters.sex) {
    where.sex = filters.sex;
  }

  // Build orderBy
  let orderBy: Prisma.ProfessionalOrderByWithRelationInput = {
    createdAt: "desc",
  };

  switch (filters.sortBy) {
    case "rating":
      orderBy = { rating: "desc" };
      break;
    case "rate":
      orderBy = { rate: "asc" };
      break;
    case "rate-desc":
      orderBy = { rate: "desc" };
      break;
    case "name":
      orderBy = { name: "asc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "recommended":
    default:
      // Default to "recommended" which uses multiple signals
      // Since advanced weighted sorting is hard in Prisma for MongoDB, 
      // we'll do the core sorting in-memory if "recommended" is selected.
      orderBy = { rating: "desc" };
      break;
  }

  // Fetch professionals with related data
  const professionals = await prisma.professional.findMany({
    where,
    select: {
      id: true,
      name: true,
      image: true,
      rating: true,
      reviewCount: true,
      rate: true,
      offersVideo: true,
      videoRate: true,
      biography: true,
      createdAt: true,
      venue: true,
      location: true,
      location2: true,
      hasValidPaymentMethod: true,
      _count: {
        select: {
          appointments: true,
        },
      },
      appointments: {
        select: {
          status: true,
        },
      },
      earnings: {
        select: {
          platformFeeAmount: true,
        },
      },
      applications: {
        select: {
          userId: true,
          alreadyExperienced: true,
          isBadgePaid: true,
          user: {
            select: {
              location: true,
              location2: true,
              lastOnline: true,
              ethnicity: true,
              profileImage: true,
              timezone: true,
              biography: true,
            },
          },
        },
      },
    },
    orderBy,
  });

  // Transform to Professional type
  let results: Professional[] = professionals.map((p) => ({
    _id: p.id,
    name: p.name,
    image: p.applications?.[0]?.user?.profileImage || p.image || undefined,
    location: p.location || p.location2 || p.applications?.[0]?.user?.location || p.applications?.[0]?.user?.location2 || undefined,
    location2: p.location2 || p.applications?.[0]?.user?.location2 || undefined,
    timezone: p.applications?.[0]?.user?.timezone || undefined,
    rating: p.rating || undefined,
    reviewCount: p.reviewCount || undefined,
    rate: p.rate || undefined,
    offersVideo: p.offersVideo,
    videoRate: p.videoRate || undefined,
    biography: p.biography || undefined,
    createdAt: p.createdAt?.toISOString(),
    venue: p.venue || undefined,
    lastOnline:
      p.applications?.[0]?.user?.lastOnline?.toISOString() || undefined,
    ethnicity: p.applications?.[0]?.user?.ethnicity || undefined,
    userId: p.applications?.[0]?.userId || undefined,
    appointmentCount: p._count?.appointments || 0,
    // Store additional fields for scoring
    _internal: {
      alreadyExperienced: p.applications?.[0]?.alreadyExperienced ?? false,
      isBadgePaid: p.applications?.[0]?.isBadgePaid ?? false,
      hasValidPaymentMethod: p.hasValidPaymentMethod,
      platformRevenue: p.earnings.reduce((sum, e) => sum + (e.platformFeeAmount || 0), 0),
      totalSessions: p._count?.appointments || 0,
      completedSessions: p.appointments.filter((a) => a.status === "completed").length,
      biography: p.biography || p.applications?.[0]?.user?.biography || "",
    } as any,
  }));

  // Apply recommended weighted sorting if requested or by default
  const isRecommendedSort = !filters.sortBy || filters.sortBy === "recommended";

  if (isRecommendedSort) {
    results.sort((a, b) => {
      const getScore = (p: Professional) => {
        const rating = p.rating || 0;
        const reviews = p.reviewCount || 0;
        const internal = (p as any)._internal || {};

        // --- A. Trust & Quality (43%) ---
        // 1. Rating (18%)
        const ratingScore = rating / 5;
        const weightedRating = ratingScore * 0.18;

        // 2. Review Count (10%)
        const reviewScore = Math.min(reviews, 100) / 100;
        const weightedReviews = reviewScore * 0.10;

        // 3. Profile Completeness (8%)
        // Fields: name, image, location, biography, rate, venue
        const requiredFields = [
          p.name,
          p.image,
          p.location,
          internal.biography,
          p.rate,
          p.venue
        ];
        const completedFields = requiredFields.filter(f => !!f).length;
        const profileScore = completedFields / requiredFields.length;
        const weightedProfile = profileScore * 0.08;

        // 4. Badges (7%)
        // Initial badges: Verified, Badge Paid, Top Rated (rating >= 4.8)
        const earnedBadgesCount = [
          p.isVerified,
          internal.isBadgePaid,
          rating >= 4.8
        ].filter(Boolean).length;
        const totalPossibleBadges = 3;
        const badgeScore = earnedBadgesCount / totalPossibleBadges;
        const weightedBadges = badgeScore * 0.07;

        // --- B. Availability & Activity (25%) ---
        // 1. Availability (10%)
        const availabilityScore = internal.hasValidPaymentMethod ? 1 : 0;
        const weightedAvailability = availabilityScore * 0.10;

        // 2. Last Login / Activity (15%)
        let activityScore = 0;
        if (p.lastOnline) {
          const lastOnlineDate = new Date(p.lastOnline);
          const daysSinceLastLogin = (Date.now() - lastOnlineDate.getTime()) / (1000 * 60 * 60 * 24);
          activityScore = 1 - Math.min(daysSinceLastLogin, 30) / 30;
        }
        const weightedActivity = activityScore * 0.15;

        // --- C. Experience & Reliability (15%) ---
        // 1. Seniority (8%)
        let seniorityScore = 0;
        if (p.createdAt) {
          const createdAtDate = new Date(p.createdAt);
          const monthsActive = (Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
          seniorityScore = Math.min(monthsActive, 36) / 36;
        }
        const weightedSeniority = seniorityScore * 0.08;

        // 2. Community Contribution (7%)
        const communityScore = internal.totalSessions > 0
          ? internal.completedSessions / internal.totalSessions
          : 0;
        const weightedCommunity = communityScore * 0.07;

        // --- D. Platform Health (10%) ---
        // 1. Platform Revenue (10%)
        const revenueCap = 1000;
        const revenueScore = Math.min(internal.platformRevenue || 0, revenueCap) / revenueCap;
        const weightedRevenue = revenueScore * 0.10;

        // Base Score
        const baseScore =
          weightedRating +
          weightedReviews +
          weightedProfile +
          weightedBadges +
          weightedAvailability +
          weightedActivity +
          weightedSeniority +
          weightedCommunity +
          weightedRevenue;

        // --- Location Priority (Multiplier) ---
        let locationMultiplier = 0.4;
        const searchedCity = filters.location;
        if (searchedCity && (p.location === searchedCity || p.location2 === searchedCity)) {
          locationMultiplier = 1.0;
        } else if (filters.currentLat && filters.currentLng && p.lat && p.lng) {
          // Check if within radius (default to 50km if no radius provided)
          const radiusKm = filters.radius
            ? (filters.unit === "miles" ? filters.radius * 1.60934 : filters.radius)
            : 50;
          const distance = calculateDistance(filters.currentLat, filters.currentLng, p.lat, p.lng);
          if (distance <= radiusKm) {
            locationMultiplier = 0.7;
          }
        } else {
          // If no city match and no geo search provided, but it has some location similarity
          // For now, if no searchedCity/latLng, we treat it as 1.0 to not penalize everyone
          if (!searchedCity && !filters.currentLat) {
            locationMultiplier = 1.0;
          }
        }

        let finalScore = baseScore * locationMultiplier;

        // --- System Safeguards ---
        // 1. Newbie boost
        const monthsActive = p.createdAt
          ? (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
          : 0;
        if (monthsActive < 2) finalScore += 0.05;

        // 2. Inactivity penalty
        if (p.lastOnline) {
          const daysSinceLastLogin = (Date.now() - new Date(p.lastOnline).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceLastLogin > 45) finalScore *= 0.7;
        }

        return finalScore;
      };

      return getScore(b) - getScore(a);
    });
  }

  // Apply post-query filters that can't be done in Prisma

  // Location filter (exact match, not geo)
  if (
    filters.location &&
    filters.location !== "Custom Location" &&
    filters.location !== "Current Location"
  ) {
    results = results.filter(
      (p) => p.location === filters.location || p.location2 === filters.location
    );
  }

  // Geo/radius filter
  if (filters.currentLat && filters.currentLng && filters.radius) {
    const radiusKm =
      filters.unit === "miles" ? filters.radius * 1.60934 : filters.radius;

    results = results.filter((p) => {
      if (!p.lat || !p.lng) return false;
      const distance = calculateDistance(
        filters.currentLat!,
        filters.currentLng!,
        p.lat,
        p.lng
      );
      return distance <= radiusKm;
    });
  }

  // Online status filter
  if (filters.onlineStatus) {
    const threshold = ONLINE_THRESHOLDS[filters.onlineStatus];
    if (threshold) {
      const now = Date.now();
      results = results.filter((p) => {
        if (!p.lastOnline) return false;
        const lastOnlineTime = new Date(p.lastOnline).getTime();
        return now - lastOnlineTime <= threshold;
      });
    }
  }

  // Profile picture filter
  if (filters.hasProfilePic === "yes") {
    results = results.filter((p) => !!p.image);
  } else if (filters.hasProfilePic === "no") {
    results = results.filter((p) => !p.image);
  }

  // Availability filter (when date is provided)
  if (includeAvailability && filters.date) {
    const availabilityMap = await getBulkAvailability(filters.date);

    results = results.map((p) => ({
      ...p,
      availableSlots: availabilityMap[p._id] || [],
    }));

    // Filter by time range if specified
    if (
      filters.timeRangeStart !== undefined ||
      filters.timeRangeEnd !== undefined
    ) {
      const startMins = filters.timeRangeStart ?? 0;
      const endMins = filters.timeRangeEnd ?? 1440;

      results = results.filter((p) => {
        if (!p.availableSlots || p.availableSlots.length === 0) return false;

        return p.availableSlots.some((slot) => {
          const slotMins = timeToMinutes(slot);
          return slotMins >= startMins && slotMins <= endMins;
        });
      });
    }

    // Filter out professionals with no availability
    results = results.filter(
      (p) => p.availableSlots && p.availableSlots.length > 0
    );
  }

  // Race filter
  if (filters.race) {
    results = results.filter((p) => p.race === filters.race);
  }

  // Ethnicity filter
  if (filters.ethnicity) {
    results = results.filter((p) => p.ethnicity === filters.ethnicity);
  }

  // Body Type filter
  if (filters.bodyType) {
    results = results.filter((p) => p.bodyType === filters.bodyType);
  }

  // Personality Type filter
  if (filters.personalityType) {
    results = results.filter(
      (p) => p.personalityType === filters.personalityType
    );
  }

  // Apply pagination after all filters
  const total = results.length;
  const paginatedResults = results.slice(skip, skip + limit);

  return {
    professionals: paginatedResults,
    total,
    page,
    limit,
    hasMore: skip + limit < total,
  };
}

/**
 * Get a single professional by ID
 */
export async function getProfessionalById(
  id: string
): Promise<ProfessionalDetail | null> {
  const professional = await prisma.professional.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      rating: true,
      reviewCount: true,
      rate: true,
      offersVideo: true,
      videoRate: true,
      biography: true,
      createdAt: true,
      venue: true,
      location: true,
      location2: true,
      applications: {
        select: {
          id: true,
          status: true,
          userId: true,
          user: {
            select: {
              location: true,
              location2: true,
              lastOnline: true,
              ethnicity: true,
              profileImage: true,
              photos: {
                select: { id: true, url: true },
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          feedback: true,
          createdAt: true,
          reviewer: {
            select: {
              name: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!professional) return null;

  return {
    _id: professional.id,
    name: professional.name,
    image:
      professional.applications?.[0]?.user?.profileImage ||
      professional.image ||
      undefined,
    location:
      professional.location ||
      professional.location2 ||
      professional.applications?.[0]?.user?.location ||
      professional.applications?.[0]?.user?.location2 ||
      undefined,
    location2:
      professional.location2 ||
      professional.applications?.[0]?.user?.location2 ||
      undefined,
    rating: professional.rating || undefined,
    reviewCount: professional.reviewCount || undefined,
    rate: professional.rate || undefined,
    offersVideo: professional.offersVideo,
    videoRate: professional.videoRate || undefined,
    biography: professional.biography || undefined,
    createdAt: professional.createdAt?.toISOString(),
    venue: professional.venue || undefined,
    lastOnline:
      professional.applications?.[0]?.user?.lastOnline?.toISOString() ||
      undefined,
    ethnicity: professional.applications?.[0]?.user?.ethnicity || undefined,
    userId: professional.applications?.[0]?.userId || undefined,
    status: professional.applications?.[0]?.status || undefined,
    applicationId: professional.applications?.[0]?.id || undefined,
    photos: professional.applications?.[0]?.user?.photos || [],
    reviews: professional.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      feedback: r.feedback,
      createdAt: r.createdAt.toISOString(),
      reviewer: {
        name: r.reviewer.name || "Anonymous",
        profileImage: r.reviewer.profileImage || undefined,
      },
    })),
  };
}

/**
 * Get bulk availability for all professionals on a specific date
 */
/**
 * Get bulk availability for all professionals on a specific date
 * Returns a map of ProfessionalID -> Available Slots (in Pro's Local Time)
 */
export async function getBulkAvailability(
  dateStr: string
): Promise<Record<string, string[]>> {
  // 1. Determine "Target Day" (UTC Midnight)
  // dateStr is expected to be YYYY-MM-DD
  const targetDateUTC = new Date(dateStr);
  if (isNaN(targetDateUTC.getTime())) {
    throw new Error("Invalid date format");
  }
  const dayOfWeek = targetDateUTC.getUTCDay();

  // 2. Fetch Availability + Timezone
  // We need the timezone to know what "09:00 AM" actually means in UTC
  const availabilities = await prisma.availability.findMany({
    where: { dayOfWeek },
    select: {
      professionalId: true,
      slots: true,
      professional: {
        select: {
          applications: {
            where: { status: "APPROVED" },
            select: { user: { select: { timezone: true } } },
            take: 1,
          },
        },
      },
    },
  });

  // 3. Prepare Timezone Map
  const proTimezones: Record<string, string> = {};
  availabilities.forEach((a) => {
    const timezone =
      a.professional.applications[0]?.user?.timezone || "UTC";
    proTimezones[a.professionalId] = timezone;
  });

  // 4. Fetch Bookings & Overrides (Broad Range)
  // We fetch a 48h window to be safe for all timezones
  const searchStart = new Date(targetDateUTC);
  searchStart.setUTCDate(searchStart.getUTCDate() - 1);
  const searchEnd = new Date(targetDateUTC);
  searchEnd.setUTCDate(searchEnd.getUTCDate() + 2);

  const [overrides, bookedAppointments] = await Promise.all([
    prisma.availabilityOverride.findMany({
      where: {
        startDate: { lte: searchEnd },
        endDate: { gte: searchStart },
      },
      select: { professionalId: true, startDate: true, endDate: true },
    }),
    prisma.appointment.findMany({
      where: {
        startTime: { gte: searchStart, lte: searchEnd },
        status: { in: ["upcoming", "pending", "break"] },
      },
      select: {
        professionalId: true,
        startTime: true,
        endTime: true,
      },
    }),
  ]);

  // 5. Build Availability Map (Checking Timezone-Corrected Collisions)
  const availabilityMap: Record<string, string[]> = {};

  availabilities.forEach((avail) => {
    const proId = avail.professionalId;
    const timezone = proTimezones[proId] || "UTC";

    // "This Professional's Wednesday" start/end in UTC
    // We treat the target date as occurring in THEIR timezone
    // e.g. "2026-01-28" -> "2026-01-28 00:00:00 Asia/Tokyo" converted to UTC
    const proDayStart = fromZonedTime(
      `${dateStr}T00:00:00`,
      timezone
    );
    // End of day is start + 24h
    const proDayEnd = new Date(proDayStart.getTime() + 24 * 60 * 60 * 1000);

    // Filter relevant bookings/overrides for this pro
    const proBookings = bookedAppointments.filter(
      (b) => b.professionalId === proId
    );
    const proOverrides = overrides.filter(
      (o) => o.professionalId === proId
    );

    // Check if whole day is blocked by override
    const isDayBlocked = proOverrides.some(
      (o) => o.startDate <= proDayEnd && o.endDate >= proDayStart
    );

    if (isDayBlocked) {
      availabilityMap[proId] = [];
      return;
    }

    // Check individual slots
    const availableSlots = avail.slots.filter((slot) => {
      // "09:00 AM" -> Minutes -> Date on proDayStart
      const slotMins = timeToMinutes(slot); // e.g. 540
      const slotStartUTC = new Date(
        proDayStart.getTime() + slotMins * 60000
      );
      const slotEndUTC = new Date(slotStartUTC.getTime() + 30 * 60000);

      // Check collision
      const isBooked = proBookings.some(
        (b) => slotStartUTC < b.endTime && slotEndUTC > b.startTime
      );

      // Check collision with partial overrides (if any, though we mostly do full day now)
      const isOverridden = proOverrides.some(
        (o) => slotStartUTC < o.endDate && slotEndUTC > o.startDate
      );

      return !isBooked && !isOverridden;
    });

    availabilityMap[proId] = availableSlots;
  });

  return availabilityMap;
}

/**
 * Get availability for a single professional on a specific day
 */
export async function getProfessionalAvailability(
  professionalId: string,
  dayOfWeek: number
): Promise<{ slots: string[]; breakDuration: number }> {
  const avail = await prisma.availability.findUnique({
    where: {
      professionalId_dayOfWeek: { professionalId, dayOfWeek },
    },
  });

  return {
    slots: avail?.slots ?? [],
    breakDuration: avail?.breakDuration ?? 30,
  };
}

/**
 * Update availability for a professional
 */
export async function updateProfessionalAvailability(
  professionalId: string,
  dayOfWeek: number,
  slots: string[],
  breakDuration: number
): Promise<void> {
  const existing = await prisma.availability.findFirst({
    where: { professionalId, dayOfWeek },
  });

  if (existing) {
    await prisma.availability.update({
      where: { id: existing.id },
      data: { slots, breakDuration },
    });
  } else {
    await prisma.availability.create({
      data: { professionalId, dayOfWeek, slots, breakDuration },
    });
  }
}

/**
 * Get all unique locations from professionals
 */
export async function getUniqueLocations(): Promise<string[]> {
  const [professionalLocations, userLocations] = await Promise.all([
    prisma.professional.findMany({
      where: {
        OR: [{ location: { not: null } }, { location2: { not: null } }],
      },
      select: { location: true, location2: true },
    }),
    prisma.user.findMany({
      where: {
        OR: [{ location: { not: null } }, { location2: { not: null } }],
        professionalApplication: {
          status: "APPROVED",
        },
      },
      select: { location: true, location2: true },
    }),
  ]);

  const allLocations = new Set<string>();

  professionalLocations.forEach((p) => {
    if (p.location) allLocations.add(p.location);
    if (p.location2) allLocations.add(p.location2);
  });

  userLocations.forEach((u) => {
    if (u.location) allLocations.add(u.location);
    if (u.location2) allLocations.add(u.location2);
  });

  return Array.from(allLocations).sort();
}

/**
 * Get availability overrides for a professional
 */
export async function getAvailabilityOverrides(professionalId: string) {
  return prisma.availabilityOverride.findMany({
    where: {
      professionalId,
      endDate: { gte: new Date() }, // Only future/current overrides
    },
    orderBy: { startDate: "asc" },
  });
}

/**
 * Create an availability override
 */
export async function createAvailabilityOverride(
  professionalId: string,
  startDate: Date,
  endDate: Date,
  reason?: string
) {
  return prisma.availabilityOverride.create({
    data: {
      professionalId,
      startDate,
      endDate,
      reason,
    },
  });
}

/**
 * Delete an availability override
 */
export async function deleteAvailabilityOverride(
  id: string,
  professionalId: string
) {
  return prisma.availabilityOverride.deleteMany({
    where: {
      id,
      professionalId, // Security check
    },
  });
}
