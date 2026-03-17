import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import AuthContext from "../contexts/AuthContext";

/**
 * Renders a component wrapped in MemoryRouter + AuthProvider.
 * Use for integration-style tests that need real auth context + routing.
 */
export function renderWithProviders(ui, { initialEntries = ["/"] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

/**
 * Renders a component with a mocked auth context value.
 * Use for unit tests that need controlled auth state without real side effects.
 */
export function renderWithMockAuth(ui, mockAuthValue = {}, { initialEntries = ["/"] } = {}) {
  const defaultAuth = {
    user: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
    isAdmin: () => mockAuthValue.user?.role === "admin",
    isStaff: () => mockAuthValue.user?.role === "staff",
    isAuthenticated: () => !!mockAuthValue.user,
    ...mockAuthValue,
  };

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={defaultAuth}>{ui}</AuthContext.Provider>
    </MemoryRouter>
  );
}
