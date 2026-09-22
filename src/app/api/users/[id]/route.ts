// src\app\api\users\[id]\route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  phoneNumber: z.string().min(1, "Phone number is required").optional(),
  profileImage: z.string().url().nullable().optional(),
  location: z
    .string()
    .max(500, "Location must be 500 characters or less")
    .nullish()
    .transform((val) => val || null),
  location2: z
    .string()
    .max(500, "Location must be 500 characters or less")
    .nullish()
    .transform((val) => val || null),
  timezone: z.string().nullish().transform((val) => val || null),
  biography: z
    .string()
    .max(500, "Biography must be 500 characters or less")
    .nullish()
    .transform((val) => val || null),
  relationshipStatus: z
    .string()
    .max(50, "Relationship status must be 50 characters or less")
    .nullish()
    .transform((val) => val || null),
  orientation: z
    .string()
    .max(50, "Orientation must be 50 characters or less")
    .nullish()
    .transform((val) => val || null),
  height: z
    .string()
    .max(20, "Height must be 20 characters or less")
    .nullish()
    .transform((val) => val || null),
  ethnicity: z
    .string()
    .max(50, "Ethnicity must be 50 characters or less")
    .nullish()
    .transform((val) => val || null),
  zodiacSign: z
    .string()
    .max(20, "Zodiac sign must be 20 characters or less")
    .nullish()
    .transform((val) => val || null),
  favoriteColor: z
    .string()
    .max(30, "Favorite color must be 30 characters or less")
    .nullish()
    .transform((val) => val || null),
  favoriteMedia: z
    .string()
    .max(100, "Favorite movie/TV show must be 100 characters or less")
    .nullish()
    .transform((val) => val || null),
  petOwnership: z
    .string()
    .max(50, "Pet ownership must be 50 characters or less")
    .nullish()
    .transform((val) => val || null),
  status: z.enum(["active", "suspended"]).optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        profileImage: true,
        lastOnline: true,
        location: true,
        location2: true,
        timezone: true,
        biography: true,
        relationshipStatus: true,
        orientation: true,
        height: true,
        ethnicity: true,
        zodiacSign: true,
        favoriteColor: true,
        favoriteMedia: true,
        petOwnership: true,
        status: true,
        createdAt: true,
        heardFrom: true,
        heardFromOther: true,
        username: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name:
        user.name ||
        (user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : "Unknown User"),
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      profileImage: user.profileImage || "",
      lastOnline: user.lastOnline || "",
      location: user.location || "",
      location2: user.location2 || "",
      timezone: user.timezone || "UTC",
      biography: user.biography || "",
      relationshipStatus: user.relationshipStatus || "",
      orientation: user.orientation || "",
      height: user.height || "",
      ethnicity: user.ethnicity || "",
      zodiacSign: user.zodiacSign || "",
      favoriteColor: user.favoriteColor || "",
      favoriteMedia: user.favoriteMedia || "",
      petOwnership: user.petOwnership || "",
      status: user.status,
      createdAt: user.createdAt,
      heardFrom: user.heardFrom || null,
      heardFromOther: user.heardFromOther || null,
      username: user.username || null,
    });
  } catch (error) {
    console.error("GET /users/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });
    if (!currentUser?.isAdmin && session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id },
      include: { professionalApplication: { include: { professional: true } } },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // === USER UPDATE DATA ===
    const userUpdateData: Prisma.UserUpdateInput = {};
    if (validatedData.name) userUpdateData.name = validatedData.name;
    if (validatedData.firstName)
      userUpdateData.firstName = validatedData.firstName;
    if (validatedData.lastName)
      userUpdateData.lastName = validatedData.lastName;
    if (validatedData.phoneNumber)
      userUpdateData.phoneNumber = validatedData.phoneNumber;
    if (validatedData.profileImage !== undefined)
      userUpdateData.profileImage = validatedData.profileImage;
    if (validatedData.location)
      userUpdateData.location = validatedData.location;
    if (validatedData.location2)
      userUpdateData.location2 = validatedData.location2;
    if (validatedData.timezone) userUpdateData.timezone = validatedData.timezone;
    if (validatedData.biography)
      userUpdateData.biography = validatedData.biography;
    if (validatedData.relationshipStatus)
      userUpdateData.relationshipStatus = validatedData.relationshipStatus;
    if (validatedData.orientation)
      userUpdateData.orientation = validatedData.orientation;
    if (validatedData.height) userUpdateData.height = validatedData.height;
    if (validatedData.ethnicity)
      userUpdateData.ethnicity = validatedData.ethnicity;
    if (validatedData.zodiacSign)
      userUpdateData.zodiacSign = validatedData.zodiacSign;
    if (validatedData.favoriteColor)
      userUpdateData.favoriteColor = validatedData.favoriteColor;
    if (validatedData.favoriteMedia)
      userUpdateData.favoriteMedia = validatedData.favoriteMedia;
    if (validatedData.petOwnership)
      userUpdateData.petOwnership = validatedData.petOwnership;
    if (validatedData.status) userUpdateData.status = validatedData.status;

    // === UPDATE USER ===
    const updatedUser = await prisma.user.update({
      where: { id },
      data: userUpdateData,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        profileImage: true,

        location: true,
        location2: true,
        biography: true,
        relationshipStatus: true,
        orientation: true,
        height: true,
        ethnicity: true,
        zodiacSign: true,
        favoriteColor: true,
        favoriteMedia: true,
        petOwnership: true,
        status: true,
        username: true,
      },
    });

    // === UPDATE PROFESSIONAL (AFTER USER) ===
    const hasProfessionalUpdates =
      validatedData.name ||
      validatedData.profileImage !== undefined ||
      validatedData.biography ||
      validatedData.location ||
      validatedData.location2;

    if (user.professionalApplication?.professional && hasProfessionalUpdates) {
      const professionalUpdate: Prisma.ProfessionalUpdateInput = {};
      if (validatedData.name) professionalUpdate.name = validatedData.name;
      if (validatedData.profileImage !== undefined)
        professionalUpdate.image = validatedData.profileImage;
      if (validatedData.biography)
        professionalUpdate.biography = validatedData.biography;
      if (validatedData.location)
        professionalUpdate.location = validatedData.location;
      if (validatedData.location2)
        professionalUpdate.location2 = validatedData.location2;

      await prisma.professional.update({
        where: { id: user.professionalApplication.professionalId! },
        data: professionalUpdate,
      });
    }

    // === RETURN RESPONSE ===
    return NextResponse.json({
      id: updatedUser.id,
      name:
        updatedUser.name ||
        `${updatedUser.firstName} ${updatedUser.lastName}`.trim() ||
        "User",
      firstName: updatedUser.firstName || "",
      lastName: updatedUser.lastName || "",
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber || "",
      profileImage: updatedUser.profileImage || "",
      location: updatedUser.location || "",
      location2: updatedUser.location2 || "",
      timezone: (updatedUser as any).timezone || "UTC",
      biography: updatedUser.biography || "",
      relationshipStatus: updatedUser.relationshipStatus || "",
      orientation: updatedUser.orientation || "",
      height: updatedUser.height || "",
      ethnicity: updatedUser.ethnicity || "",
      zodiacSign: updatedUser.zodiacSign || "",
      favoriteColor: updatedUser.favoriteColor || "",
      favoriteMedia: updatedUser.favoriteMedia || "",
      petOwnership: updatedUser.petOwnership || "",
      status: updatedUser.status,
      username: updatedUser.username || null,
    });
  } catch (error: unknown) {
    console.error("PATCH /users/[id] error:", error);
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json(
      { error: (error as Error).message || "Update failed" },
      { status: 500 }
    );
  }
}
