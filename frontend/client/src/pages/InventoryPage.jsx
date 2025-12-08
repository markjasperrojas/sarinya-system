import { useEffect, useState } from "react";
import {
  getInventoryItems,
  addInventoryItem,
  deleteInventoryItem,
} from "../services/inventoryService";
import { Link } from "react-router-dom";

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(false);

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
      loadItems();
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
    <div className="p-8 text-base">
      <h1 className="text-4xl font-bold mb-10 text-center">
        Inventory Management
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Item Form */}
        <div className="bg-white p-6 rounded-2xl shadow-md h-[375px]">
          <h2 className="text-2xl font-semibold mb-4">Add New Item</h2>

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
              className="w-full p-3 border rounded-lg mb-[55px] text-base"
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
        </div>

        {/* Inventory List */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Inventory List</h2>

          <div className="max-h-[420px] overflow-y-auto border rounded-lg">
            <table className="w-full text-left text-base">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-3 border text-lg">Item</th>
                  <th className="p-3 border text-lg">Quantity</th>
                  <th className="p-3 border text-lg">Unit</th>
                  <th className="p-3 border text-lg">Action</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="odd:bg-white even:bg-gray-50">
                    <td className="p-3 border">{item.name}</td>
                    <td className="p-3 border">{item.quantity}</td>
                    <td className="p-3 border">{item.unit}</td>
                    <td className="p-3 border text-center">
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs"
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
      </div>

      <Link
        to="/dashboard"
        className="block mt-6 text-blue-600 hover:underline"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
