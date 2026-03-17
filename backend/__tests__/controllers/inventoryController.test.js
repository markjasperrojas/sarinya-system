const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../setup/appSetup");
const { createUserAndToken, createProduct, createInventoryBatch } = require("../setup/helpers");
const Inventory = require("../../models/Inventory");
const Sale = require("../../models/Sale");

jest.mock("../../utils/activityLogger");

describe("POST /api/inventory/add", () => {
  let adminToken, product;

  beforeEach(async () => {
    ({ token: adminToken } = await createUserAndToken({ role: "admin" }));
    product = await createProduct({ name: "Add Test Product", price: 100 });
  });

  it("returns 404 for a non-existent productId", async () => {
    const res = await request(app)
      .post("/api/inventory/add")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ productId: new mongoose.Types.ObjectId(), quantity: 10, expirationDate: "2026-12-31T00:00:00.000Z" });
    expect(res.status).toBe(404);
  });

  it("creates a new inventory batch when none exists", async () => {
    const res = await request(app)
      .post("/api/inventory/add")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ productId: product._id, quantity: 10, expirationDate: "2026-12-31T00:00:00.000Z" });
    expect(res.status).toBe(200);
    expect(res.body.item.quantity).toBe(10);
    expect(res.body.merged).toBeUndefined();
  });

  it("auto-merges when same product + same expiry already has an active batch", async () => {
    const expiry = "2026-12-31T00:00:00.000Z";
    await request(app)
      .post("/api/inventory/add")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ productId: product._id, quantity: 10, expirationDate: expiry });

    const res = await request(app)
      .post("/api/inventory/add")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ productId: product._id, quantity: 5, expirationDate: expiry });

    expect(res.status).toBe(200);
    expect(res.body.merged).toBe(true);
    expect(res.body.item.quantity).toBe(15);

    // Only one document should exist in the DB
    const count = await Inventory.countDocuments({ product: product._id, deletedAt: null });
    expect(count).toBe(1);
  });

  it("does NOT merge pulled_out batches — creates a new batch instead", async () => {
    const expiry = "2026-12-31T00:00:00.000Z";
    await createInventoryBatch(product._id, {
      quantity: 5,
      expirationDate: new Date(expiry),
      status: "pulled_out",
    });

    const res = await request(app)
      .post("/api/inventory/add")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ productId: product._id, quantity: 10, expirationDate: expiry });

    expect(res.status).toBe(200);
    expect(res.body.merged).toBeUndefined();
    expect(res.body.item.quantity).toBe(10);
  });
});

describe("GET /api/inventory", () => {
  it("returns only active (non-deleted, non-pulled_out) batches", async () => {
    const { token } = await createUserAndToken({ role: "staff" });
    const p = await createProduct();
    await createInventoryBatch(p._id, { deletedAt: new Date() });
    await createInventoryBatch(p._id, { status: "pulled_out" });
    const active = await createInventoryBatch(p._id, { quantity: 7 });

    const res = await request(app)
      .get("/api/inventory")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe(active._id.toString());
  });
});

describe("DELETE /api/inventory/:id", () => {
  let adminToken;

  beforeEach(async () => {
    ({ token: adminToken } = await createUserAndToken({ role: "admin" }));
  });

  it("soft-deletes an existing batch", async () => {
    const p = await createProduct();
    const batch = await createInventoryBatch(p._id);

    const res = await request(app)
      .delete(`/api/inventory/${batch._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const updated = await Inventory.findById(batch._id);
    expect(updated.deletedAt).not.toBeNull();
  });

  it("returns 404 when trying to delete an already-deleted batch", async () => {
    const p = await createProduct();
    const batch = await createInventoryBatch(p._id, { deletedAt: new Date() });

    const res = await request(app)
      .delete(`/api/inventory/${batch._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it("returns 403 for staff (admin-only route)", async () => {
    const { token: staffToken } = await createUserAndToken({ role: "staff" });
    const p = await createProduct();
    const batch = await createInventoryBatch(p._id);

    const res = await request(app)
      .delete(`/api/inventory/${batch._id}`)
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
  });
});

describe("POST /api/inventory/:id/sell", () => {
  let adminToken;

  beforeEach(async () => {
    ({ token: adminToken } = await createUserAndToken({ role: "admin" }));
  });

  it("returns 404 for a non-existent inventory item", async () => {
    const res = await request(app)
      .post(`/api/inventory/${new mongoose.Types.ObjectId()}/sell`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 1 });
    expect(res.status).toBe(404);
  });

  it("returns 400 when requested quantity exceeds available stock", async () => {
    const p = await createProduct();
    const batch = await createInventoryBatch(p._id, { quantity: 5 });

    const res = await request(app)
      .post(`/api/inventory/${batch._id}/sell`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 10 });

    expect(res.status).toBe(400);
  });

  it("creates a Sale record and decrements batch quantity", async () => {
    const p = await createProduct({ price: 50 });
    const batch = await createInventoryBatch(p._id, { quantity: 10 });

    const res = await request(app)
      .post(`/api/inventory/${batch._id}/sell`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.sale.quantity).toBe(3);
    expect(res.body.updatedItem.quantity).toBe(7);

    const saleInDb = await Sale.findById(res.body.sale._id);
    expect(saleInDb).not.toBeNull();
    expect(saleInDb.quantity).toBe(3);
  });
});

describe("POST /api/inventory/:id/pullout", () => {
  let adminToken;

  beforeEach(async () => {
    ({ token: adminToken } = await createUserAndToken({ role: "admin" }));
  });

  it("returns 400 when quantity exceeds available stock", async () => {
    const p = await createProduct();
    const batch = await createInventoryBatch(p._id, { quantity: 3 });

    const res = await request(app)
      .post(`/api/inventory/${batch._id}/pullout`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantityPulledOut: 10, reason: "expired" });

    expect(res.status).toBe(400);
  });

  it("performs a full pullout — sets status to pulled_out", async () => {
    const p = await createProduct();
    const batch = await createInventoryBatch(p._id, { quantity: 5 });

    const res = await request(app)
      .post(`/api/inventory/${batch._id}/pullout`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantityPulledOut: 5, reason: "damaged" });

    expect(res.status).toBe(200);
    const updated = await Inventory.findById(batch._id);
    expect(updated.status).toBe("pulled_out");
    expect(updated.quantity).toBe(0);
  });

  it("performs a partial pullout — decrements quantity, status stays active", async () => {
    const p = await createProduct();
    const batch = await createInventoryBatch(p._id, { quantity: 10 });

    await request(app)
      .post(`/api/inventory/${batch._id}/pullout`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ quantityPulledOut: 4, reason: "spoiled" });

    const updated = await Inventory.findById(batch._id);
    expect(updated.quantity).toBe(6);
    expect(updated.status).toBe("active");
  });

  it("creates a replacement batch when addReplacement is true", async () => {
    const p = await createProduct();
    const batch = await createInventoryBatch(p._id, { quantity: 5 });

    const res = await request(app)
      .post(`/api/inventory/${batch._id}/pullout`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        quantityPulledOut: 5,
        reason: "expired",
        addReplacement: true,
        replacementQuantity: 8,
        replacementExpirationDate: "2027-06-30T00:00:00.000Z",
      });

    expect(res.status).toBe(200);
    expect(res.body.replacementItem).not.toBeNull();
    expect(res.body.replacementItem.quantity).toBe(8);
  });
});
