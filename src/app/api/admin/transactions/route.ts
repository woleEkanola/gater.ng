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

    const orders = await prisma.order.findMany({
      where: { status: "PAID" },
      include: {
        event: { select: { title: true } },
        buyer: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const transactions = orders.map(order => ({
      id: order.id,
      amount: order.amount,
      createdAt: order.createdAt,
      event: { title: order.event.title },
      buyer: { name: order.buyer?.name, email: order.buyer?.email },
    }));

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}