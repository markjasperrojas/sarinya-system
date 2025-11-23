import { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  // Fetch sales from backend
  const loadSales = async () => {
    try {
      const res = await API.get("/sales");
      setSales(res.data);
    } catch (error) {
      console.log("Error loading sales:", error);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // Add new sale
  const handleAddSale = async (e) => {
    e.preventDefault();

    try {
      await API.post("/sales/add", {
        itemName,
        quantity: Number(quantity),
        price: Number(price),
      });

      // reset input fields
      setItemName("");
      setQuantity("");
      setPrice("");

      // reload list
      loadSales();
    } catch (error) {
      console.log("Error adding sale:", error.response?.data || error);
      alert("Failed to add sale");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Sales</h1>

      {/* Add Sale Form */}
      <form
        onSubmit={handleAddSale}
        className="bg-white p-6 rounded shadow max-w-lg mb-8"
      >
        <h2 className="text-xl font-semibold mb-4">Add Sale</h2>

        <input
          type="text"
          placeholder="Item Name"
          className="w-full p-2 border rounded mb-3"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Quantity"
          className="w-full p-2 border rounded mb-3"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Price"
          className="w-full p-2 border rounded mb-3"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Add Sale
        </button>
      </form>

      {/* Sales List */}
      <div className="bg-white p-6 rounded shadow max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Sales List</h2>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Item</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">Price</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale._id}>
                <td className="border p-2">{sale.itemName}</td>
                <td className="border p-2">{sale.quantity}</td>
                <td className="border p-2">₱{sale.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link to="/dashboard">Go to dashboard</Link>
    </div>
  );
}
