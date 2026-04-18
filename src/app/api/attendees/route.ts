import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const format = searchParams.get("format") || "json";

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.organizerId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const tickets = await prisma.ticket.findMany({
      where: { order: { eventId: eventId, status: "PAID" } },
      include: {
        ticketType: { select: { name: true } },
        owner: { select: { email: true, name: true } },
      },
    });

    if (format === "csv") {
      const headers = ["Ticket ID", "Ticket Type", "Email", "Name", "Status", "Used At"];
      const rows = tickets.map((t) => [
        t.ticketId,
        t.ticketType.name,
        t.owner?.email || "N/A",
        t.owner?.name || "N/A",
        t.isUsed ? "Used" : "Not Used",
        t.usedAt?.toISOString() || "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="attendees-${eventId}.csv"`,
        },
      });
    }

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching attendees:", error);
    return NextResponse.json({ error: "Failed to fetch attendees" }, { status: 500 });
  }
}