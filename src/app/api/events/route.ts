import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasValidPayoutSettings } from "@/lib/payout";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizerId = searchParams.get("organizerId");
    const publishedOnly = searchParams.get("published") === "true";
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "upcoming";
    const includePrivate = searchParams.get("includePrivate") === "true";
    const category = searchParams.get("category") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: any = {};
    if (organizerId) where.organizerId = organizerId;
    if (publishedOnly && !includePrivate) where.isPublished = true;
    if (category) where.category = category;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (filter === "upcoming") {
      where.dateTime = { gte: new Date() };
    } else if (filter === "past") {
      where.dateTime = { lt: new Date() };
    }

    if (dateFrom || dateTo) {
      where.dateTime = {
        ...where.dateTime,
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: { 
          select: { 
            id: true, 
            name: true, 
            email: true,
            payoutBankCode: true,
            payoutAccountNumber: true,
            payoutAccountName: true,
          } 
        },
        ticketTypes: true,
        _count: { select: { orders: true } },
      },
      orderBy: { dateTime: "asc" },
    });

    let processedEvents = events.map(event => {
      const hasPayout = hasValidPayoutSettings(event.organizer);
      
      const visibleTicketTypes = event.ticketTypes.map(tt => ({
        ...tt,
        isVisible: tt.price === 0 || hasPayout,
      }));

      return {
        ...event,
        slug: event.slug,
        ticketTypes: visibleTicketTypes,
        hasPayoutSettings: hasPayout,
      };
    });

    if (minPrice || maxPrice) {
      processedEvents = processedEvents.filter(event => {
        const minEventPrice = Math.min(...event.ticketTypes.map(t => t.price));
        if (minPrice && minEventPrice < parseInt(minPrice)) return false;
        if (maxPrice && minEventPrice > parseInt(maxPrice)) return false;
        return true;
      });
    }

    return NextResponse.json(processedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, description, banner, location, dateTime, isPublished,
      isOnline, streamingLink, category, targetAudience
    } = body;

    if (!title || !dateTime) {
      return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
    }

    // For online events, location is optional; for offline, location is required
    if (!isOnline && !location) {
      return NextResponse.json({ error: "Location is required for in-person events" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "ATTENDEE") {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ORGANIZER" },
      });
    }

    const event = await prisma.event.create({
      data: {
        title,
        slug: generateSlug(title),
        description,
        banner,
        location: isOnline ? "Online" : location,
        dateTime: new Date(dateTime),
        isPublished: isPublished || false,
        organizerId: user.id,
        isOnline: isOnline || false,
        streamingLink,
        category,
        targetAudience,
      },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        ticketTypes: true,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
