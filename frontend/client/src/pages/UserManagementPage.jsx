import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/userService";
import Modal from "../components/Modal";
import Button from "../components/Button";
import Input from "../components/Input";
import TableSkeleton from "../components/TableSkeleton";
import PermissionCheckbox from "../components/PermissionCheckbox";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Shield,
  UserCheck,
  UserX,
  Search,
} from "lucide-react";

const defaultPermissions = {
  inventory: { view: true, add: false, edit: false, delete: false },
  sales: { view: true, add: true, edit: false, delete: false },
  users: { view: false, add: false, edit: false, delete: false },
};

const adminPermissions = {
  inventory: { view: true, add: true, edit: true, delete: true },
  sales: { view: true, add: true, edit: true, delete: true },
  users: { view: true, add: true, edit: true, delete: true },
};

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    username: "",
    password: "",
    role: "staff",
    permissions: { ...defaultPermissions },
    isActive: true,
  });
  const [adding, setAdding] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      navigate("/dashboard");
      return;
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!addForm.username || !addForm.password) return;

    setAdding(true);
    try {
      await createUser({
        ...addForm,
        permissions:
          addForm.role === "admin" ? adminPermissions : addForm.permissions,
      });
      setIsAddModalOpen(false);
      setAddForm({
        username: "",
        password: "",
        role: "staff",
        permissions: { ...defaultPermissions },
        isActive: true,
      });
      loadUsers();
    } catch (error) {
      console.error("Failed to create user:", error);
      alert(error.response?.data?.error || "Failed to create user");
    } finally {
      setAdding(false);
    }
  };

  const handleOpenEditModal = (userToEdit) => {
    setEditForm({
      ...userToEdit,
      password: "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editForm.username) return;

    setEditing(true);
    try {
      const updateData = {
        username: editForm.username,
        role: editForm.role,
        permissions:
          editForm.role === "admin" ? adminPermissions : editForm.permissions,
        isActive: editForm.isActive,
      };

      // Only include password if it was changed
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      await updateUser(editForm._id, updateData);
      setIsEditModalOpen(false);
      setEditForm(null);
      loadUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      alert(error.response?.data?.error || "Failed to update user");
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (id === currentUser.id) {
      alert("Cannot delete your own account");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user?")) return;

    setDeletingId(id);
    try {
      await deleteUser(id);
      loadUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert(error.response?.data?.error || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (userToToggle) => {
    try {
      await updateUser(userToToggle._id, { isActive: !userToToggle.isActive });
      loadUsers();
    } catch (error) {
      console.error("Failed to toggle user status:", error);
      alert(error.response?.data?.error || "Failed to update user");
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  User Management
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {users.length} users total
                </p>
              </div>
            </div>

            <Button
              variant="success"
              icon={Plus}
              onClick={() => setIsAddModalOpen(true)}
            >
              <span className="hidden sm:inline">Add User</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Users Table Card */}
        <div className="card overflow-hidden animate-fade-in">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} columns={5} />
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              u.role === "admin"
                                ? "bg-purple-100 text-purple-600"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {u.role === "admin" ? (
                              <Shield className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900">
                            {u.username}
                          </span>
                          {u._id === currentUser.id && (
                            <span className="text-xs text-gray-400">(you)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium capitalize ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={u._id === currentUser.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                            u.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          } ${u._id === currentUser.id ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          {u.isActive ? (
                            <>
                              <UserCheck className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" /> Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="primary"
                            size="small"
                            icon={Pencil}
                            onClick={() => handleOpenEditModal(u)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            icon={Trash2}
                            onClick={() => handleDeleteUser(u._id)}
                            loading={deletingId === u._id}
                            disabled={u._id === currentUser.id}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && !loading && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">
                          {searchTerm
                            ? "No users match your search"
                            : "No users found"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back Link */}
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 mt-6 text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Dashboard
        </Link>
      </main>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New User"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <Input
            label="Username"
            type="text"
            placeholder="Enter username"
            value={addForm.username}
            onChange={(e) =>
              setAddForm({ ...addForm, username: e.target.value })
            }
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={addForm.password}
            onChange={(e) =>
              setAddForm({ ...addForm, password: e.target.value })
            }
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={addForm.role}
              onChange={(e) =>
                setAddForm({
                  ...addForm,
                  role: e.target.value,
                  permissions:
                    e.target.value === "admin"
                      ? adminPermissions
                      : defaultPermissions,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {addForm.role === "staff" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Permissions
              </label>
              <PermissionCheckbox
                label="Inventory"
                module="inventory"
                permissions={addForm.permissions}
                onChange={(permissions) =>
                  setAddForm({ ...addForm, permissions })
                }
              />
              <PermissionCheckbox
                label="Sales"
                module="sales"
                permissions={addForm.permissions}
                onChange={(permissions) =>
                  setAddForm({ ...addForm, permissions })
                }
              />
              <PermissionCheckbox
                label="Users"
                module="users"
                permissions={addForm.permissions}
                onChange={(permissions) =>
                  setAddForm({ ...addForm, permissions })
                }
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={adding}
              fullWidth
              icon={Plus}
            >
              Add User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditForm(null);
        }}
        title="Edit User"
      >
        {editForm && (
          <form onSubmit={handleEditUser} className="space-y-4">
            <Input
              label="Username"
              type="text"
              placeholder="Enter username"
              value={editForm.username}
              onChange={(e) =>
                setEditForm({ ...editForm, username: e.target.value })
              }
              required
            />

            <Input
              label="New Password (leave blank to keep current)"
              type="password"
              placeholder="Enter new password"
              value={editForm.password}
              onChange={(e) =>
                setEditForm({ ...editForm, password: e.target.value })
              }
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={editForm.role}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    role: e.target.value,
                    permissions:
                      e.target.value === "admin"
                        ? adminPermissions
                        : editForm.permissions,
                  })
                }
                disabled={editForm._id === currentUser.id}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              {editForm._id === currentUser.id && (
                <p className="text-xs text-gray-500 mt-1">
                  Cannot change your own role
                </p>
              )}
            </div>

            {editForm.role === "staff" && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Permissions
                </label>
                <PermissionCheckbox
                  label="Inventory"
                  module="inventory"
                  permissions={editForm.permissions}
                  onChange={(permissions) =>
                    setEditForm({ ...editForm, permissions })
                  }
                />
                <PermissionCheckbox
                  label="Sales"
                  module="sales"
                  permissions={editForm.permissions}
                  onChange={(permissions) =>
                    setEditForm({ ...editForm, permissions })
                  }
                />
                <PermissionCheckbox
                  label="Users"
                  module="users"
                  permissions={editForm.permissions}
                  onChange={(permissions) =>
                    setEditForm({ ...editForm, permissions })
                  }
                />
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isActive: e.target.checked })
                  }
                  disabled={editForm._id === currentUser.id}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Active account</span>
              </label>
              {editForm._id === currentUser.id && (
                <p className="text-xs text-gray-500 mt-1">
                  Cannot deactivate your own account
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditForm(null);
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={editing}
                fullWidth
                icon={Pencil}
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
