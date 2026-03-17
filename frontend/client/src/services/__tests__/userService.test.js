import { getUsers, getProfile, createUser, updateUser, deleteUser } from "../userService";
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

describe("userService", () => {
  it("getUsers — GET /users", async () => {
    const data = [{ _id: "1", username: "alice", role: "admin" }];
    API.get.mockResolvedValue({ data });
    const result = await getUsers();
    expect(API.get).toHaveBeenCalledWith("/users");
    expect(result).toEqual(data);
  });

  it("getProfile — GET /users/profile", async () => {
    const data = { _id: "1", username: "alice" };
    API.get.mockResolvedValue({ data });
    const result = await getProfile();
    expect(API.get).toHaveBeenCalledWith("/users/profile");
    expect(result).toEqual(data);
  });

  it("createUser — POST /users", async () => {
    const payload = { username: "bob", password: "pass", role: "staff" };
    const responseData = { _id: "2", username: "bob" };
    API.post.mockResolvedValue({ data: responseData });
    const result = await createUser(payload);
    expect(API.post).toHaveBeenCalledWith("/users", payload);
    expect(result).toEqual(responseData);
  });

  it("updateUser — PUT /users/:id", async () => {
    const responseData = { _id: "1", username: "alice-updated" };
    API.put.mockResolvedValue({ data: responseData });
    const result = await updateUser("1", { username: "alice-updated" });
    expect(API.put).toHaveBeenCalledWith("/users/1", { username: "alice-updated" });
    expect(result).toEqual(responseData);
  });

  it("deleteUser — DELETE /users/:id", async () => {
    const responseData = { message: "User deleted successfully" };
    API.delete.mockResolvedValue({ data: responseData });
    const result = await deleteUser("1");
    expect(API.delete).toHaveBeenCalledWith("/users/1");
    expect(result).toEqual(responseData);
  });
});
