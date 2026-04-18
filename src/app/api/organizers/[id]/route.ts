import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const organizer = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        website: true,
        twitter: true,
        instagram: true,
        facebook: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            events: {
              where: { isPublished: true },
            },
          },
        },
        events: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            slug: true,
            banner: true,
            location: true,
            dateTime: true,
            ticketTypes: {
              select: {
                price: true,
                quantity: true,
                soldCount: true,
              },
            },
          },
          orderBy: { dateTime: "asc" },
        },
      },
    });

    if (!organizer) {
      return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    let isFollowing = false;
    if (session?.user?.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: id,
          },
        },
      });
      isFollowing = !!follow;
    }

    const eventsWithMeta = organizer.events.map((event) => {
      const totalTickets = event.ticketTypes.reduce((acc, t) => acc + t.quantity, 0);
      const soldTickets = event.ticketTypes.reduce((acc, t) => acc + t.soldCount, 0);
      const minPrice = Math.min(...event.ticketTypes.map((t) => t.price));
      return {
        ...event,
        minPrice,
        totalTickets,
        soldTickets,
        ticketsLeft: totalTickets - soldTickets,
      };
    });

    const upcomingEvents = eventsWithMeta.filter((e) => new Date(e.dateTime) >= new Date());
    const pastEvents = eventsWithMeta.filter((e) => new Date(e.dateTime) < new Date());

    return NextResponse.json({
      ...organizer,
      followerCount: organizer._count.followers,
      followingCount: organizer._count.following,
      isFollowing,
      upcomingEvents,
      pastEvents,
    });
  } catch (error) {
    console.error("Error fetching organizer:", error);
    return NextResponse.json({ error: "Failed to fetch organizer" }, { status: 500 });
  }
}