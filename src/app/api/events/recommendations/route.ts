import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    let preferredTags: string[] = [];
    let preferredCategories: string[] = [];
    
    if (session?.user?.id) {
      const wishlist = await prisma.wishlist.findMany({
        where: { userId: session.user.id },
        include: {
          event: { 
            select: { 
              category: true,
              tags: { select: { id: true } },
            } 
          },
        },
      });
      
      const categoryCounts = wishlist.reduce((acc, item) => {
        if (item.event.category) {
          acc[item.event.category] = (acc[item.event.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const tagCounts = wishlist.reduce((acc, item) => {
        item.event.tags.forEach((tag) => {
          acc[tag.id] = (acc[tag.id] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);
      
      preferredCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);
        
      preferredTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tagId]) => tagId);
    }

    const where: any = {
      isPublished: true,
      dateTime: { gte: new Date() },
    };

    if (preferredTags.length > 0) {
      where.tags = { some: { id: { in: preferredTags } } };
    } else if (preferredCategories.length > 0) {
      where.category = { in: preferredCategories };
    }

    let events = await prisma.event.findMany({
      where,
      include: {
        organizer: { select: { id: true, name: true } },
        ticketTypes: true,
        tags: true,
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

    if (events.length < 4 && (preferredTags.length > 0 || preferredCategories.length > 0)) {
      const excludeIds = events.map((e) => e.id);
      let fallbackWhere: any = {
        isPublished: true,
        dateTime: { gte: new Date() },
        id: { notIn: excludeIds },
      };

      if (preferredTags.length > 0) {
        fallbackWhere.tags = { some: { id: { in: preferredTags } } };
      } else if (preferredCategories.length > 0) {
        fallbackWhere.category = { in: preferredCategories };
      }

      const fallbackEvents = await prisma.event.findMany({
        where: fallbackWhere,
        include: {
          organizer: { select: { id: true, name: true } },
          ticketTypes: true,
          tags: true,
          _count: { select: { orders: true } },
        },
        orderBy: { dateTime: "asc" },
        take: 8 - events.length,
      });
      events = [...events, ...fallbackEvents];
    }

    if (events.length < 4) {
      const finalWhere: any = {
        isPublished: true,
        dateTime: { gte: new Date() },
        id: { notIn: events.map((e) => e.id) },
      };
      
      const moreEvents = await prisma.event.findMany({
        where: finalWhere,
        include: {
          organizer: { select: { id: true, name: true } },
          ticketTypes: true,
          tags: true,
          _count: { select: { orders: true } },
        },
        orderBy: { dateTime: "asc" },
        take: 8 - events.length,
      });
      events = [...events, ...moreEvents];
    }

    const processedEvents = events.map((event) => ({
      ...event,
      minPrice: Math.min(...event.ticketTypes.map((t) => t.price)),
    }));

    return NextResponse.json({
      events: processedEvents,
      basedOn: preferredTags.length > 0 || preferredCategories.length > 0 
        ? `Based on your interests` 
        : "Popular events",
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}