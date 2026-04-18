import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wishlist = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            banner: true,
            location: true,
            dateTime: true,
            organizer: {
              select: {
                id: true,
                name: true,
              },
            },
            ticketTypes: {
              select: {
                price: true,
                quantity: true,
                soldCount: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const events = wishlist.map((w) => {
      const event = w.event;
      const minPrice = Math.min(...event.ticketTypes.map((t) => t.price));
      const totalTickets = event.ticketTypes.reduce((acc, t) => acc + t.quantity, 0);
      const soldTickets = event.ticketTypes.reduce((acc, t) => acc + t.soldCount, 0);
      return {
        ...event,
        minPrice,
        ticketsLeft: totalTickets - soldTickets,
      };
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await request.json();

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ isWishlisted: false });
    } else {
      await prisma.wishlist.create({
        data: {
          userId: session.user.id,
          eventId,
        },
      });
      return NextResponse.json({ isWishlisted: true });
    }
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    return NextResponse.json({ error: "Failed to toggle wishlist" }, { status: 500 });
  }
}