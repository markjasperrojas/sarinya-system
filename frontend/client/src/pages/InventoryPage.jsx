import { useEffect, useState } from "react";
import {
  getInventoryItems,
  addInventoryItem,
} from "../services/inventoryService";
import API from "../api";
import { Link } from "react-router-dom";
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
} from "lucide-react";

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);

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

    if (!name || !quantity || !unit) {
      return;
    }

    setSubmitting(true);

    try {
      await addInventoryItem({ name, quantity, unit });
      setName("");
      setQuantity("");
      setUnit("");
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
    setUnit("");
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
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

            <Button
              variant="success"
              icon={Plus}
              onClick={() => setIsModalOpen(true)}
            >
              <span className="hidden sm:inline">Add Item</span>
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
              <TableSkeleton rows={5} columns={4} />
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
                      Unit
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
                        <td className="px-6 py-4 text-gray-600">{item.unit}</td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            variant="danger"
                            size="small"
                            icon={Trash2}
                            onClick={() => handleDeleteInventory(item._id)}
                            loading={deletingId === item._id}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredItems.length === 0 && !loading && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
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
            placeholder="e.g., Rice, Cooking Oil"
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
            label="Unit"
            type="text"
            placeholder="e.g., kg, pcs, liters"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
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
    </div>
  );
}
