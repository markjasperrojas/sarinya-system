import { getProducts, createProduct, updateProduct, deleteProduct } from "../productService";
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

describe("productService", () => {
  it("getProducts — GET /products", async () => {
    const data = [{ _id: "1", name: "Silog", price: 100 }];
    API.get.mockResolvedValue({ data });
    const result = await getProducts();
    expect(API.get).toHaveBeenCalledWith("/products");
    expect(result).toEqual(data);
  });

  it("createProduct — POST /products/add", async () => {
    const payload = { name: "New Dish", price: 150 };
    const responseData = { message: "Product created!", product: payload };
    API.post.mockResolvedValue({ data: responseData });
    const result = await createProduct(payload);
    expect(API.post).toHaveBeenCalledWith("/products/add", payload);
    expect(result).toEqual(responseData);
  });

  it("updateProduct — PUT /products/:id", async () => {
    const responseData = { message: "Product updated!", product: { name: "Updated" } };
    API.put.mockResolvedValue({ data: responseData });
    const result = await updateProduct("prod1", { name: "Updated" });
    expect(API.put).toHaveBeenCalledWith("/products/prod1", { name: "Updated" });
    expect(result).toEqual(responseData);
  });

  it("deleteProduct — DELETE /products/:id", async () => {
    const responseData = { message: "Product deleted!" };
    API.delete.mockResolvedValue({ data: responseData });
    const result = await deleteProduct("prod1");
    expect(API.delete).toHaveBeenCalledWith("/products/prod1");
    expect(result).toEqual(responseData);
  });
});
