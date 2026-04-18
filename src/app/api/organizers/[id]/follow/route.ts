import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  let isFollowing = false;

  if (session?.user?.id) {
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: id,
        },
      },
    });
    isFollowing = !!existingFollow;
  }

  const followerCount = await prisma.follow.count({
    where: { followingId: id },
  });

  return NextResponse.json({ isFollowing, followerCount });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please login to follow this organizer" }, { status: 401 });
    }

    if (session.user.id === id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: id,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      return NextResponse.json({ isFollowing: false });
    } else {
      await prisma.follow.create({
        data: {
          followerId: session.user.id,
          followingId: id,
        },
      });
      return NextResponse.json({ isFollowing: true });
    }
  } catch (error) {
    console.error("Error toggling follow:", error);
    return NextResponse.json({ error: "Failed to toggle follow" }, { status: 500 });
  }
}