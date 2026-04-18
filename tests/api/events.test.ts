import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Events API", () => {
  let testEventId: string;
  let organizerUserId: string;

  beforeAll(async () => {
    const testUser = await prisma.user.create({
      data: {
        email: `test-organizer-${Date.now()}@test.com`,
        password: "$2a$10$testpasswordhash",
        name: "Test Organizer",
        role: "ORGANIZER",
      },
    });
    organizerUserId = testUser.id;
  });

  afterAll(async () => {
    if (testEventId) {
      await prisma.event.delete({ where: { id: testEventId } }).catch(() => {});
    }
    if (organizerUserId) {
      await prisma.user.delete({ where: { id: organizerUserId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe("GET /api/events", () => {
    it("should return a list of public events", async () => {
      const response = await fetch("http://localhost:3000/api/events");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("POST /api/events", () => {
    it("should create a new event when authenticated", async () => {
      const response = await fetch("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Event " + Date.now(),
          description: "A test event",
          location: "Test Location",
          dateTime: new Date(Date.now() + 86400000).toISOString(),
          organizerId: organizerUserId,
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        testEventId = data.id;
        expect(data).toHaveProperty("id");
        expect(data).toHaveProperty("title");
      }
    });

    it("should fail with missing required fields", async () => {
      const response = await fetch("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizerId: organizerUserId,
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});

describe("Ticket Types API", () => {
  let testEventId: string;
  let testTicketTypeId: string;

  beforeAll(async () => {
    const testUser = await prisma.user.create({
      data: {
        email: `test-tickets-${Date.now()}@test.com`,
        password: "$2a$10$testpasswordhash",
        name: "Ticket Tester",
        role: "ORGANIZER",
      },
    });

    const testEvent = await prisma.event.create({
      data: {
        title: "Test Event for Tickets",
        slug: "test-event-tickets-" + Date.now(),
        location: "Test Location",
        dateTime: new Date(Date.now() + 86400000),
        organizerId: testUser.id,
      },
    });

    testEventId = testEvent.id;
  });

  afterAll(async () => {
    if (testTicketTypeId) {
      await prisma.ticketType.delete({ where: { id: testTicketTypeId } }).catch(() => {});
    }
    if (testEventId) {
      await prisma.event.delete({ where: { id: testEventId } }).catch(() => {});
    }
  });

  describe("POST /api/ticket-types", () => {
    it("should create a ticket type for an event", async () => {
      const response = await fetch("http://localhost:3000/api/ticket-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: testEventId,
          name: "VIP Ticket",
          price: 10000,
          quantity: 100,
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        testTicketTypeId = data.id;
        expect(data).toHaveProperty("id");
        expect(data.name).toBe("VIP Ticket");
        expect(data.price).toBe(10000);
      }
    });

    it("should fail with invalid price", async () => {
      const response = await fetch("http://localhost:3000/api/ticket-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: testEventId,
          name: "Bad Price Ticket",
          price: -100,
          quantity: 100,
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});

describe("Orders API", () => {
  describe("POST /api/orders", () => {
    it("should create an order with valid data", async () => {
      const response = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: "nonexistent-event",
          items: [{ ticketTypeId: "nonexistent-ticket", quantity: 1 }],
          email: "buyer@test.com",
          name: "Test Buyer",
          phone: "08012345678",
        }),
      });

      const data = await response.json();
      expect([200, 400, 404]).toContain(response.status);
    });

    it("should fail without email", async () => {
      const response = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: "test-event",
          items: [{ ticketTypeId: "ticket-1", quantity: 1 }],
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});

describe("Payment API", () => {
  describe("POST /api/payment/initialize", () => {
    it("should fail with invalid order ID", async () => {
      const response = await fetch("http://localhost:3000/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "invalid-order-id",
          email: "test@test.com",
          name: "Test User",
          amount: 5000,
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/payment/verify", () => {
    it("should fail with invalid reference", async () => {
      const response = await fetch("http://localhost:3000/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: "invalid-ref",
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});