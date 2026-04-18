import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "./rate-limit-config";

export async function withRateLimit(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiterName: string = "default"
) {
  const result = await rateLimit(limiterName, request);
  
  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: result.headers }
    );
  }
  
  const response = await handler(request);
  
  Object.entries(result.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}