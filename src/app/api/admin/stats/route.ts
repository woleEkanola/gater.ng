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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    const userRole = user?.role as string;
    if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const [totalUsers, totalOrganizers, totalEvents, publishedEvents, orders] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ORGANIZER" } }),
      prisma.event.count(),
      prisma.event.count({ where: { isPublished: true } }),
      prisma.order.findMany({
        where: { status: "PAID" },
        include: { event: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalRevenue = orders.reduce((acc, order) => {
      const platformFee = order.amount * 5 / 100;
      return acc + platformFee;
    }, 0);

    return NextResponse.json({
      totalUsers,
      totalOrganizers,
      totalEvents,
      publishedEvents,
      totalRevenue,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}