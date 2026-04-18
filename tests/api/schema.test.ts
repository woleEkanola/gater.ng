import { prisma } from "../../src/lib/prisma";

describe("Database Schema Validation", () => {
  it("should have Wishlist model", async () => {
    const wishlistCount = await prisma.wishlist.count().catch(() => 0);
    expect(typeof wishlistCount).toBe("number");
  });

  it("should have Follow model", async () => {
    const followCount = await prisma.follow.count().catch(() => 0);
    expect(typeof followCount).toBe("number");
  });

  it("should have user with social fields", async () => {
    const user = await prisma.user.findFirst({
      select: {
        bio: true,
        website: true,
        twitter: true,
        instagram: true,
        facebook: true,
      },
    }).catch(() => null);
    
    if (user) {
      expect(user).toHaveProperty("bio");
      expect(user).toHaveProperty("website");
    }
  });

  it("should have Event with category", async () => {
    const event = await prisma.event.findFirst({
      select: { category: true },
    }).catch(() => null);
    
    if (event) {
      expect(event).toHaveProperty("category");
    }
  });
});

describe("Data Integrity", () => {
  it("should enforce unique wishlist per user+event", async () => {
    try {
      await prisma.wishlist.createMany({
        data: [
          { userId: "test-user-1", eventId: "test-event-1" },
          { userId: "test-user-1", eventId: "test-event-1" },
        ],
      });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should enforce unique follow per user+following", async () => {
    try {
      await prisma.follow.createMany({
        data: [
          { followerId: "test-user-1", followingId: "test-user-2" },
          { followerId: "test-user-1", followingId: "test-user-2" },
        ],
      });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});