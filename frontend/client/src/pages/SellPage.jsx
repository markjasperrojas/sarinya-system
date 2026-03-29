import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";
import { bulkSell } from "../services/inventoryService";
import {
  getRecentSessions,
  getSessionDetail,
  addItemsToSession,
  removeSessionItem,
  updateSessionItemQty,
} from "../services/salesService";
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
  Clock,
  ArrowLeft,
} from "lucide-react";
import API from "../api";
import { PRODUCT_CATEGORIES } from "../constants/categories";

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [stockCounts, setStockCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [orderItems, setOrderItems] = useState({}); // productId → qty (new items)
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showOrderSheet, setShowOrderSheet] = useState(false);

  // Edit order state
  const [recentSessions, setRecentSessions] = useState([]);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [sessionSales, setSessionSales] = useState([]); // existing committed sale records
  const [showRecentPanel, setShowRecentPanel] = useState(false); // desktop toggle
  const [showRecentSheet, setShowRecentSheet] = useState(false); // mobile sheet

  // Notes state
  const [orderNotes, setOrderNotes] = useState("");

  // Quantity overrides for existing session items (productId -> desired qty)
  const [sessionItemQtyOverride, setSessionItemQtyOverride] = useState({});


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, inventory, sessions] = await Promise.all([
        getProducts(),
        API.get("/inventory").then((r) => r.data),
        getRecentSessions(),
      ]);
      setProducts(prods);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const counts = {};
      inventory.forEach((item) => {
        const pid = item.product?._id;
        const expDate = item.expirationDate ? new Date(item.expirationDate) : null;
        if (pid && expDate && expDate >= today) {
          counts[pid] = (counts[pid] || 0) + item.quantity;
        }
      });
      setStockCounts(counts);
      setRecentSessions(sessions);
    } catch (err) {
      console.error("Failed to load sell page data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Product tap / quantity handlers ──────────────────────────────────────

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

  const handleClear = () => {
    setOrderItems({});
    setOrderNotes("");
  };

  // ── New order ─────────────────────────────────────────────────────────────

  const handleProcessSale = async () => {
    const items = Object.entries(orderItems).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
    if (items.length === 0) return;

    setProcessing(true);
    try {
      const data = await bulkSell(items, orderNotes);
      setOrderItems({});
      setOrderNotes("");
      setShowOrderSheet(false);
      await loadData();
      setSuccessMsg("Order processed!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to process sale");
    } finally {
      setProcessing(false);
    }
  };

  // ── Edit order handlers ───────────────────────────────────────────────────

  const handleOpenSession = async (session) => {
    try {
      const data = await getSessionDetail(session._id);
      setEditingSessionId(session._id);
      setSessionSales(data.sales);
      setOrderNotes(data.sales[0]?.notes || "");
      setOrderItems({});
      setSessionItemQtyOverride({});
      setShowRecentPanel(false);
      setShowRecentSheet(false);
      setShowOrderSheet(true);
    } catch (err) {
      alert("Failed to load order");
    }
  };

  const handleExitEditMode = () => {
    setEditingSessionId(null);
    setSessionSales([]);
    setOrderItems({});
    setOrderNotes("");
    setSessionItemQtyOverride({});
  };

  const handleRemoveSessionItem = async (saleIds) => {
    // saleIds can be a single id or array (when product spans multiple batches)
    const ids = Array.isArray(saleIds) ? saleIds : [saleIds];

    const remainingAfterRemoval = sessionSales.filter((s) => !ids.includes(s._id));
    if (remainingAfterRemoval.length === 0) {
      alert("Cannot remove the last item from an order.");
      return;
    }

    try {
      await Promise.all(ids.map((id) => removeSessionItem(editingSessionId, id)));
      setSessionSales((prev) => prev.filter((s) => !ids.includes(s._id)));
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to remove item");
    }
  };

  const handleSessionItemDecrement = (item) => {
    const current = sessionItemQtyOverride[item.productId] ?? item.quantity;
    if (current <= 1) return; // min 1; use trash to remove the item entirely
    setSessionItemQtyOverride((prev) => ({ ...prev, [item.productId]: current - 1 }));
  };

  const handleSessionItemIncrement = (item) => {
    const current = sessionItemQtyOverride[item.productId] ?? item.quantity;
    // item.quantity units are already out of stock; only stockCounts extra are available
    const maxQty = item.quantity + (stockCounts[item.productId] || 0);
    if (current >= maxQty) return;
    setSessionItemQtyOverride((prev) => ({ ...prev, [item.productId]: current + 1 }));
  };

  const handleUpdateOrder = async () => {
    const newItems = Object.entries(orderItems).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    const existingNotes = sessionSales[0]?.notes || "";
    const notesChanged = orderNotes !== existingNotes;
    const hasNewItems = newItems.length > 0;
    const qtyChanges = sessionItemsList.filter(
      (item) =>
        sessionItemQtyOverride[item.productId] !== undefined &&
        sessionItemQtyOverride[item.productId] !== item.quantity
    );
    const hasQtyChanges = qtyChanges.length > 0;

    if (!hasNewItems && !notesChanged && !hasQtyChanges && sessionSales.length > 0) {
      // Nothing changed — just exit edit mode
      handleExitEditMode();
      setShowOrderSheet(false);
      setSuccessMsg("Order updated!");
      setTimeout(() => setSuccessMsg(""), 4000);
      return;
    }

    if (!hasNewItems && !hasQtyChanges && sessionSales.length === 0) return;

    setProcessing(true);
    try {
      // Apply quantity changes for existing items first
      for (const item of qtyChanges) {
        await updateSessionItemQty(
          editingSessionId,
          item.productId,
          sessionItemQtyOverride[item.productId]
        );
      }

      if (hasNewItems || notesChanged) {
        await addItemsToSession(
          editingSessionId,
          hasNewItems ? newItems : [],
          notesChanged ? orderNotes : undefined
        );
      }

      handleExitEditMode();
      setShowOrderSheet(false);
      await loadData();
      setSuccessMsg("Order updated!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update order");
    } finally {
      setProcessing(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const orderList = products.filter((p) => (orderItems[p._id] || 0) > 0);
  const newItemsTotal = orderList.reduce(
    (sum, p) => sum + p.price * (orderItems[p._id] || 0),
    0
  );
  const orderCount = Object.values(orderItems).reduce((sum, q) => sum + q, 0);

  // Aggregate sessionSales by product for display
  const sessionItemsMap = {};
  sessionSales.forEach((s) => {
    const pid = s.product?._id;
    if (!pid) return;
    if (sessionItemsMap[pid]) {
      sessionItemsMap[pid].quantity += s.quantity;
      sessionItemsMap[pid].saleIds.push(s._id);
    } else {
      sessionItemsMap[pid] = {
        productId: pid,
        name: s.product.name,
        price: s.price,
        quantity: s.quantity,
        saleIds: [s._id],
      };
    }
  });
  const sessionItemsList = Object.values(sessionItemsMap);
  const sessionTotal = sessionItemsList.reduce((sum, s) => {
    const qty = sessionItemQtyOverride[s.productId] ?? s.quantity;
    return sum + s.price * qty;
  }, 0);
  const combinedTotal = sessionTotal + newItemsTotal;

  const filtered = products
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || (p.categories || []).includes(selectedCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const aInStock = (stockCounts[a._id] || 0) > 0 ? 0 : 1;
      const bInStock = (stockCounts[b._id] || 0) > 0 ? 0 : 1;
      return aInStock - bInStock;
    });

  const shortId = editingSessionId ? editingSessionId.slice(-6).toUpperCase() : "";

  // ── Shared order rows (new items being added) ──────────────────────────────

  const NewOrderRows = () =>
    orderList.length === 0 ? null : (
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

  // Existing order rows for new order mode (no session)
  const OrderRows = () =>
    orderList.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <ShoppingBag className="w-10 h-10 text-gray-200 mb-3" />
        <p className="text-gray-400 text-sm">Tap a product to add it</p>
      </div>
    ) : (
      <NewOrderRows />
    );

  // ── Recent sessions list (shared between desktop panel and mobile sheet) ──

  const RecentSessionsList = () =>
    recentSessions.length === 0 ? (
      <p className="text-xs text-gray-400 text-center py-4">No orders today yet</p>
    ) : (
      <div className="space-y-1">
        {recentSessions.map((s) => {
          const time = new Date(s.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const preview = s.items
            .slice(0, 2)
            .map((i) => i.productName)
            .join(", ");
          const more = s.items.length > 2 ? ` +${s.items.length - 2}` : "";
          return (
            <button
              key={s._id}
              onClick={() => handleOpenSession(s)}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">{time}</span>
                <span className="text-xs font-bold text-primary-600">
                  ₱{s.total.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {preview}
                {more}
              </p>
              {s.notes && (
                <p className="text-xs text-amber-600 truncate mt-0.5 italic">
                  {s.notes}
                </p>
              )}
            </button>
          );
        })}
      </div>
    );

  // ── Order panel content (desktop right panel + inside mobile sheet) ────────

  const EditModeContent = () => (
    <>
      {/* Existing items */}
      {sessionItemsList.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Already ordered
          </p>
          {sessionItemsList.map((item) => {
            const effectiveQty = sessionItemQtyOverride[item.productId] ?? item.quantity;
            const isLastItem = sessionItemsList.length === 1 && orderList.length === 0;
            const maxQty = item.quantity + (stockCounts[item.productId] || 0);
            return (
              <div
                key={item.productId}
                className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    ₱{item.price?.toLocaleString()} × {effectiveQty} ={" "}
                    <span className="font-semibold text-gray-700">
                      ₱{(item.price * effectiveQty).toLocaleString()}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleSessionItemDecrement(item)}
                    disabled={effectiveQty <= 1}
                    className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3 h-3 text-gray-600" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-gray-900">
                    {effectiveQty}
                  </span>
                  <button
                    onClick={() => handleSessionItemIncrement(item)}
                    disabled={effectiveQty >= maxQty}
                    className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleRemoveSessionItem(item.saleIds)}
                    disabled={isLastItem}
                    className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0 ml-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Divider + new items */}
      {orderList.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-1">
            Adding now
          </p>
          <NewOrderRows />
        </>
      )}

      {/* Empty state */}
      {sessionItemsList.length === 0 && orderList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <ShoppingBag className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">All items removed</p>
        </div>
      )}
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
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-36 md:pb-6">
          {/* Search + Category filter */}
          <div className="sticky top-0 z-10 bg-gray-50 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-4 space-y-3">
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
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-gray-300 text-gray-600 hover:border-primary-400"
                }`}
              >
                All
              </button>
              {PRODUCT_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === cat.value
                      ? "bg-primary-600 text-white"
                      : "bg-white border border-gray-300 text-gray-600 hover:border-primary-400"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
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

        {/* ── Desktop: Right Order Panel ── */}
        <aside className="hidden md:flex w-80 border-l border-gray-200 bg-white flex-col flex-shrink-0">
          {/* Panel Header */}
          <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
            {editingSessionId ? (
              <>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">
                    Order #{shortId}
                  </span>
                </div>
                <button
                  onClick={handleExitEditMode}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Exit
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">Current Order</span>
                  {orderCount > 0 && (
                    <span className="text-xs bg-primary-100 text-primary-700 font-semibold px-2 py-0.5 rounded-full">
                      {orderCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {orderCount > 0 && (
                    <button
                      onClick={handleClear}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setShowRecentPanel((v) => !v)}
                    title="Recent Orders"
                    className={`p-1 rounded-md transition-colors ${
                      showRecentPanel
                        ? "text-primary-600 bg-primary-50"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Recent Orders Panel (toggleable, desktop) */}
          {!editingSessionId && showRecentPanel && (
            <div className="border-b border-gray-100 px-4 py-3 bg-gray-50/60">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Today's Orders
              </p>
              <RecentSessionsList />
            </div>
          )}

          {/* Order Items */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {editingSessionId ? <EditModeContent /> : <OrderRows />}
          </div>

          {/* Total + Actions */}
          <div className="px-4 py-4 border-t border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total</span>
              <span className="text-xl font-bold text-gray-900">
                ₱{(editingSessionId ? combinedTotal : newItemsTotal).toLocaleString()}
              </span>
            </div>

            {/* Order notes */}
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Add a note (e.g. no spice, extra rice...)"
              rows={2}
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg resize-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all text-gray-700 placeholder-gray-400"
            />

            {successMsg && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm font-medium">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {successMsg}
              </div>
            )}

            {editingSessionId ? (
              <>
                <button
                  onClick={handleUpdateOrder}
                  disabled={processing}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all
                    bg-primary-600 hover:bg-primary-700 active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {processing ? "Updating..." : "Update Order"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleProcessSale}
                  disabled={orderCount === 0 || processing}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all
                    bg-primary-600 hover:bg-primary-700 active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {processing
                    ? "Processing..."
                    : `Process Order · ₱${newItemsTotal.toLocaleString()}`}
                </button>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* ── Mobile: Sticky Bottom Bar ── */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 flex gap-2">
        <button
          onClick={() => setShowRecentSheet(true)}
          className="py-2.5 px-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
        >
          <Clock className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowOrderSheet(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          {editingSessionId ? (
            <>Edit Order #{shortId}</>
          ) : orderCount > 0 ? (
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
          onClick={editingSessionId ? handleUpdateOrder : handleProcessSale}
          disabled={(editingSessionId ? false : orderCount === 0) || processing}
          className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all
            bg-primary-600 hover:bg-primary-700 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {processing
            ? "..."
            : editingSessionId
            ? "Update"
            : orderCount === 0
            ? "Process Order"
            : `Process · ₱${newItemsTotal.toLocaleString()}`}
        </button>
      </div>

      {/* ── Mobile: Order Sheet ── */}
      {showOrderSheet && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowOrderSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-900">
                  {editingSessionId ? `Order #${shortId}` : "Current Order"}
                </span>
                {!editingSessionId && orderCount > 0 && (
                  <span className="text-xs bg-primary-100 text-primary-700 font-semibold px-2 py-0.5 rounded-full">
                    {orderCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {editingSessionId ? (
                  <>
                    <button
                      onClick={() => {
                        handleExitEditMode();
                        setShowOrderSheet(false);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Exit
                    </button>
                  </>
                ) : (
                  orderCount > 0 && (
                    <button
                      onClick={handleClear}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                  )
                )}
                <button
                  onClick={() => setShowOrderSheet(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ChevronUp className="w-5 h-5 rotate-180" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {editingSessionId ? <EditModeContent /> : <OrderRows />}
            </div>

            <div className="px-4 py-4 border-t border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  ₱{(editingSessionId ? combinedTotal : newItemsTotal).toLocaleString()}
                </span>
              </div>
              {/* Order notes */}
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Add a note (e.g. no spice, extra rice...)"
                rows={2}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg resize-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all text-gray-700 placeholder-gray-400"
              />
              {editingSessionId ? (
                <button
                  onClick={handleUpdateOrder}
                  disabled={processing}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all
                    bg-primary-600 hover:bg-primary-700 active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {processing ? "Updating..." : "Update Order"}
                </button>
              ) : (
                <button
                  onClick={handleProcessSale}
                  disabled={orderCount === 0 || processing}
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all
                    bg-primary-600 hover:bg-primary-700 active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {processing
                    ? "Processing..."
                    : `Process Order · ₱${newItemsTotal.toLocaleString()}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile: Recent Orders Sheet ── */}
      {showRecentSheet && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowRecentSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-900">Today's Orders</span>
              </div>
              <button
                onClick={() => setShowRecentSheet(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronUp className="w-5 h-5 rotate-180" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <RecentSessionsList />
            </div>
          </div>
        </div>
      )}

    </>
  );
}
