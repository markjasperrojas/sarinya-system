import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";
import { bulkSell } from "../services/inventoryService";
import {
  Utensils,
  Search,
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  ImageOff,
  ChevronUp,
} from "lucide-react";
import API from "../api";

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [stockCounts, setStockCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderItems, setOrderItems] = useState({}); // productId → qty
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showOrderSheet, setShowOrderSheet] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
    } catch (err) {
      console.error("Failed to load sell page data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTap = (product) => {
    const current = orderItems[product._id] || 0;
    const available = stockCounts[product._id] || 0;
    if (current >= available) return;
    setOrderItems((prev) => ({ ...prev, [product._id]: current + 1 }));
  };

  const handleIncrement = (productId) => {
    const current = orderItems[productId] || 0;
    const available = stockCounts[productId] || 0;
    if (current >= available) return;
    setOrderItems((prev) => ({ ...prev, [productId]: current + 1 }));
  };

  const handleDecrement = (productId) => {
    const current = orderItems[productId] || 0;
    if (current <= 1) {
      handleRemove(productId);
      return;
    }
    setOrderItems((prev) => ({ ...prev, [productId]: current - 1 }));
  };

  const handleRemove = (productId) => {
    setOrderItems((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handleClear = () => setOrderItems({});

  const handleProcessSale = async () => {
    const items = Object.entries(orderItems).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
    if (items.length === 0) return;

    setProcessing(true);
    try {
      await bulkSell(items);
      setOrderItems({});
      setShowOrderSheet(false);
      await loadData();
      setSuccessMsg("Order processed!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to process sale");
    } finally {
      setProcessing(false);
    }
  };

  const orderList = products.filter((p) => (orderItems[p._id] || 0) > 0);
  const orderTotal = orderList.reduce(
    (sum, p) => sum + p.price * (orderItems[p._id] || 0),
    0
  );
  const orderCount = Object.values(orderItems).reduce((sum, q) => sum + q, 0);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Shared order rows JSX (used in both desktop panel and mobile sheet)
  const OrderRows = () =>
    orderList.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <ShoppingBag className="w-10 h-10 text-gray-200 mb-3" />
        <p className="text-gray-400 text-sm">Tap a product to add it</p>
      </div>
    ) : (
      <>
        {orderList.map((product) => {
          const qty = orderItems[product._id];
          const lineTotal = product.price * qty;
          return (
            <div
              key={product._id}
              className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {product.name}
                </p>
                <p className="text-xs text-gray-500">
                  ₱{product.price?.toLocaleString()} × {qty} ={" "}
                  <span className="font-semibold text-gray-700">
                    ₱{lineTotal.toLocaleString()}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleDecrement(product._id)}
                  className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-3 h-3 text-gray-600" />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-gray-900">
                  {qty}
                </span>
                <button
                  onClick={() => handleIncrement(product._id)}
                  disabled={qty >= (stockCounts[product._id] || 0)}
                  className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3 text-gray-600" />
                </button>
                <button
                  onClick={() => handleRemove(product._id)}
                  className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center transition-colors ml-1"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            </div>
          );
        })}
      </>
    );

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Take Order</h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Select items to add to order
              </p>
            </div>
            {/* Mobile success toast in header area */}
            {successMsg && (
              <div className="md:hidden ml-auto flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-xs font-medium">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {successMsg}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* POS Body */}
      <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
        {/* ── Left: Product Grid ── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-36 md:pb-6">
          {/* Search */}
          <div className="mb-5">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
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

          {/* Cards */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="w-full h-36 bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Utensils className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((product) => {
                const stock = stockCounts[product._id] || 0;
                const inOrder = orderItems[product._id] || 0;
                const isOutOfStock = stock === 0;
                const isMaxed = inOrder >= stock && stock > 0;
                const isLow = stock > 0 && stock <= 5;

                return (
                  <button
                    key={product._id}
                    onClick={() => handleTap(product)}
                    disabled={isOutOfStock}
                    className={`card overflow-hidden text-left transition-all relative focus:outline-none
                      ${
                        isOutOfStock
                          ? "opacity-50 cursor-not-allowed"
                          : isMaxed
                          ? "ring-2 ring-primary-400 cursor-not-allowed"
                          : "card-hover active:scale-95 cursor-pointer hover:ring-2 hover:ring-primary-300"
                      }`}
                  >
                    {/* Image */}
                    <div className="w-full h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageOff className="w-8 h-8 text-gray-300" />
                      )}
                    </div>

                    {/* Order badge */}
                    {inOrder > 0 && (
                      <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center shadow">
                        {inOrder}
                      </span>
                    )}

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                        {product.name}
                      </h3>
                      <p className="text-primary-600 font-bold mt-0.5">
                        ₱{product.price?.toLocaleString()}
                      </p>
                      <span
                        className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full
                          ${
                            isOutOfStock
                              ? "bg-red-100 text-red-600"
                              : isLow
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                      >
                        {isOutOfStock ? "Out of stock" : `${stock} left`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>

        {/* ── Desktop: Right Order Panel (hidden on mobile) ── */}
        <aside className="hidden md:flex w-80 border-l border-gray-200 bg-white flex-col flex-shrink-0">
          {/* Panel Header */}
          <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">Current Order</span>
              {orderCount > 0 && (
                <span className="text-xs bg-primary-100 text-primary-700 font-semibold px-2 py-0.5 rounded-full">
                  {orderCount}
                </span>
              )}
            </div>
            {orderCount > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Order Items */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            <OrderRows />
          </div>

          {/* Total + Actions */}
          <div className="px-4 py-4 border-t border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total</span>
              <span className="text-xl font-bold text-gray-900">
                ₱{orderTotal.toLocaleString()}
              </span>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm font-medium">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {successMsg}
              </div>
            )}

            <button
              onClick={handleProcessSale}
              disabled={orderCount === 0 || processing}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all
                bg-primary-600 hover:bg-primary-700 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {processing
                ? "Processing..."
                : `Process Order · ₱${orderTotal.toLocaleString()}`}
            </button>
          </div>
        </aside>
      </div>

      {/* ── Mobile: Sticky Bottom Bar (above BottomNav) ── */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 flex gap-2">
        <button
          onClick={() => setShowOrderSheet(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          {orderCount > 0 ? (
            <>
              View Order
              <span className="bg-primary-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {orderCount}
              </span>
            </>
          ) : (
            "View Order"
          )}
        </button>
        <button
          onClick={handleProcessSale}
          disabled={orderCount === 0 || processing}
          className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all
            bg-primary-600 hover:bg-primary-700 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {processing
            ? "Processing..."
            : orderCount === 0
            ? "Process Order"
            : `Process · ₱${orderTotal.toLocaleString()}`}
        </button>
      </div>

      {/* ── Mobile: Order Sheet ── */}
      {showOrderSheet && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowOrderSheet(false)}
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col">
            {/* Sheet Handle + Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-900">
                  Current Order
                </span>
                {orderCount > 0 && (
                  <span className="text-xs bg-primary-100 text-primary-700 font-semibold px-2 py-0.5 rounded-full">
                    {orderCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {orderCount > 0 && (
                  <button
                    onClick={handleClear}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setShowOrderSheet(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronUp className="w-5 h-5 rotate-180" />
                </button>
              </div>
            </div>

            {/* Order Items — scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              <OrderRows />
            </div>

            {/* Total + Process */}
            <div className="px-4 py-4 border-t border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  ₱{orderTotal.toLocaleString()}
                </span>
              </div>
              <button
                onClick={handleProcessSale}
                disabled={orderCount === 0 || processing}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all
                  bg-primary-600 hover:bg-primary-700 active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {processing
                  ? "Processing..."
                  : `Process Order · ₱${orderTotal.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
