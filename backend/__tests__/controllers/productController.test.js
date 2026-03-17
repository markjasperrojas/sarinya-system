const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../setup/appSetup");
const { createUserAndToken, createProduct, createInventoryBatch } = require("../setup/helpers");
const Inventory = require("../../models/Inventory");

jest.mock("../../utils/activityLogger");

describe("POST /api/products/add", () => {
  let adminToken;

  beforeEach(async () => {
    ({ token: adminToken } = await createUserAndToken({ role: "admin" }));
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/products/add")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 100 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });

  it("returns 400 when price is missing", async () => {
    const res = await request(app)
      .post("/api/products/add")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test Product" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/price/i);
  });

  it("returns 400 when price is negative", async () => {
    const res = await request(app)
      .post("/api/products/add")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test Product", price: -10 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/negative/i);
  });

  it("returns 400 when a product with the same name already exists (case-insensitive)", async () => {
    await createProduct({ name: "Chicken Silog" });

    const res = await request(app)
      .post("/api/products/add")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "chicken silog", price: 100 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it("creates a product successfully with valid data", async () => {
    const res = await request(app)
      .post("/api/products/add")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "New Product", price: 150 });
    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe("New Product");
    expect(res.body.product.price).toBe(150);
  });

  it("returns 403 for staff (admin-only route)", async () => {
    const { token: staffToken } = await createUserAndToken({ role: "staff" });
    const res = await request(app)
      .post("/api/products/add")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ name: "Staff Product", price: 100 });
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/products/:id", () => {
  let adminToken;

  beforeEach(async () => {
    ({ token: adminToken } = await createUserAndToken({ role: "admin" }));
  });

  it("returns 400 when product has active inventory batches", async () => {
    const p = await createProduct({ name: "Has Stock" });
    await createInventoryBatch(p._id, { quantity: 5, status: "active" });

    const res = await request(app)
      .delete(`/api/products/${p._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/inventory/i);
  });

  it("soft-deletes product and cascades to orphaned inventory records", async () => {
    const p = await createProduct({ name: "Zero Stock" });
    // zero-qty batch (orphaned)
    const orphan = await createInventoryBatch(p._id, { quantity: 0, status: "active" });

    const res = await request(app)
      .delete(`/api/products/${p._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const updatedOrphan = await Inventory.findById(orphan._id);
    expect(updatedOrphan.deletedAt).not.toBeNull();
  });

  it("returns 404 for a non-existent product", async () => {
    const res = await request(app)
      .delete(`/api/products/${new mongoose.Types.ObjectId()}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/products", () => {
  it("returns active products only", async () => {
    const { token } = await createUserAndToken({ role: "staff" });
    await createProduct({ name: "Active Product" });
    await createProduct({ name: "Deleted Product", deletedAt: new Date() });

    const res = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const names = res.body.map((p) => p.name);
    expect(names).toContain("Active Product");
    expect(names).not.toContain("Deleted Product");
  });
});
