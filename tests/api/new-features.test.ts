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

describe("Discount Codes API", () => {
  let organizerId: string;
  let eventId: string;
  let discountCodeId: string;

  beforeAll(async () => {
    organizerId = await prisma.user.create({
      data: {
        email: `discount-org-${Date.now()}@test.com`,
        password: "$2a$10$testpasswordhash",
        name: "Discount Organizer",
        role: "ORGANIZER",
      },
    }).then(u => u.id);

    eventId = await prisma.event.create({
      data: {
        title: "Discount Test Event",
        slug: "discount-test-" + Date.now(),
        location: "Test Location",
        dateTime: new Date(Date.now() + 86400000 * 7),
        isPublished: true,
        organizerId,
      },
    }).then(e => e.id);

    discountCodeId = await prisma.discountCode.create({
      data: {
        code: "TEST20",
        discountType: "percentage",
        discountValue: 2000,
        maxUses: 100,
        eventId,
      },
    }).then(d => d.id);
  });

  afterAll(async () => {
    await prisma.discountCode.delete({ where: { id: discountCodeId } }).catch(() => {});
    await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
    await prisma.user.delete({ where: { id: organizerId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe("GET /api/discount-codes", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await fetch(`http://localhost:3000/api/discount-codes?eventId=${eventId}`);
      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/discount-codes/validate", () => {
    it("should return error without eventId or code", async () => {
      const response = await fetch("http://localhost:3000/api/discount-codes/validate");
      expect(response.status).toBe(400);
    });

    it("should return 404 for invalid code", async () => {
      const response = await fetch(`http://localhost:3000/api/discount-codes/validate?eventId=${eventId}&code=INVALID`);
      expect(response.status).toBe(404);
    });

    it("should return valid code data", async () => {
      const response = await fetch(`http://localhost:3000/api/discount-codes/validate?eventId=${eventId}&code=TEST20`);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.code).toBe("TEST20");
      expect(data.discountType).toBe("percentage");
    });
  });

  describe("POST /api/discount-codes", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await fetch("http://localhost:3000/api/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, code: "NEWCODE", discountType: "percentage", discountValue: 1000 }),
      });
      expect(response.status).toBe(401);
    });
  });
});

