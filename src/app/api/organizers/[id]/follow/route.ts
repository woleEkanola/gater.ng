import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.id === params.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: params.id,
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
          followingId: params.id,
        },
      });
      return NextResponse.json({ isFollowing: true });
    }
  } catch (error) {
    console.error("Error toggling follow:", error);
    return NextResponse.json({ error: "Failed to toggle follow" }, { status: 500 });
  }
}