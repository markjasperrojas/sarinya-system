import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";
import Card from "../components/Card";
import { Utensils, Search, X, Package } from "lucide-react";
import API from "../api";

export default function AvailableFoodsPage() {
  const [products, setProducts] = useState([]);
  const [stockCounts, setStockCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [prods, inventory] = await Promise.all([
          getProducts(),
          API.get("/inventory").then((r) => r.data),
        ]);
        setProducts(prods);

        const counts = {};
        inventory.forEach((item) => {
          const pid = item.product?._id;
          if (pid) counts[pid] = (counts[pid] || 0) + item.quantity;
        });
        setStockCounts(counts);
      } catch (error) {
        console.error("Failed to load available foods:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Available Foods</h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                {products.filter((p) => (stockCounts[p._id] || 0) > 0).length} items available
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search foods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">
              {searchTerm ? "No foods match your search" : "No foods found"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm ? "Try a different search term" : "Add products to see them here"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
            {filtered.map((product) => (
              <Card
                key={product._id}
                image={product.image}
                name={product.name}
                price={product.price}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
