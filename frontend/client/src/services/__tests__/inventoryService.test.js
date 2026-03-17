import {
  getInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  sellInventoryItem,
  pullOutInventoryItem,
  bulkSell,
} from "../inventoryService";
import API from "../../api";

jest.mock("../../api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: { headers: { common: {} } },
    interceptors: { response: { use: jest.fn() }, request: { use: jest.fn() } },
  },
  setAuthToken: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

describe("inventoryService", () => {
  it("getInventoryItems — GET /inventory", async () => {
    const data = [{ _id: "1", quantity: 10 }];
    API.get.mockResolvedValue({ data });
    const result = await getInventoryItems();
    expect(API.get).toHaveBeenCalledWith("/inventory");
    expect(result).toEqual(data);
  });

  it("addInventoryItem — POST /inventory/add", async () => {
    const payload = { productId: "p1", quantity: 5, expirationDate: "2026-12-31" };
    const responseData = { message: "Item added!", item: payload };
    API.post.mockResolvedValue({ data: responseData });
    const result = await addInventoryItem(payload);
    expect(API.post).toHaveBeenCalledWith("/inventory/add", payload);
    expect(result).toEqual(responseData);
  });

  it("updateInventoryItem — PUT /inventory/:id", async () => {
    const responseData = { message: "Item updated!" };
    API.put.mockResolvedValue({ data: responseData });
    const result = await updateInventoryItem("abc123", { quantity: 20 });
    expect(API.put).toHaveBeenCalledWith("/inventory/abc123", { quantity: 20 });
    expect(result).toEqual(responseData);
  });

  it("deleteInventoryItem — DELETE /inventory/delete/:id", async () => {
    const responseData = { message: "Item deleted!" };
    API.delete.mockResolvedValue({ data: responseData });
    const result = await deleteInventoryItem("abc123");
    expect(API.delete).toHaveBeenCalledWith("/inventory/delete/abc123");
    expect(result).toEqual(responseData);
  });

  it("sellInventoryItem — POST /inventory/:id/sell", async () => {
    const responseData = { message: "Sale completed!" };
    API.post.mockResolvedValue({ data: responseData });
    const result = await sellInventoryItem("batch1", 2);
    expect(API.post).toHaveBeenCalledWith("/inventory/batch1/sell", { quantity: 2 });
    expect(result).toEqual(responseData);
  });

  it("pullOutInventoryItem — POST /inventory/:id/pullout", async () => {
    const payload = { quantityPulledOut: 3, reason: "damaged" };
    const responseData = { message: "Pull out recorded!" };
    API.post.mockResolvedValue({ data: responseData });
    const result = await pullOutInventoryItem("batch1", payload);
    expect(API.post).toHaveBeenCalledWith("/inventory/batch1/pullout", payload);
    expect(result).toEqual(responseData);
  });

  it("bulkSell — POST /sales/bulk-sell", async () => {
    const items = [{ productId: "p1", quantity: 2 }];
    const responseData = { message: "Sale processed!", saleSessionId: "session-1" };
    API.post.mockResolvedValue({ data: responseData });
    const result = await bulkSell(items, "table 5");
    expect(API.post).toHaveBeenCalledWith("/sales/bulk-sell", { items, notes: "table 5" });
    expect(result).toEqual(responseData);
  });

  it("bulkSell — sends empty string for notes when not provided", async () => {
    API.post.mockResolvedValue({ data: {} });
    await bulkSell([{ productId: "p1", quantity: 1 }]);
    expect(API.post).toHaveBeenCalledWith(
      "/sales/bulk-sell",
      expect.objectContaining({ notes: "" })
    );
  });
});
