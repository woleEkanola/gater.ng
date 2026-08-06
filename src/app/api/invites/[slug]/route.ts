import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { publicInviteShape } from "@/lib/invitations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const invite = await prisma.eventInvite.findUnique({
      where: { publicSlug: slug },
      include: { event: true },
    });
    if (!invite || invite.status !== "ACTIVE") return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    return NextResponse.json(publicInviteShape(invite));
  } catch (error) {
    console.error("Error fetching public invitation:", error);
    return NextResponse.json({ error: "Failed to fetch invitation" }, { status: 500 });
  }
}
