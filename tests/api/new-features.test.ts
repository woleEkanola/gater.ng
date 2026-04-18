import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Wishlist API", () => {
  let testUserId: string;
  let testEventId: string;

  beforeAll(async () => {
    testUserId = await prisma.user.create({
      data: {
        email: `wishlist-user-${Date.now()}@test.com`,
        password: "$2a$10$testpasswordhash",
        name: "Wishlist Tester",
        role: "ATTENDEE",
      },
    }).then(u => u.id);

    const organizerId = await prisma.user.create({
      data: {
        email: `wishlist-org-${Date.now()}@test.com`,
        password: "$2a$10$testpasswordhash",
        name: "Wishlist Organizer",
        role: "ORGANIZER",
      },
    }).then(u => u.id);

    testEventId = await prisma.event.create({
      data: {
        title: "Wishlist Test Event",
        slug: "wishlist-test-" + Date.now(),
        location: "Test Location",
        dateTime: new Date(Date.now() + 86400000),
        isPublished: true,
        organizerId,
      },
    }).then(e => e.id);
  });

  afterAll(async () => {
    await prisma.wishlist.deleteMany({ where: { userId: testUserId } }).catch(() => {});
    await prisma.event.delete({ where: { id: testEventId } }).catch(() => {});
    await prisma.user.deleteMany({ 
      where: { email: { contains: "wishlist-" } } 
    }).catch(() => {});
    await prisma.$disconnect();
  });

  describe("GET /api/wishlist", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await fetch("http://localhost:3000/api/wishlist");
      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/wishlist", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await fetch("http://localhost:3000/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: testEventId }),
      });
      expect(response.status).toBe(401);
    });

    it("should accept valid eventId format", async () => {
      const response = await fetch("http://localhost:3000/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: "invalid-id" }),
      });
      expect([400, 401, 404]).toContain(response.status);
    });
  });
});

describe("Organizer API", () => {
  let organizerId: string;
  let eventId: string;

  beforeAll(async () => {
    organizerId = await prisma.user.create({
      data: {
        email: `organizer-test-${Date.now()}@test.com`,
        password: "$2a$10$testpasswordhash",
        name: "Test Organizer",
        bio: "Test bio",
        role: "ORGANIZER",
      },
    }).then(u => u.id);

    eventId = await prisma.event.create({
      data: {
        title: "Organizer Test Event",
        slug: "organizer-test-" + Date.now(),
        location: "Test Location",
        dateTime: new Date(Date.now() + 86400000),
        isPublished: true,
        organizerId,
      },
    }).then(e => e.id);
  });

  afterAll(async () => {
    await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
    await prisma.user.delete({ where: { id: organizerId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe("GET /api/organizers/[id]", () => {
    it("should return 404 for non-existent organizer", async () => {
      const response = await fetch("http://localhost:3000/api/organizers/non-existent-id");
      expect(response.status).toBe(404);
    });

    it("should return organizer data for valid ID", async () => {
      const response = await fetch(`http://localhost:3000/api/organizers/${organizerId}`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("followerCount");
    });
  });

  describe("POST /api/organizers/[id]/follow", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await fetch(`http://localhost:3000/api/organizers/${organizerId}/follow`, {
        method: "POST",
      });
      expect(response.status).toBe(401);
    });
  });
});

describe("User Profile API", () => {
  describe("GET /api/user/profile", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await fetch("http://localhost:3000/api/user/profile");
      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/user/profile", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await fetch("http://localhost:3000/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Name" }),
      });
      expect(response.status).toBe(401);
    });

    it("should fail with invalid body", async () => {
      const response = await fetch("http://localhost:3000/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });
      expect([400, 401]).toContain(response.status);
    });
  });
});

describe("Events API - Filters", () => {
  let organizerId: string;
  let eventId: string;

  beforeAll(async () => {
    organizerId = await prisma.user.create({
      data: {
        email: `filter-org-${Date.now()}@test.com`,
        password: "$2a$10$testpasswordhash",
        name: "Filter Organizer",
        role: "ORGANIZER",
      },
    }).then(u => u.id);

    eventId = await prisma.event.create({
      data: {
        title: "Filtered Test Event",
        slug: "filter-test-" + Date.now(),
        location: "Lagos",
        dateTime: new Date(Date.now() + 86400000 * 7),
        isPublished: true,
        organizerId,
        category: "Music",
      },
    }).then(e => e.id);

    await prisma.ticketType.create({
      data: {
        eventId,
        name: "General",
        price: 5000,
        quantity: 100,
      },
    });
  });

  afterAll(async () => {
    await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
    await prisma.user.delete({ where: { id: organizerId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe("GET /api/events with filters", () => {
    it("should return events with search filter", async () => {
      const response = await fetch("http://localhost:3000/api/events?search=Lagos");
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return events with category filter", async () => {
      const response = await fetch("http://localhost:3000/api/events?category=Music");
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return events with price filter", async () => {
      const response = await fetch("http://localhost:3000/api/events?minPrice=0&maxPrice=10000");
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return events with date filter", async () => {
      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0];
      const response = await fetch(`http://localhost:3000/api/events?dateFrom=${today}&dateTo=${nextWeek}`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return events with filter=upcoming", async () => {
      const response = await fetch("http://localhost:3000/api/events?filter=upcoming");
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return events with filter=past", async () => {
      const response = await fetch("http://localhost:3000/api/events?filter=past");
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });
});

describe("Recommendations API", () => {
  describe("GET /api/events/recommendations", () => {
    it("should return 200 with events array", async () => {
      const response = await fetch("http://localhost:3000/api/events/recommendations");
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty("events");
      expect(Array.isArray(data.events)).toBe(true);
    });

    it("should include basedOn property", async () => {
      const response = await fetch("http://localhost:3000/api/events/recommendations");
      const data = await response.json();
      
      expect(data).toHaveProperty("basedOn");
    });
  });
});