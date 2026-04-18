import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  console.log("[API /events/[slug]] GET - slug param:", slug, "type:", typeof slug);

  if (!slug || slug === "undefined" || slug === "null") {
    console.log("[API /events/[slug]] GET - invalid slug, returning 400");
    return NextResponse.json({ error: "Invalid event identifier" }, { status: 400 });
  }

  try {
    console.log("[API /events/[slug]] GET - querying by slug:", slug);
    let event = await prisma.event.findUnique({
      where: { slug: slug },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        ticketTypes: true,
      },
    });

    if (!event) {
      console.log("[API /events/[slug]] GET - not found by slug, trying by id:", slug);
      event = await prisma.event.findUnique({
        where: { id: slug },
        include: {
          organizer: { select: { id: true, name: true, email: true } },
          ticketTypes: true,
        },
      });
    }

    if (!event) {
      console.log("[API /events/[slug]] GET - event not found, returning 404");
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    console.log("[API /events/[slug]] GET - event found:", event.id, event.slug, event.title);
    return NextResponse.json(event);
  } catch (error) {
    console.error("[API /events/[slug]] GET - error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: slug },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || (event.organizerId !== user.id && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, banner, location, dateTime, isPublished } = body;

    const updatedEvent = await prisma.event.update({
      where: { id: slug },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(banner !== undefined && { banner }),
        ...(location && { location }),
        ...(dateTime && { dateTime: new Date(dateTime) }),
        ...(isPublished !== undefined && { isPublished }),
      },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        ticketTypes: true,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: slug },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || (event.organizerId !== user.id && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.event.delete({ where: { id: slug } });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}