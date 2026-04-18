import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const includeHidden = searchParams.get("includeHidden") === "true";

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const speakers = await prisma.speaker.findMany({
      where: { 
        eventId,
        ...(includeHidden ? {} : { isVisible: true }),
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(speakers);
  } catch (error) {
    console.error("Error fetching speakers:", error);
    return NextResponse.json({ error: "Failed to fetch speakers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, name, bio, image, title, company } = body;

    if (!eventId || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 403 });
    }

    const speaker = await prisma.speaker.create({
      data: {
        eventId,
        name,
        bio,
        image,
        title,
        company,
      },
    });

    return NextResponse.json(speaker);
  } catch (error) {
    console.error("Error creating speaker:", error);
    return NextResponse.json({ error: "Failed to create speaker" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, bio, image, title, company, isVisible, eventId, showAll } = body;

    if (showAll && eventId) {
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
      
      if (!event || !user || event.organizerId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await prisma.speaker.updateMany({
        where: { eventId },
        data: { isVisible },
      });

      return NextResponse.json({ message: `All ${isVisible ? "shown" : "hidden"}` });
    }

    if (!id || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const speaker = await prisma.speaker.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!speaker || speaker.event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Speaker not found or unauthorized" }, { status: 403 });
    }

    const updated = await prisma.speaker.update({
      where: { id },
      data: { name, bio, image, title, company },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating speaker:", error);
    return NextResponse.json({ error: "Failed to update speaker" }, { status: 500 });
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

    const speaker = await prisma.speaker.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!speaker || speaker.event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Speaker not found or unauthorized" }, { status: 403 });
    }

    await prisma.speaker.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting speaker:", error);
    return NextResponse.json({ error: "Failed to delete speaker" }, { status: 500 });
  }
}