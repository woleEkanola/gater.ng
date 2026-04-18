import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const audienceTypes = await prisma.audienceType.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    return NextResponse.json(audienceTypes);
  } catch (error) {
    console.error("Error fetching audience types:", error);
    return NextResponse.json({ error: "Failed to fetch audience types" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Audience type name is required" }, { status: 400 });
    }

    const existing = await prisma.audienceType.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const audienceType = await prisma.audienceType.create({
      data: {
        name,
        isCustom: true,
      },
    });

    return NextResponse.json(audienceType, { status: 201 });
  } catch (error) {
    console.error("Error creating audience type:", error);
    return NextResponse.json({ error: "Failed to create audience type" }, { status: 500 });
  }
}