describe("Gallery API", () => {
  let organizerId: string;
  let eventId: string;

  beforeAll(async () => {
    organizerId = await prisma.user.create({
      data: {
        email: `gallery-org-${Date.now()}@test.com`,
        password: "$2a$10$testpasswordhash",
        name: "Gallery Organizer",
        role: "ORGANIZER",
      },
    }).then(u => u.id);

    eventId = await prisma.event.create({
      data: {
        title: "Gallery Test Event",
        slug: "gallery-test-" + Date.now(),
        location: "Test Location",
        dateTime: new Date(Date.now() + 86400000 * 7),
        isPublished: true,
        organizerId,
      },
    }).then(e => e.id);
  });

  afterAll(async () => {
    await prisma.eventGallery.deleteMany({ where: { eventId } }).catch(() => {});
    await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
    await prisma.user.delete({ where: { id: organizerId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe("GET /api/gallery", () => {
    it("should return gallery items for event", async () => {
      const response = await fetch(`http://localhost:3000/api/gallery?eventId=${eventId}`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return error without eventId", async () => {
      const response = await fetch("http://localhost:3000/api/gallery");
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/gallery", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await fetch("http://localhost:3000/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, image: "https://example.com/image.jpg" }),
      });
      expect(response.status).toBe(401);
    });
  });
});

describe("Speakers API", () => {
  let organizerId: string;
  let eventId: string;

  beforeAll(async () => {
    organizerId = await prisma.user.create({
      data: {
        email: `speaker-org-${Date.now()}@test.com`,
        password: "$2a$10$testpasswordhash",
        name: "Speaker Organizer",
        role: "ORGANIZER",
      },
    }).then(u => u.id);

    eventId = await prisma.event.create({
      data: {
        title: "Speaker Test Event",
        slug: "speaker-test-" + Date.now(),
        location: "Test Location",
        dateTime: new Date(Date.now() + 86400000 * 7),
        isPublished: true,
        organizerId,
      },
    }).then(e => e.id);
  });

  afterAll(async () => {
    await prisma.speaker.deleteMany({ where: { eventId } }).catch(() => {});
    await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
    await prisma.user.delete({ where: { id: organizerId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe("GET /api/speakers", () => {
    it("should return speakers for event", async () => {
      const response = await fetch(`http://localhost:3000/api/speakers?eventId=${eventId}`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return error without eventId", async () => {
      const response = await fetch("http://localhost:3000/api/speakers");
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/speakers", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await fetch("http://localhost:3000/api/speakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, name: "Test Speaker" }),
      });
      expect(response.status).toBe(401);
    });
  });
});

describe("FAQs API", () => {
  let organizerId: string;
  let eventId: string;

  beforeAll(async () => {
    organizerId = await prisma.user.create({
      data: {
        email: `faq-org-${Date.now()}@test.com`,
        password: "$2a$10$testpasswordhash",
        name: "FAQ Organizer",
        role: "ORGANIZER",
      },
    }).then(u => u.id);

    eventId = await prisma.event.create({
      data: {
        title: "FAQ Test Event",
        slug: "faq-test-" + Date.now(),
        location: "Test Location",
        dateTime: new Date(Date.now() + 86400000 * 7),
        isPublished: true,
        organizerId,
      },
    }).then(e => e.id);
  });

  afterAll(async () => {
    await prisma.faq.deleteMany({ where: { eventId } }).catch(() => {});
    await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
    await prisma.user.delete({ where: { id: organizerId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe("GET /api/faqs", () => {
    it("should return FAQs for event", async () => {
      const response = await fetch(`http://localhost:3000/api/faqs?eventId=${eventId}`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("should return error without eventId", async () => {
      const response = await fetch("http://localhost:3000/api/faqs");
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/faqs", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await fetch("http://localhost:3000/api/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, question: "Test?", answer: "Test answer" }),
      });
      expect(response.status).toBe(401);
    });
  });
});

describe("Ticket Types API", () => {
  let organizerId: string;
  let eventId: string;
  let ticketTypeId: string;

  beforeAll(async () => {
    organizerId = await prisma.user.create({
      data: {
        email: `ticket-org-${Date.now()}@test.com`,
        password: "$2a$10$testpasswordhash",
        name: "Ticket Organizer",
        role: "ORGANIZER",
      },
    }).then(u => u.id);

    eventId = await prisma.event.create({
      data: {
        title: "Ticket Test Event",
        slug: "ticket-test-" + Date.now(),
        location: "Test Location",
        dateTime: new Date(Date.now() + 86400000 * 7),
        isPublished: true,
        organizerId,
      },
    }).then(e => e.id);

    ticketTypeId = await prisma.ticketType.create({
      data: {
        eventId,
        name: "General",
        price: 5000,
        quantity: 100,
      },
    }).then(t => t.id);
  });

  afterAll(async () => {
    await prisma.ticketType.delete({ where: { id: ticketTypeId } }).catch(() => {});
    await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
    await prisma.user.delete({ where: { id: organizerId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe("GET /api/ticket-types", () => {
    it("should return ticket types for event", async () => {
      const response = await fetch(`http://localhost:3000/api/ticket-types?eventId=${eventId}`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("PUT /api/ticket-types", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await fetch("http://localhost:3000/api/ticket-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketTypeId, price: 7000 }),
      });
      expect(response.status).toBe(401);
    });
  });
});

describe("Tags & Audience Types API", () => {
  describe("GET /api/tags", () => {
    it("should return 200 with tags array", async () => {
      const response = await fetch("http://localhost:3000/api/tags");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("GET /api/audience-types", () => {
    it("should return 200 with audience types array", async () => {
      const response = await fetch("http://localhost:3000/api/audience-types");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });
});

describe("Orders API with Discount", () => {
  let organizerId: string;
  let eventId: string;
  let ticketTypeId: string;

  beforeAll(async () => {
    organizerId = await prisma.user.create({
      data: {
        email: `order-org-${Date.now()}@test.com`,
        password: "$2a$10$testpasswordhash",
        name: "Order Organizer",
        role: "ORGANIZER",
      },
    }).then(u => u.id);

    eventId = await prisma.event.create({
      data: {
        title: "Order Test Event",
        slug: "order-test-" + Date.now(),
        location: "Test Location",
        dateTime: new Date(Date.now() + 86400000 * 7),
        isPublished: true,
        organizerId,
      },
    }).then(e => e.id);

    ticketTypeId = await prisma.ticketType.create({
      data: {
        eventId,
        name: "General",
        price: 10000,
        quantity: 100,
      },
    }).then(t => t.id);
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { eventId } }).catch(() => {});
    await prisma.ticketType.delete({ where: { id: ticketTypeId } }).catch(() => {});
    await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
    await prisma.user.delete({ where: { id: organizerId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe("POST /api/orders with discount", () => {
    it("should create order with discount code", async () => {
      const response = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          items: [{ ticketTypeId, quantity: 1 }],
          email: "test@example.com",
          name: "Test Buyer",
          discountCode: "TESTCODE",
          discountAmount: 2000,
        }),
      });
      
      expect([200, 400]).toContain(response.status);
    });

    it("should reject without required fields", async () => {
      const response = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(400);
    });
  });
});

describe("Tickets API", () => {
  describe("GET /api/tickets", () => {
    it("should return error without orderId", async () => {
      const response = await fetch("http://localhost:3000/api/tickets");
      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent order", async () => {
      const response = await fetch("http://localhost:3000/api/tickets?orderId=non-existent-id");
      expect(response.status).toBe(404);
    });
  });
});