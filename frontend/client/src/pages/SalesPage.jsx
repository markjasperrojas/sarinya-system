import { useEffect, useState } from "react";
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
  ShoppingCart,
  Calendar,
  TrendingUp,
} from "lucide-react";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await API.get("/sales");
      setSales(res.data);
    } catch (error) {
      console.log("Error loading sales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handleAddSale = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      await API.post("/sales/add", {
        itemName,
        quantity: Number(quantity),
        price: Number(price),
        total: Number(quantity) * Number(price),
      });

      setItemName("");
      setQuantity("");
      setPrice("");
      setIsModalOpen(false);
      loadSales();
    } catch (error) {
      console.log("Error adding sale:", error);
      alert("Failed to add sale");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSale = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sale?")) return;

    setDeletingId(id);
    try {
      await API.delete(`/sales/${id}`);
      loadSales();
    } catch (error) {
      console.log("Delete sale failed:", error);
      alert("Failed to delete sale");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setItemName("");
    setQuantity("");
    setPrice("");
  };

  const overallTotal = sales.reduce((sum, sale) => sum + sale.total, 0);
  const previewTotal = Number(quantity || 0) * Number(price || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-700 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sales</h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {sales.length} transactions
                </p>
              </div>
            </div>

            <Button
              variant="success"
              icon={Plus}
              onClick={() => setIsModalOpen(true)}
            >
              <span className="hidden sm:inline">Add Sale</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Revenue Summary Card */}
        <div className="card p-6 mb-6 bg-gradient-to-r from-success-500 to-success-600 text-white animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm font-medium">
                Total Revenue
              </p>
              <p className="text-3xl sm:text-4xl font-bold mt-1">
                ₱{overallTotal.toLocaleString()}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Sales Table Card */}
        <div className="card overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-gray-900">Sales History</h2>
          </div>

          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} columns={6} />
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((sale) => (
                    <tr
                      key={sale._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {sale.itemName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {sale.quantity}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        ₱{sale.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-success-100 text-success-800">
                          ₱{sale.total.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {new Date(sale.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="danger"
                          size="small"
                          icon={Trash2}
                          onClick={() => handleDeleteSale(sale._id)}
                          loading={deletingId === sale._id}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {sales.length === 0 && !loading && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">
                          No sales recorded yet
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Add your first sale to start tracking revenue
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

      {/* Add Sale Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add New Sale"
      >
        <form onSubmit={handleAddSale} className="space-y-4">
          <Input
            label="Item Name"
            type="text"
            placeholder="e.g., Adobo, Sinigang"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="1"
            />

            <Input
              label="Price (₱)"
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0"
              step="0.01"
            />
          </div>

          {/* Live Total Preview */}
          {(quantity || price) && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-success-700">
                  Preview Total:
                </span>
                <span className="text-xl font-bold text-success-700">
                  ₱{previewTotal.toLocaleString()}
                </span>
              </div>
            </div>
          )}

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
              Add Sale
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
