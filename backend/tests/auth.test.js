import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";

let app;
let pool;

beforeAll(async () => {
  process.env.SESSION_SECRET = "eventtide-test-secret";
  process.env.FRONTEND_URL = "http://localhost:5173";

  ({ app, pool } = await import("../src/server.js"));
});

afterAll(async () => {
  await pool.end();
});

describe("Registracija", () => {
  it("Zavrne registracijo brez obveznih podatkov", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({});

    expect(res.status).toBe(400);
  });

  it("Zavrne prazno ime", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        ime: " ",
        email: "test@example.com",
        geslo: "TestPassword123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Vnesi ime.");
  });

  it("Zavrne neveljaven email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        ime: "Test",
        email: "invalid-email",
        geslo: "TestPassword123",
      });

    expect(res.status).toBe(400);
  });

  it("Zavrne prekratko geslo", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        ime: "Test",
        email: "test@example.com",
        geslo: "123",
      });

    expect(res.status).toBe(400);
  });
});

describe("Avtentikacija in dostop", () => {
  it("Zavrne prijavo iz nedovoljenega izvora", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://example.com")
      .send({});

    expect(res.status).toBe(403);
  });

  it("Zavrne prijavo brez prijavnih podatkov", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "http://localhost:5173")
      .send({});

    expect(res.status).toBe(401);
  });

  it("Zavrne dostop do profila brez seje", async () => {
    const res = await request(app)
      .get("/api/auth/me");

    expect(res.status).toBe(401);
  });

  it("Zavrne dostop do administracije brez prijave", async () => {
    const res = await request(app)
      .get("/api/admin/uporabniki");

    expect(res.status).toBe(401);
  });
});