import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const gallery = await prisma.eventGallery.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(gallery);
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, image, caption } = body;

    if (!eventId || !image) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 403 });
    }

    const gallery = await prisma.eventGallery.create({
      data: {
        eventId,
        image,
        caption,
      },
    });

    return NextResponse.json(gallery);
  } catch (error) {
    console.error("Error creating gallery item:", error);
    return NextResponse.json({ error: "Failed to create gallery item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const gallery = await prisma.eventGallery.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!gallery || gallery.event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Gallery item not found or unauthorized" }, { status: 403 });
    }

    await prisma.eventGallery.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting gallery item:", error);
    return NextResponse.json({ error: "Failed to delete gallery item" }, { status: 500 });
  }
}