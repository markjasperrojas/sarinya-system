import {
  getRecentSessions,
  getSessionDetail,
  addItemsToSession,
  removeSessionItem,
} from "../salesService";
import API from "../../api";

jest.mock("../../api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    defaults: { headers: { common: {} } },
    interceptors: { response: { use: jest.fn() }, request: { use: jest.fn() } },
  },
  setAuthToken: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

describe("salesService", () => {
  it("getRecentSessions — GET /sales/sessions/recent", async () => {
    const data = [{ _id: "session1", total: 500 }];
    API.get.mockResolvedValue({ data });
    const result = await getRecentSessions();
    expect(API.get).toHaveBeenCalledWith("/sales/sessions/recent");
    expect(result).toEqual(data);
  });

  it("getSessionDetail — GET /sales/sessions/:sessionId", async () => {
    const data = { saleSessionId: "s1", sales: [] };
    API.get.mockResolvedValue({ data });
    const result = await getSessionDetail("s1");
    expect(API.get).toHaveBeenCalledWith("/sales/sessions/s1");
    expect(result).toEqual(data);
  });

  it("addItemsToSession — POST /sales/sessions/:sessionId/add-items", async () => {
    const items = [{ productId: "p1", quantity: 2 }];
    const responseData = { message: "Order updated!", sales: [] };
    API.post.mockResolvedValue({ data: responseData });
    const result = await addItemsToSession("s1", items, "table 3");
    expect(API.post).toHaveBeenCalledWith("/sales/sessions/s1/add-items", {
      items,
      notes: "table 3",
    });
    expect(result).toEqual(responseData);
  });

  it("removeSessionItem — DELETE /sales/sessions/:sessionId/remove-item/:saleId", async () => {
    const responseData = { message: "Item removed from order!" };
    API.delete.mockResolvedValue({ data: responseData });
    const result = await removeSessionItem("s1", "sale1");
    expect(API.delete).toHaveBeenCalledWith("/sales/sessions/s1/remove-item/sale1");
    expect(result).toEqual(responseData);
  });
});
