import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import SalesPage from "./pages/SalesPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import UserManagementPage from "./pages/UserManagementPage";
import ActivityLogsPage from "./pages/ActivityLogsPage";
import ProductsPage from "./pages/ProductsPage";
import AvailableFoodsPage from "./pages/AvailableFoodsPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/available-foods"
            element={
              <ProtectedRoute>
                <Layout>
                  <AvailableFoodsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute
                requiredPermission={{ module: "inventory", action: "view" }}
              >
                <Layout>
                  <InventoryPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute
                requiredPermission={{ module: "inventory", action: "view" }}
              >
                <Layout>
                  <ProductsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <ProtectedRoute
                requiredPermission={{ module: "sales", action: "view" }}
              >
                <Layout>
                  <SalesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <AdminDashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <UserManagementPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activity-logs"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <ActivityLogsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
