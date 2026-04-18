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

    const faqs = await prisma.faq.findMany({
      where: { 
        eventId,
        ...(includeHidden ? {} : { isVisible: true }),
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(faqs);
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, question, answer } = body;

    if (!eventId || !question || !answer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify user owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || event.organizerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const faq = await prisma.faq.create({
      data: { eventId, question, answer },
    });

    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const faqId = searchParams.get("id");

    if (!faqId) {
      return NextResponse.json({ error: "FAQ ID required" }, { status: 400 });
    }

    const faq = await prisma.faq.findUnique({
      where: { id: faqId },
      include: { event: true },
    });

    if (!faq) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || faq.event.organizerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.faq.delete({ where: { id: faqId } });

    return NextResponse.json({ message: "FAQ deleted" });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, isVisible, eventId, showAll } = body;

    if (showAll && eventId) {
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
      
      if (!event || !user || event.organizerId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const faqs = await prisma.faq.findMany({ where: { eventId } });
      await prisma.faq.updateMany({
        where: { eventId },
        data: { isVisible },
      });

      return NextResponse.json({ message: `All FAQs ${isVisible ? "shown" : "hidden"}` });
    }

    if (!id) {
      return NextResponse.json({ error: "FAQ ID or eventId required" }, { status: 400 });
    }

    const faq = await prisma.faq.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!faq) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || faq.event.organizerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.faq.update({
      where: { id },
      data: { isVisible },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error toggling FAQ visibility:", error);
    return NextResponse.json({ error: "Failed to toggle visibility" }, { status: 500 });
  }
}