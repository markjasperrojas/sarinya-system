const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../setup/appSetup");
const { createUserAndToken, createProduct, createInventoryBatch } = require("../setup/helpers");
const Inventory = require("../../models/Inventory");
const Sale = require("../../models/Sale");

jest.mock("../../utils/activityLogger");

describe("POST /api/sales/bulk-sell", () => {
  let staffToken;

  beforeEach(async () => {
    ({ token: staffToken } = await createUserAndToken({ role: "staff" }));
  });

  it("returns 400 when items array is empty", async () => {
    const res = await request(app)
      .post("/api/sales/bulk-sell")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no items/i);
  });

  it("returns 400 when items is not provided", async () => {
    const res = await request(app)
      .post("/api/sales/bulk-sell")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 404 when product does not exist", async () => {
    const res = await request(app)
      .post("/api/sales/bulk-sell")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ items: [{ productId: new mongoose.Types.ObjectId(), quantity: 1 }] });
    expect(res.status).toBe(404);
  });

  it("returns 400 with product name when stock is insufficient", async () => {
    const p = await createProduct({ name: "Silog Meal" });
    await createInventoryBatch(p._id, { quantity: 2 });

    const res = await request(app)
      .post("/api/sales/bulk-sell")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ items: [{ productId: p._id, quantity: 10 }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Silog Meal");
  });

  it("deducts stock in FEFO order across multiple batches", async () => {
    const p = await createProduct({ price: 50 });
    const earlyBatch = await createInventoryBatch(p._id, {
      quantity: 5,
      expirationDate: new Date("2026-01-01T00:00:00.000Z"),
    });
    const laterBatch = await createInventoryBatch(p._id, {
      quantity: 10,
      expirationDate: new Date("2026-06-01T00:00:00.000Z"),
    });

    const res = await request(app)
      .post("/api/sales/bulk-sell")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ items: [{ productId: p._id, quantity: 7 }] });

    expect(res.status).toBe(200);

    const updatedEarly = await Inventory.findById(earlyBatch._id);
    const updatedLater = await Inventory.findById(laterBatch._id);
    expect(updatedEarly.quantity).toBe(0); // 5 taken from early batch
    expect(updatedLater.quantity).toBe(8); // 2 taken from later batch
  });

  it("returns 200 with saleSessionId and correct sale records on success", async () => {
    const p = await createProduct({ price: 100 });
    await createInventoryBatch(p._id, { quantity: 10 });

    const res = await request(app)
      .post("/api/sales/bulk-sell")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ items: [{ productId: p._id, quantity: 2 }] });

    expect(res.status).toBe(200);
    expect(res.body.saleSessionId).toBeDefined();
    expect(res.body.sales).toHaveLength(1);
    expect(res.body.sales[0].quantity).toBe(2);
  });

  it("aborts the transaction if a later item fails — first item's inventory NOT decremented", async () => {
    const p1 = await createProduct({ price: 100 });
    const batch1 = await createInventoryBatch(p1._id, { quantity: 10 });
    const fakeProdId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/api/sales/bulk-sell")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        items: [
          { productId: p1._id, quantity: 5 },
          { productId: fakeProdId, quantity: 1 }, // will fail
        ],
      });

    expect(res.status).toBe(404);

    const unchanged = await Inventory.findById(batch1._id);
    expect(unchanged.quantity).toBe(10); // rollback confirmed
  });
});

describe("GET /api/sales", () => {
  let adminToken;

  beforeEach(async () => {
    ({ token: adminToken } = await createUserAndToken({ role: "admin" }));
  });

  it("returns 200 with paginated sales", async () => {
    const res = await request(app)
      .get("/api/sales")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.sales).toBeDefined();
    expect(res.body.pagination).toBeDefined();
  });

  it("filters by timeRange=daily", async () => {
    const p = await createProduct({ price: 100 });
    await Sale.create({ product: p._id, quantity: 1, price: 100, date: new Date() });

    const res = await request(app)
      .get("/api/sales?timeRange=daily")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.sales.length).toBeGreaterThan(0);
  });
});

describe("GET /api/sales/sessions/recent", () => {
  it("returns today's sessions", async () => {
    const { token } = await createUserAndToken({ role: "staff" });
    const res = await request(app)
      .get("/api/sales/sessions/recent")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
