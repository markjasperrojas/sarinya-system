import { useEffect, useState } from "react";
import {
  getInventoryItems,
  addInventoryItem,
  sellInventoryItem,
  updateInventoryItem,
} from "../services/inventoryService";
import API from "../api";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/Modal";
import Button from "../components/Button";
import Input from "../components/Input";
import TableSkeleton from "../components/TableSkeleton";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Package,
  AlertCircle,
  Search,
  ShoppingCart,
  Pencil,
} from "lucide-react";

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Sell modal state
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sellQuantity, setSellQuantity] = useState("");
  const [selling, setSelling] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editing, setEditing] = useState(false);

  const { hasPermission } = useAuth();

  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getInventoryItems();
      setItems(data);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();

    if (!name || !quantity || !price || !expirationDate) {
      return;
    }

    setSubmitting(true);

    try {
      await addInventoryItem({ name, quantity, price, expirationDate });
      setName("");
      setQuantity("");
      setPrice("");
      setExpirationDate("");
      setIsModalOpen(false);
      loadItems();
    } catch (error) {
      console.error("Add item failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInventory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    setDeletingId(id);
    try {
      await API.delete(`/inventory/${id}`);
      loadItems();
    } catch (error) {
      console.log("Delete inventory failed:", error);
      alert("Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setName("");
    setQuantity("");
    setPrice("");
    setExpirationDate("");
  };

  const handleOpenSellModal = (item) => {
    setSelectedItem(item);
    setSellQuantity("");
    setIsSellModalOpen(true);
  };

  const handleCloseSellModal = () => {
    setIsSellModalOpen(false);
    setSelectedItem(null);
    setSellQuantity("");
  };

  const handleSellItem = async (e) => {
    e.preventDefault();

    if (!sellQuantity || Number(sellQuantity) <= 0) {
      return;
    }

    setSelling(true);

    try {
      await sellInventoryItem(selectedItem._id, Number(sellQuantity));
      handleCloseSellModal();
      loadItems();
    } catch (error) {
      console.error("Sell item failed:", error);
      alert(error.response?.data?.error || "Failed to sell item");
    } finally {
      setSelling(false);
    }
  };

  const sellPreviewTotal = selectedItem
    ? Number(sellQuantity || 0) * selectedItem.price
    : 0;

  const handleOpenEditModal = (item) => {
    setEditItem({
      ...item,
      expirationDate: item.expirationDate
        ? new Date(item.expirationDate).toISOString().split("T")[0]
        : "",
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditItem(null);
  };

  const handleEditItem = async (e) => {
    e.preventDefault();

    if (
      !editItem.name ||
      !editItem.quantity ||
      !editItem.price ||
      !editItem.expirationDate
    ) {
      return;
    }

    setEditing(true);

    try {
      await updateInventoryItem(editItem._id, {
        name: editItem.name,
        quantity: Number(editItem.quantity),
        price: Number(editItem.price),
        expirationDate: editItem.expirationDate,
      });
      handleCloseEditModal();
      loadItems();
    } catch (error) {
      console.error("Edit item failed:", error);
      alert(error.response?.data?.error || "Failed to update item");
    } finally {
      setEditing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getExpirationStatus = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expirationDate = new Date(dateString);
    expirationDate.setHours(0, 0, 0, 0);
    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "expired";
    } else if (diffDays <= 7) {
      return "warning";
    }
    return "normal";
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {items.length} items total
                </p>
              </div>
            </div>

            {hasPermission("inventory", "add") && (
              <Button
                variant="success"
                icon={Plus}
                onClick={() => setIsModalOpen(true)}
              >
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Inventory Table Card */}
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
                      Item Name
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Expiration Date
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => {
                    const isLowStock =
                      Number(item.quantity) <= LOW_STOCK_THRESHOLD;
                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isLowStock ? "bg-warning-500" : "bg-success-500"
                              }`}
                            ></div>
                            <span className="font-medium text-gray-900">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                              isLowStock
                                ? "bg-warning-100 text-warning-800"
                                : "bg-success-100 text-success-800"
                            }`}
                          >
                            {item.quantity}
                            {isLowStock && (
                              <AlertCircle className="w-3 h-3 ml-1" />
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          ₱{item.price?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const status = getExpirationStatus(
                              item.expirationDate,
                            );
                            const statusStyles = {
                              expired: "bg-red-100 text-red-800",
                              warning: "bg-yellow-100 text-yellow-800",
                              normal: "bg-green-100 text-green-800",
                            };
                            const statusLabels = {
                              expired: "Expired",
                              warning: "Expiring Soon",
                              normal: "",
                            };
                            return (
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${statusStyles[status]}`}
                              >
                                {formatDate(item.expirationDate)}
                                {statusLabels[status] && (
                                  <span className="ml-1 text-xs">
                                    ({statusLabels[status]})
                                  </span>
                                )}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {hasPermission("sales", "add") && (
                              <Button
                                variant="success"
                                size="small"
                                icon={ShoppingCart}
                                onClick={() => handleOpenSellModal(item)}
                                disabled={item.quantity === 0}
                              >
                                Sell
                              </Button>
                            )}
                            {hasPermission("inventory", "edit") && (
                              <Button
                                variant="primary"
                                size="small"
                                icon={Pencil}
                                onClick={() => handleOpenEditModal(item)}
                              >
                                Edit
                              </Button>
                            )}
                            {hasPermission("inventory", "delete") && (
                              <Button
                                variant="danger"
                                size="small"
                                icon={Trash2}
                                onClick={() => handleDeleteInventory(item._id)}
                                loading={deletingId === item._id}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredItems.length === 0 && !loading && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">
                          {searchTerm
                            ? "No items match your search"
                            : "No inventory items yet"}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          {searchTerm
                            ? "Try a different search term"
                            : "Add your first item to get started"}
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
          to="/dashboard"
          className="inline-flex items-center gap-2 mt-6 text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </main>

      {/* Add Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add New Item"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <Input
            label="Item Name"
            type="text"
            placeholder="Enter item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Quantity"
            type="number"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            min="0"
          />

          <Input
            label="Price (₱)"
            type="number"
            placeholder="Enter price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0"
            step="0.01"
          />

          <Input
            label="Expiration Date"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={submitting}
              fullWidth
              icon={Plus}
            >
              Add Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Sell Item Modal */}
      <Modal
        isOpen={isSellModalOpen}
        onClose={handleCloseSellModal}
        title="Sell Item"
      >
        {selectedItem && (
          <form onSubmit={handleSellItem} className="space-y-4">
            {/* Item Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{selectedItem.name}</p>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Available: {selectedItem.quantity}</span>
                <span>Price: ₱{selectedItem.price?.toLocaleString()}</span>
              </div>
            </div>

            <Input
              label="Quantity to Sell"
              type="number"
              placeholder="Enter quantity"
              value={sellQuantity}
              onChange={(e) => setSellQuantity(e.target.value)}
              required
              min="1"
              max={selectedItem.quantity}
            />

            {/* Live Total Preview */}
            {sellQuantity && Number(sellQuantity) > 0 && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-success-700">
                    Total:
                  </span>
                  <span className="text-xl font-bold text-success-700">
                    ₱{sellPreviewTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Validation warning */}
            {sellQuantity && Number(sellQuantity) > selectedItem.quantity && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                Cannot sell more than available quantity
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseSellModal}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="success"
                loading={selling}
                fullWidth
                icon={ShoppingCart}
                disabled={
                  !sellQuantity ||
                  Number(sellQuantity) <= 0 ||
                  Number(sellQuantity) > selectedItem.quantity
                }
              >
                Confirm Sale
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Edit Item"
      >
        {editItem && (
          <form onSubmit={handleEditItem} className="space-y-4">
            <Input
              label="Item Name"
              type="text"
              placeholder="Enter item name"
              value={editItem.name}
              onChange={(e) =>
                setEditItem({ ...editItem, name: e.target.value })
              }
              required
            />

            <Input
              label="Quantity"
              type="number"
              placeholder="Enter quantity"
              value={editItem.quantity}
              onChange={(e) =>
                setEditItem({ ...editItem, quantity: e.target.value })
              }
              required
              min="0"
            />

            <Input
              label="Price (₱)"
              type="number"
              placeholder="Enter price"
              value={editItem.price}
              onChange={(e) =>
                setEditItem({ ...editItem, price: e.target.value })
              }
              required
              min="0"
              step="0.01"
            />

            <Input
              label="Expiration Date"
              type="date"
              value={editItem.expirationDate}
              onChange={(e) =>
                setEditItem({ ...editItem, expirationDate: e.target.value })
              }
              required
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEditModal}
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
    </>
  );
}
