import { useEffect, useState } from "react";
import {
  getInventoryItems,
  addInventoryItem,
} from "../services/inventoryService";
import API from "../api";
import { Link } from "react-router-dom";
import Modal from "../components/Modal";

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await getInventoryItems();
      setItems(data);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();

    if (!name || !quantity || !unit) {
      alert("Please fill all fields!");
      return;
    }

    setLoading(true);

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
      setLoading(false);
    }
  };

  const handleDeleteInventory = async (id) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      await API.delete(`/inventory/${id}`);
      loadItems();
    } catch (error) {
      console.log("Delete inventory failed:", error);
      alert("Failed to delete item");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setName("");
    setQuantity("");
    setUnit("");
  };

  return (
    <div className="p-4 sm:p-8 text-base">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-bold">Inventory Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-green-700 w-full sm:w-auto"
        >
          + Add New Item
        </button>
      </div>

      {/* Inventory List */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Inventory List</h2>

        <div className="max-h-[500px] overflow-auto border rounded-lg">
          <table className="w-full text-left text-sm sm:text-base min-w-[400px]">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-2 sm:p-3 border text-base sm:text-lg">Item</th>
                <th className="p-2 sm:p-3 border text-base sm:text-lg">Qty</th>
                <th className="p-2 sm:p-3 border text-base sm:text-lg">Unit</th>
                <th className="p-2 sm:p-3 border text-base sm:text-lg">Action</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="odd:bg-white even:bg-gray-50">
                  <td className="p-2 sm:p-3 border">{item.name}</td>
                  <td className="p-2 sm:p-3 border">{item.quantity}</td>
                  <td className="p-2 sm:p-3 border">{item.unit}</td>
                  <td className="p-2 sm:p-3 border text-center">
                    <button
                      onClick={() => handleDeleteInventory(item._id)}
                      className="px-2 sm:px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center p-4 text-gray-500">
                    No items yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Link
        to="/dashboard"
        className="block mt-6 text-blue-600 hover:underline"
      >
        ← Back to Dashboard
      </Link>

      {/* Add Item Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add New Item">
        <form onSubmit={handleAddItem}>
          <input
            type="text"
            placeholder="Item Name"
            className="w-full p-3 border rounded-lg mb-3 text-base"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="number"
            placeholder="Quantity"
            className="w-full p-3 border rounded-lg mb-3 text-base"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <input
            type="text"
            placeholder="Unit (kg, pcs, etc.)"
            className="w-full p-3 border rounded-lg mb-4 text-base"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 text-base"
          >
            {loading ? "Adding..." : "Add Item"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
