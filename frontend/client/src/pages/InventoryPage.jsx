import { useEffect, useState } from "react";
import {
  getInventoryItems,
  addInventoryItem,
  deleteInventoryItem,
} from "../services/inventoryService";

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(false);

  // Load items when page opens
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
      loadItems(); // reload items
    } catch (error) {
      console.error("Add item failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      await deleteInventoryItem(id);
      loadItems();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Inventory</h1>

      {/* Add item form */}
      <form
        onSubmit={handleAddItem}
        className="mb-6 p-4 bg-white shadow rounded"
      >
        <h2 className="text-lg font-semibold mb-2">Add New Item</h2>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Item name"
            className="border p-2 rounded w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="number"
            placeholder="Qty"
            className="border p-2 rounded w-28"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <input
            type="text"
            placeholder="Unit (kg, pcs...)"
            className="border p-2 rounded w-32"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Adding..." : "Add Item"}
        </button>
      </form>

      {/* Inventory list */}
      <div className="bg-white shadow rounded">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border">Item</th>
              <th className="p-3 border">Quantity</th>
              <th className="p-3 border">Unit</th>
              <th className="p-3 border">Action</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="p-3 border">{item.name}</td>
                <td className="p-3 border">{item.quantity}</td>
                <td className="p-3 border">{item.unit}</td>
                <td className="p-3 border">
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
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
  );
}
