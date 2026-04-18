import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  let isFollowing = false;

  if (session?.user?.id) {
    const existingFollow = await prisma.eventFollow.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: event.id,
        },
      },
    });
    isFollowing = !!existingFollow;
  }

  const followerCount = await prisma.eventFollow.count({
    where: { eventId: event.id },
  });

  return NextResponse.json({ isFollowing, followerCount });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login to follow this event" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const existingFollow = await prisma.eventFollow.findUnique({
    where: {
      userId_eventId: {
        userId: session.user.id,
        eventId: event.id,
      },
    },
  });

  if (existingFollow) {
    await prisma.eventFollow.delete({
      where: { id: existingFollow.id },
    });
    return NextResponse.json({ isFollowing: false });
  } else {
    await prisma.eventFollow.create({
      data: {
        userId: session.user.id,
        eventId: event.id,
      },
    });
    return NextResponse.json({ isFollowing: true });
  }
}