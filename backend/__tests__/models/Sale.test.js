const mongoose = require("mongoose");
const Sale = require("../../models/Sale");
const Product = require("../../models/Product");

describe("Sale model", () => {
  let productId;

  beforeAll(async () => {
    const product = await Product.create({ name: "Sale Test Product", price: 100 });
    productId = product._id;
  });

  it("calculates total virtual as quantity × price", async () => {
    const sale = new Sale({ product: productId, quantity: 3, price: 50 });
    expect(sale.total).toBe(150);
  });

  it("includes total in toJSON output", async () => {
    const sale = new Sale({ product: productId, quantity: 4, price: 25 });
    const json = sale.toJSON();
    expect(json.total).toBe(100);
  });

  it("requires product field", async () => {
    const sale = new Sale({ quantity: 1, price: 10 });
    await expect(sale.validate()).rejects.toThrow();
  });

  it("requires quantity field", async () => {
    const sale = new Sale({ product: productId, price: 10 });
    await expect(sale.validate()).rejects.toThrow();
  });

  it("requires price field", async () => {
    const sale = new Sale({ product: productId, quantity: 1 });
    await expect(sale.validate()).rejects.toThrow();
  });

  it("defaults date to now", () => {
    const before = Date.now();
    const sale = new Sale({ product: productId, quantity: 1, price: 10 });
    expect(sale.date.getTime()).toBeGreaterThanOrEqual(before);
  });

  it("defaults deletedAt to null", () => {
    const sale = new Sale({ product: productId, quantity: 1, price: 10 });
    expect(sale.deletedAt).toBeNull();
  });

  it("defaults saleSessionId to null", () => {
    const sale = new Sale({ product: productId, quantity: 1, price: 10 });
    expect(sale.saleSessionId).toBeNull();
  });

  it("defaults notes to empty string", () => {
    const sale = new Sale({ product: productId, quantity: 1, price: 10 });
    expect(sale.notes).toBe("");
  });
});
