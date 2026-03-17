const Product = require("../../models/Product");

describe("Product model", () => {
  it("requires name", async () => {
    const p = new Product({ price: 100 });
    await expect(p.validate()).rejects.toThrow();
  });

  it("requires price", async () => {
    const p = new Product({ name: "Test" });
    await expect(p.validate()).rejects.toThrow();
  });

  it("rejects negative price", async () => {
    const p = new Product({ name: "Test", price: -1 });
    await expect(p.validate()).rejects.toThrow();
  });

  it("accepts price of 0 (free item)", async () => {
    const p = new Product({ name: "Free Item", price: 0 });
    await expect(p.validate()).resolves.toBeUndefined();
  });

  it("defaults deletedAt to null", () => {
    const p = new Product({ name: "Test", price: 10 });
    expect(p.deletedAt).toBeNull();
  });

  it("defaults image_url to null", () => {
    const p = new Product({ name: "Test", price: 10 });
    expect(p.image_url).toBeNull();
  });

  it("defaults categories to empty array", () => {
    const p = new Product({ name: "Test", price: 10 });
    expect(p.categories).toEqual([]);
  });

  it("rejects invalid category values", async () => {
    const p = new Product({ name: "Test", price: 10, categories: ["invalid_category"] });
    await expect(p.validate()).rejects.toThrow();
  });

  it("accepts valid category values", async () => {
    const p = new Product({ name: "Test", price: 10, categories: ["silog", "soup"] });
    await expect(p.validate()).resolves.toBeUndefined();
  });
});
