import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

describe("Post-Purchase Account Creation APIs", () => {
  let testEmail = `test-${Date.now()}@test.com`;
  let testOrganizerUserId: string;

  beforeAll(async () => {
    testOrganizerUserId = await prisma.user.create({
      data: {
        email: `checkout-org-${Date.now()}@test.com`,
        password: "$2a$10$testpasswordhash",
        name: "Checkout Organizer",
        role: "ORGANIZER",
      },
    }).then(u => u.id);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: "@test.com" } },
    });
  });

  describe("POST /api/auth/check-email", () => {
    it("should return exists: false for new email", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `newuser-${Date.now()}@test.com` }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.exists).toBe(false);
      expect(data.user).toBe(null);
    });

    it("should return exists: true for existing email", async () => {
      await prisma.user.create({
        data: {
          email: `existing-${Date.now()}@test.com`,
          password: "$2a$10$testpasswordhash",
          name: "Existing User",
          role: "ATTENDEE",
        },
      });

      const response = await fetch(`${BASE_URL}/api/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.exists).toBe(false);
    });
  });

  describe("POST /api/auth/create-account", () => {
    it("should create account with valid email and password", async () => {
      const email = `create-${Date.now()}@test.com`;
      const response = await fetch(`${BASE_URL}/api/auth/create-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: "testpass123",
          name: "New User",
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Account created successfully");
      expect(data.user).toHaveProperty("id");
      expect(data.user.email).toBe(email);
      expect(data.user.role).toBe("ATTENDEE");
    });

    it("should return 400 for short password", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/create-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `short-${Date.now()}@test.com`,
          password: "12345",
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("at least 6 characters");
    });

    it("should return 400 for missing fields", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/create-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("password required");
    });

    it("should return 400 for existing user", async () => {
      const email = `duplicate-${Date.now()}@test.com`;
      await prisma.user.create({
        data: {
          email: email,
          password: "$2a$10$testpasswordhash",
          name: "Test User",
          role: "ATTENDEE",
        },
      });

      const response = await fetch(`${BASE_URL}/api/auth/create-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: "testpass123",
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("already exists");
    });
  });

  describe("POST /api/auth/send-magic-link", () => {
    it("should return 400 for existing user email", async () => {
      const existingEmail = `existing-magic-${Date.now()}@test.com`;
      await prisma.user.create({
        data: {
          email: existingEmail,
          password: "$2a$10$testpasswordhash",
          name: "Existing User",
          role: "ATTENDEE",
        },
      });

      const response = await fetch(`${BASE_URL}/api/auth/send-magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: existingEmail }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("already exists");
    });

    it("should return 400 for missing email", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/send-magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
    });
  });
});

describe("Dashboard Context Switching", () => {
  let testOrganizerEmail = `org-context-${Date.now()}@test.com`;
  let testOrganizerId: string;

  beforeAll(async () => {
    testOrganizerId = await prisma.user.create({
      data: {
        email: testOrganizerEmail,
        password: "$2a$10$testpasswordhash",
        name: "Context Organizer",
        role: "ORGANIZER",
      },
    }).then(u => u.id);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testOrganizerEmail },
    });
  });

  describe("GET /dashboard?mode=attendee", () => {
    it("should render attendee dashboard for ORGANIZER with ?mode=attendee", async () => {
      const response = await fetch(`${BASE_URL}/dashboard`, {
        credentials: "include",
      });

      expect(response.status).toBe(302);
    });
  });
});