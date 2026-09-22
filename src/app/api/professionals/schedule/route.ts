// src/app/api/professionals/schedule/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fromZonedTime } from "date-fns-tz";

interface Appointment {
  id: string;
  startTime: Date;
  endTime: Date;
}

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    reason?: string;
  };
}

interface WorkingHour {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface AvailableRange {
  start: string; // ISO
  end: string; // ISO
}

/* ---------- helpers ---------- */
const BUFFER_MINUTES = 30;
const SLOT_DURATION = 30; // Each slot is 30 minutes

/**
 * Convert time string like "12:00 AM", "1:30 PM" to minutes since midnight
 */
const timeToMinutes = (time: string): number => {
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    console.error(`Invalid time format: ${time}`);
    return 0;
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  // Convert to 24-hour format
  if (period === "AM") {
    if (hours === 12) hours = 0; // 12:00 AM = 00:00
  } else {
    // PM
    if (hours !== 12) hours += 12; // 1:00 PM = 13:00, but 12:00 PM = 12:00
  }

  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to "HH:MM" format
 */
const minutesToTime = (mins: number): string => {
  // Handle 24:00 (midnight next day) as "24:00" for end times
  if (mins >= 1440) {
    return "24:00";
  }
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/**
 * Merge contiguous time slots into working hour blocks
 * e.g., ["12:00 AM", "12:30 AM", "1:00 AM"] -> [{ startTime: "00:00", endTime: "01:30" }]
 */
const mergeContiguousSlots = (
  slots: string[]
): Omit<WorkingHour, "dayOfWeek">[] => {
  if (!slots || slots.length === 0) return [];

  // Convert all slots to minutes and sort
  const sortedMins = slots.map(timeToMinutes).sort((a, b) => a - b);

  // Remove duplicates
  const uniqueMins = [...new Set(sortedMins)];

  if (uniqueMins.length === 0) return [];

  const blocks: { start: number; end: number }[] = [];

  let blockStart = uniqueMins[0];
  let blockEnd = uniqueMins[0] + SLOT_DURATION;

  for (let i = 1; i < uniqueMins.length; i++) {
    const currentSlotStart = uniqueMins[i];

    // Check if this slot is contiguous with the current block
    // A slot is contiguous if it starts exactly where the previous slot ends
    if (currentSlotStart === blockEnd) {
      // Extend the current block
      blockEnd = currentSlotStart + SLOT_DURATION;
    } else if (currentSlotStart < blockEnd) {
      // Overlapping slot (shouldn't happen, but handle it)
      blockEnd = Math.max(blockEnd, currentSlotStart + SLOT_DURATION);
    } else {
      // Gap detected - save current block and start new one
      blocks.push({ start: blockStart, end: blockEnd });
      blockStart = currentSlotStart;
      blockEnd = currentSlotStart + SLOT_DURATION;
    }
  }

  // Don't forget the last block
  blocks.push({ start: blockStart, end: blockEnd });

  // Convert to WorkingHour format
  return blocks.map((b) => ({
    startTime: minutesToTime(b.start),
    endTime: minutesToTime(b.end),
  }));
};

/* ---------- GET ---------- */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const professionalId = searchParams.get("professionalId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!professionalId || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing professionalId, startDate, or endDate" },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  try {
    /* ---- 1. FETCH ONLY REAL APPOINTMENTS ---- */
    const appointments: Appointment[] = await prisma.appointment.findMany({
      where: {
        professionalId,
        startTime: { lt: end },
        endTime: { gt: start },
        status: { in: ["upcoming", "pending"] },
      },
      select: { id: true, startTime: true, endTime: true },
    });

    /* ---- 1.5. FETCH OVERRIDES ---- */
    const overrides = await prisma.availabilityOverride.findMany({
      where: {
        professionalId,
        startDate: { lt: end },
        endDate: { gt: start },
      },
      // Ensure we select the reason field
      // select: { id: true, startDate: true, endDate: true, reason: true }, 
    });

    /* ---- 2. BUILD EVENTS WITH DYNAMIC BUFFERS ---- */
    const events: Event[] = [];

    // Add overrides as events
    overrides.forEach((override) => {
      events.push({
        id: `override-${override.id}`,
        title: "Unavailable",
        start: override.startDate < start ? start : override.startDate,
        end: override.endDate > end ? end : override.endDate,
        resource: {
          reason: override.reason || "Professional is unavailable.",
        },
      });
    });

    const sortedAppointments = [...appointments].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    sortedAppointments.forEach((appointment, index) => {
      events.push({
        id: appointment.id,
        title: "Booked",
        start: appointment.startTime,
        end: appointment.endTime,
      });

      const bufferStart = new Date(appointment.endTime);
      const bufferEnd = new Date(
        bufferStart.getTime() + BUFFER_MINUTES * 60 * 1000
      );

      const nextAppointment = sortedAppointments[index + 1];

      if (nextAppointment) {
        if (nextAppointment.startTime < bufferEnd) {
          if (nextAppointment.startTime > bufferStart) {
            events.push({
              id: `buf-${appointment.id}`,
              title: "Blocked (Buffer)",
              start: bufferStart,
              end: nextAppointment.startTime,
            });
          }
        } else {
          events.push({
            id: `buf-${appointment.id}`,
            title: "Blocked (Buffer)",
            start: bufferStart,
            end: bufferEnd,
          });
        }
      } else {
        events.push({
          id: `buf-${appointment.id}`,
          title: "Blocked (Buffer)",
          start: bufferStart,
          end: bufferEnd,
        });
      }
    });

    /* ---- 3. CALCULATE AVAILABLE RANGES (UTC) & WORKING HOURS ---- */

    // Fetch Pro's Timezone
    const proApp = await prisma.professionalApplication.findFirst({
      where: { professionalId, status: "APPROVED" },
      select: { user: { select: { timezone: true } } },
    });
    const timezone = proApp?.user?.timezone || "UTC";

    const weekly = await prisma.availability.findMany({
      where: { professionalId },
      select: { dayOfWeek: true, slots: true },
    });

    // --- Generate workingHours for frontend backward compatibility ---
    const workingHours: WorkingHour[] = [];

    if (weekly && weekly.length > 0) {
      weekly.forEach((dayData) => {
        const blocks = mergeContiguousSlots(dayData.slots);
        blocks.forEach((block) => {
          workingHours.push({
            dayOfWeek: dayData.dayOfWeek,
            startTime: block.startTime,
            endTime: block.endTime,
          });
        });
      });
    }
    // ----------------------------------------------------------------

    const availableRanges: AvailableRange[] = [];
    const currentIter = new Date(start);
    // Extend iteration window slightly to cover overlapping timezone shifts
    currentIter.setUTCDate(currentIter.getUTCDate() - 1);
    const endIter = new Date(end);
    endIter.setUTCDate(endIter.getUTCDate() + 1);

    while (currentIter <= endIter) {
      // 1. Construct Pro's Day Start in UTC
      const year = currentIter.getFullYear();
      const month = String(currentIter.getMonth() + 1).padStart(2, "0");
      const day = String(currentIter.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      // Get Pro's Day Start in UTC
      const proDayStartUTC = fromZonedTime(`${dateStr}T00:00:00`, timezone);
      const proDayOfWeek = new Date(dateStr).getDay(); // 0-6 based on local date

      const rule = weekly.find((r) => r.dayOfWeek === proDayOfWeek);

      if (rule?.slots && rule.slots.length > 0) {
        // Merge slots first to reduce items
        const blocks = mergeContiguousSlots(rule.slots);

        blocks.forEach((block) => {
          // Convert block start/end (e.g. "09:00", "17:00") to UTC for THIS specific day
          const [sh, sm] = block.startTime.split(":").map(Number);
          const [eh, em] = block.endTime.split(":").map(Number);

          const rangeStartUTC = new Date(proDayStartUTC);
          rangeStartUTC.setMinutes(rangeStartUTC.getMinutes() + sh * 60 + sm);

          const rangeEndUTC = new Date(proDayStartUTC);
          rangeEndUTC.setMinutes(rangeEndUTC.getMinutes() + eh * 60 + em);

          availableRanges.push({
            start: rangeStartUTC.toISOString(),
            end: rangeEndUTC.toISOString(),
          });
        });
      }

      currentIter.setDate(currentIter.getDate() + 1);
    }

    // Return events, availableRanges AND workingHours
    return NextResponse.json({ events, availableRanges, workingHours }, { status: 200 });

  } catch (err) {
    console.error("Schedule fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}