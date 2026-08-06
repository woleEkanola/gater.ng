import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 3) {
      return NextResponse.json([]);
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;

    const res = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "Hitix Event Platform/1.0 (contact@hitix.online)",
        "Accept-Language": "en",
      },
    });

    if (!res.ok) {
      console.error("Nominatim error:", res.status, res.statusText);
      return NextResponse.json(
        { error: "Search service unavailable" },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Location search error:", error);
    return NextResponse.json(
      { error: "Failed to search locations" },
      { status: 500 }
    );
  }
}
