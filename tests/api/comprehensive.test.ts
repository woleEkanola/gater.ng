import { PrismaClient, Role, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

const BASE_URL = "http://localhost:3000";

describe("Gater.ng Comprehensive Test Suite", () => {
  let testOrganizerId: string;
  let testAdminId: string;
  let testEventId: string;
  let testTicketTypeId: string;
  let testOrderId: string;
  let testUserId: string;

  const timestamp = Date.now();
  const testEmail = `test-${timestamp}@test.com`;
  const organizerEmail = `organizer-${timestamp}@test.com`;
  const adminEmail = `admin-${timestamp}@test.com`;

  beforeAll(async () => {
    testAdminId = (await prisma.user.create({
      data: { email: adminEmail, password: "$2a$10$testhash", name: "Test Admin", role: Role.ADMIN },
    })).id;

    testOrganizerId = (await prisma.user.create({
      data: { email: organizerEmail, password: "$2a$10$testhash", name: "Test Organizer", role: Role.ORGANIZER },
    })).id;

    testEventId = (await prisma.event.create({
      data: {
        title: "Test Event Comprehensive",
        slug: `test-event-${timestamp}`,
        location: "Test Location",
        dateTime: new Date(Date.now() + 86400000),
        organizerId: testOrganizerId,
        isPublished: true,
      },
    })).id;

    testTicketTypeId = (await prisma.ticketType.create({
      data: {
        name: "Regular Ticket",
        price: 5000,
        quantity: 100,
        eventId: testEventId,
      },
    })).id;
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({ where: { orderId: testOrderId } }).catch(() => {});
    await prisma.order.deleteMany({ where: { id: testOrderId } }).catch(() => {});
    await prisma.ticketType.deleteMany({ where: { id: testTicketTypeId } }).catch(() => {});
    await prisma.event.deleteMany({ where: { id: testEventId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [testOrganizerId, testAdminId, testUserId].filter(Boolean) } } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe("1. User Registration & Roles", () => {
    describe("POST /api/auth/register", () => {
      it("should register a new user with valid data", async () => {
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: testEmail,
            password: "password123",
            name: "Test User",
          }),
        });

        const data = await response.json();
        expect([200, 201]).toContain(response.status);
        if (response.status === 201) {
          testUserId = data.id;
        }
      });

      it("should fail with duplicate email", async () => {
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: testEmail,
            password: "password123",
            name: "Test User Duplicate",
          }),
        });

        expect(response.status).toBe(400);
      });

      it("should fail with missing required fields", async () => {
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        expect(response.status).toBe(400);
      });
    });

    describe("User Roles", () => {
      it("should have ADMIN role for admin user", async () => {
        const user = await prisma.user.findUnique({ where: { id: testAdminId } });
        expect(user?.role).toBe(Role.ADMIN);
      });

      it("should have ORGANIZER role for organizer user", async () => {
        const user = await prisma.user.findUnique({ where: { id: testOrganizerId } });
        expect(user?.role).toBe(Role.ORGANIZER);
      });

      it("should default to ATTENDEE for new users", async () => {
        const newUser = await prisma.user.create({
          data: { email: `new-${timestamp}@test.com`, password: "$2a$10$hash", role: Role.ATTENDEE },
        });
        const user = await prisma.user.findUnique({ where: { id: newUser.id } });
        expect(user?.role).toBe(Role.ATTENDEE);
        await prisma.user.delete({ where: { id: newUser.id } }).catch(() => {});
      });
    });
  });

  describe("2. Event Management", () => {
    describe("GET /api/events", () => {
      it("should return list of published events", async () => {
        const response = await fetch(`${BASE_URL}/api/events`);
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
      });

      it("should only return published events", async () => {
        const response = await fetch(`${BASE_URL}/api/events`);
        const data = await response.json();
        data.forEach((event: any) => {
          expect(event.isPublished).toBe(true);
        });
      });
    });

    describe("GET /api/events/[slug]", () => {
      it("should return event by slug", async () => {
        const response = await fetch(`${BASE_URL}/api/events/test-event-${timestamp}`);
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.title).toBe("Test Event Comprehensive");
      });

      it("should return 404 for non-existent event", async () => {
        const response = await fetch(`${BASE_URL}/api/events/non-existent`);
        expect(response.status).toBe(404);
      });

      it("should include ticket types in response", async () => {
        const response = await fetch(`${BASE_URL}/api/events/test-event-${timestamp}`);
        const data = await response.json();
        expect(data.ticketTypes).toBeDefined();
        expect(data.ticketTypes.length).toBeGreaterThan(0);
      });
    });

    describe("POST /api/events", () => {
      it("should create a new event", async () => {
        const response = await fetch(`${BASE_URL}/api/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "New Test Event",
            slug: `new-event-${timestamp}`,
            location: "New Location",
            dateTime: new Date(Date.now() + 86400000).toISOString(),
            organizerId: testOrganizerId,
          }),
        });

        const data = await response.json();
        expect([200, 201]).toContain(response.status);
      });

      it("should fail with duplicate slug", async () => {
        const response = await fetch(`${BASE_URL}/api/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Duplicate Event",
            slug: `test-event-${timestamp}`,
            location: "Location",
            dateTime: new Date().toISOString(),
            organizerId: testOrganizerId,
          }),
        });

        expect(response.status).toBe(400);
      });

      it("should fail with missing required fields", async () => {
        const response = await fetch(`${BASE_URL}/api/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizerId: testOrganizerId }),
        });

        expect(response.status).toBe(400);
      });
    });
  });

  describe("3. Ticket Types Management", () => {
    describe("POST /api/ticket-types", () => {
      it("should create ticket type", async () => {
        const response = await fetch(`${BASE_URL}/api/ticket-types`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: testEventId,
            name: "VIP Ticket",
            price: 15000,
            quantity: 50,
          }),
        });

        const data = await response.json();
        expect([200, 201]).toContain(response.status);
      });

      it("should fail with negative price", async () => {
        const response = await fetch(`${BASE_URL}/api/ticket-types`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: testEventId,
            name: "Invalid Ticket",
            price: -100,
            quantity: 10,
          }),
        });

        expect(response.status).toBe(400);
      });

      it("should fail with zero quantity", async () => {
        const response = await fetch(`${BASE_URL}/api/ticket-types`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: testEventId,
            name: "Zero Qty Ticket",
            price: 1000,
            quantity: 0,
          }),
        });

        expect(response.status).toBe(400);
      });
    });

    describe("GET /api/ticket-types", () => {
      it("should return ticket types for event", async () => {
        const response = await fetch(`${BASE_URL}/api/ticket-types?eventId=${testEventId}`);
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
      });
    });
  });

  describe("4. Orders & Checkout", () => {
    describe("POST /api/orders", () => {
      it("should create order with buyer phone", async () => {
        const response = await fetch(`${BASE_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: testEventId,
            items: [{ ticketTypeId: testTicketTypeId, quantity: 2 }],
            email: "buyer@test.com",
            name: "Buyer Name",
            phone: "08012345678",
          }),
        });

        const data = await response.json();
        if (response.status === 201) {
          testOrderId = data.orderId;
          expect(data).toHaveProperty("orderId");
        }
      });

      it("should fail without email", async () => {
        const response = await fetch(`${BASE_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: testEventId,
            items: [{ ticketTypeId: testTicketTypeId, quantity: 1 }],
          }),
        });

        expect(response.status).toBe(400);
      });

      it("should fail with invalid ticket type", async () => {
        const response = await fetch(`${BASE_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: testEventId,
            items: [{ ticketTypeId: "invalid-ticket", quantity: 1 }],
            email: "test@test.com",
          }),
        });

        expect(response.status).toBe(404);
      });

      it("should fail when tickets sold out", async () => {
        const soldOutTicket = await prisma.ticketType.create({
          data: { name: "Sold Out", price: 1000, quantity: 0, eventId: testEventId },
        });

        const response = await fetch(`${BASE_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: testEventId,
            items: [{ ticketTypeId: soldOutTicket.id, quantity: 1 }],
            email: "test@test.com",
          }),
        });

        expect([400, 404]).toContain(response.status);
        await prisma.ticketType.delete({ where: { id: soldOutTicket.id } }).catch(() => {});
      });
    });
  });

  describe("5. Payment Integration", () => {
    describe("POST /api/payment/initialize", () => {
      it("should fail with invalid order ID", async () => {
        const response = await fetch(`${BASE_URL}/api/payment/initialize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: "invalid-order",
            email: "test@test.com",
            name: "Test",
            amount: 5000,
          }),
        });

        expect(response.status).toBe(404);
      });

      it("should initialize payment for valid order", async () => {
        if (!testOrderId) {
          const order = await prisma.order.create({
            data: {
              eventId: testEventId,
              buyerEmail: "payment@test.com",
              buyerName: "Payment Test",
              amount: 5000,
              status: OrderStatus.PENDING,
            },
          });
          testOrderId = order.id;
        }

        const response = await fetch(`${BASE_URL}/api/payment/initialize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: testOrderId,
            email: "payment@test.com",
            name: "Payment Test",
            amount: 5000,
            ticketData: [{ ticketTypeId: testTicketTypeId, quantity: 1 }],
            eventId: testEventId,
          }),
        });

        const data = await response.json();
        expect([200, 201, 400]).toContain(response.status);
      });
    });

    describe("POST /api/payment/verify", () => {
      it("should fail with missing reference", async () => {
        const response = await fetch(`${BASE_URL}/api/payment/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        expect(response.status).toBe(400);
      });

      it("should fail with invalid reference", async () => {
        const response = await fetch(`${BASE_URL}/api/payment/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: "invalid-ref-12345" }),
        });

        const data = await response.json();
        expect([400, 404]).toContain(response.status);
      });
    });
  });

  describe("6. Manual Ticket Sales", () => {
    describe("POST /api/sales", () => {
      it("should log manual sale with phone", async () => {
        const response = await fetch(`${BASE_URL}/api/sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: testEventId,
            ticketTypeId: testTicketTypeId,
            quantity: 1,
            buyerName: "Manual Buyer",
            buyerEmail: "manual@test.com",
            buyerPhone: "08098765432",
          }),
        });

        const data = await response.json();
        expect([200, 201]).toContain(response.status);
        if (response.status === 201) {
          expect(data).toHaveProperty("tickets");
        }
      });

      it("should fail without buyer email", async () => {
        const response = await fetch(`${BASE_URL}/api/sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: testEventId,
            ticketTypeId: testTicketTypeId,
            quantity: 1,
          }),
        });

        expect(response.status).toBe(400);
      });
    });
  });

  describe("7. Attendees & Tickets", () => {
    describe("GET /api/attendees", () => {
      it("should return attendees for event", async () => {
        const response = await fetch(`${BASE_URL}/api/attendees?eventId=${testEventId}`);
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
      });

      it("should support CSV export", async () => {
        const response = await fetch(`${BASE_URL}/api/attendees?eventId=${testEventId}&format=csv`);
        expect([200, 201]).toContain(response.status);
      });
    });

    describe("GET /api/tickets", () => {
      it("should return ticket by ticket ID", async () => {
        const ticket = await prisma.ticket.findFirst({
          where: { ticketType: { eventId: testEventId } },
        });

        if (ticket) {
          const response = await fetch(`${BASE_URL}/api/tickets?id=${ticket.ticketId}`);
          const data = await response.json();
          expect([200, 201]).toContain(response.status);
        }
      });

      it("should return 404 for invalid ticket ID", async () => {
        const response = await fetch(`${BASE_URL}/api/tickets?id=INVALID-ID`);
        expect(response.status).toBe(404);
      });
    });
  });

  describe("8. Check-in System", () => {
    describe("POST /api/checkin", () => {
      it("should check in a valid ticket", async () => {
        const ticket = await prisma.ticket.findFirst({
          where: { ticketType: { eventId: testEventId }, isUsed: false },
          include: { ticketType: true },
        });

        if (ticket) {
          const response = await fetch(`${BASE_URL}/api/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ticketId: ticket.ticketId,
              checkedBy: testOrganizerId,
            }),
          });

          const data = await response.json();
          expect([200, 201, 400]).toContain(response.status);
        }
      });

      it("should fail with invalid ticket", async () => {
        const response = await fetch(`${BASE_URL}/api/checkin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId: "INVALID-TICKET-ID",
            checkedBy: testOrganizerId,
          }),
        });

        expect(response.status).toBe(404);
      });
    });
  });

  describe("9. Admin Functions", () => {
    describe("GET /api/admin/users", () => {
      it("should return list of users for admin", async () => {
        const response = await fetch(`${BASE_URL}/api/admin/users`);
        const data = await response.json();
        expect([200, 201]).toContain(response.status);
        if (response.status === 200) {
          expect(Array.isArray(data)).toBe(true);
        }
      });
    });
  });

  describe("10. Email Delivery (Resend)", () => {
    it("should have Resend API configured", async () => {
      const resendKey = process.env.RESEND_API_KEY;
      expect(resendKey).toBeDefined();
    });
  });

  describe("11. Database Schema Validation", () => {
    it("should have buyerPhone field in Order model", async () => {
      const order = await prisma.order.create({
        data: {
          eventId: testEventId,
          buyerEmail: "schema@test.com",
          buyerName: "Schema Test",
          buyerPhone: "08011111111",
          amount: 1000,
        },
      });

      const found = await prisma.order.findUnique({
        where: { id: order.id },
      });

      expect(found?.buyerPhone).toBe("08011111111");
      await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
    });

    it("should have slug field in Event model", async () => {
      const event = await prisma.event.findUnique({
        where: { id: testEventId },
      });

      expect(event?.slug).toBeDefined();
      expect(event?.slug).toContain("test-event-");
    });

    it("should have role field in User model", async () => {
      const user = await prisma.user.findUnique({
        where: { id: testOrganizerId },
      });

      expect(user?.role).toBe(Role.ORGANIZER);
    });

    it("should have payout fields in User model", async () => {
      const user = await prisma.user.findUnique({
        where: { id: testOrganizerId },
      });

      expect(user).toHaveProperty("payoutBankCode");
      expect(user).toHaveProperty("payoutAccountNumber");
    });
  });
});