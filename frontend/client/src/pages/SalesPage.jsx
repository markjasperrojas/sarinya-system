import { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

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

  const handleAddSale = async (e) => {
    e.preventDefault();

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

      loadSales();
    } catch (error) {
      console.log("Error adding sale:", error);
      alert("Failed to add sale");
    }
  };

  const overallTotal = sales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <div className="p-8 text-base">
      <h1 className="text-4xl font-bold mb-10 text-center">Sales Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Sale Form */}
        <div className="bg-white p-6 rounded-2xl shadow-md h-[375px]">
          <h2 className="text-2xl font-semibold mb-4">Add New Sale</h2>

          <form onSubmit={handleAddSale}>
            <input
              type="text"
              placeholder="Item Name"
              className="w-full p-3 border rounded-lg mb-3 text-base"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="Quantity"
              className="w-full p-3 border rounded-lg mb-3 text-base"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="Price"
              className="w-full p-3 border rounded-lg mb-[55px] text-base"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />

            <button className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 text-base">
              Add Sale
            </button>
          </form>
        </div>

        {/* Sales List */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Sales List</h2>

          <div className="max-h-[420px] overflow-y-auto border rounded-lg">
            <table className="w-full text-left text-base">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-3 border text-lg">Item</th>
                  <th className="p-3 border text-lg">Qty</th>
                  <th className="p-3 border text-lg">Price</th>
                  <th className="p-3 border text-lg">Total</th>
                  <th className="p-3 border text-lg">Date</th>
                  <th className="p-3 border text-lg">Action</th>
                </tr>
              </thead>

              <tbody>
                {sales.map((sale) => (
                  <tr key={sale._id} className="odd:bg-white even:bg-gray-50">
                    <td className="p-3 border">{sale.itemName}</td>
                    <td className="p-3 border">{sale.quantity}</td>
                    <td className="p-3 border">₱{sale.price}</td>
                    <td className="p-3 border font-semibold">₱{sale.total}</td>
                    <td className="p-3 border">
                      {new Date(sale.date).toLocaleString()}
                    </td>

                    <td className="p-3 border text-center">
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded text-xs opacity-70 cursor-not-allowed"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {sales.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center p-4 text-gray-500">
                      No sales yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-gray-100 p-4 rounded-lg text-right">
            <span className="text-xl font-semibold">
              Overall Total:{" "}
              <span className="text-green-600">₱{overallTotal}</span>
            </span>
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
