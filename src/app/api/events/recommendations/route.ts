import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    let preferredCategories: string[] = [];
    
    if (session?.user?.id) {
      const wishlist = await prisma.wishlist.findMany({
        where: { userId: session.user.id },
        include: {
          event: { select: { category: true } },
        },
      });
      
      const categoryCounts = wishlist.reduce((acc, item) => {
        if (item.event.category) {
          acc[item.event.category] = (acc[item.event.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      preferredCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);
    }

    const where: any = {
      isPublished: true,
      dateTime: { gte: new Date() },
    };

    if (preferredCategories.length > 0) {
      where.category = { in: preferredCategories };
    }

    let events = await prisma.event.findMany({
      where,
      include: {
        organizer: { select: { id: true, name: true } },
        ticketTypes: true,
        _count: { select: { orders: true } },
      },
      orderBy: [
        { dateTime: "asc" },
      ],
      take: 8,
    });

    if (session?.user?.id) {
      const wishlistedEventIds = await prisma.wishlist.findMany({
        where: { userId: session.user.id },
        select: { eventId: true },
      });
      const wishlistedIds = new Set(wishlistedEventIds.map((w) => w.eventId));
      events = events.filter((e) => !wishlistedIds.has(e.id));
    }

    if (events.length < 4 && preferredCategories.length > 0) {
      const fallbackEvents = await prisma.event.findMany({
        where: {
          isPublished: true,
          dateTime: { gte: new Date() },
          id: { notIn: events.map((e) => e.id) },
        },
        include: {
          organizer: { select: { id: true, name: true } },
          ticketTypes: true,
          _count: { select: { orders: true } },
        },
        orderBy: { dateTime: "asc" },
        take: 8 - events.length,
      });
      events = [...events, ...fallbackEvents];
    }

    const processedEvents = events.map((event) => ({
      ...event,
      minPrice: Math.min(...event.ticketTypes.map((t) => t.price)),
    }));

    return NextResponse.json({
      events: processedEvents,
      basedOn: preferredCategories.length > 0 
        ? `Based on your interest in ${preferredCategories.join(", ")}` 
        : "Popular events",
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}