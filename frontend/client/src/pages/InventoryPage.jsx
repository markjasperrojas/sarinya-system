import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getInventoryItems,
  getPullOuts,
  addInventoryItem,
  updateInventoryItem,
  pullOutInventoryItem,
} from "../services/inventoryService";
import { getProducts, createProduct } from "../services/productService";
import API from "../api";
import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/Modal";
import Button from "../components/Button";
import Input from "../components/Input";
import TableSkeleton from "../components/TableSkeleton";
import {
  Plus,
  Trash2,
  Package,
  AlertCircle,
  Search,
  Pencil,
  PackageMinus,
  ArrowLeftRight,
  TriangleAlert,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";

const LOW_STOCK_THRESHOLD = 5;

const PULL_OUT_REASONS = [
  { value: "near_expiry", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
  { value: "damaged", label: "Damaged" },
  { value: "spoiled", label: "Spoiled" },
  { value: "other", label: "Other" },
];

const REASON_STYLES = {
  near_expiry: "bg-yellow-100 text-yellow-800",
  expired: "bg-red-100 text-red-800",
  damaged: "bg-orange-100 text-orange-800",
  spoiled: "bg-red-100 text-red-800",
  other: "bg-gray-100 text-gray-700",
};

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("stock");

  // Stock state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const [sortConfig, setSortConfig] = useState(() => {
    const key = searchParams.get("sort");
    const dir = searchParams.get("dir");
    if (key && dir) return { key, direction: dir };
    return { key: "name", direction: "asc" };
  });
  const [deletingId, setDeletingId] = useState(null);

  // Discrepancies state
  const [pullOuts, setPullOuts] = useState([]);
  const [pullOutsLoading, setPullOutsLoading] = useState(false);
  const [discrepancySearch, setDiscrepancySearch] = useState("");

  // Products state (shared across modals)
  const [products, setProducts] = useState([]);

  // Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editing, setEditing] = useState(false);

  // Pull Out modal state
  const [isPullOutModalOpen, setIsPullOutModalOpen] = useState(false);
  const [pullOutItem, setPullOutItem] = useState(null);
  const [pullOutQuantity, setPullOutQuantity] = useState("");
  const [pullOutReason, setPullOutReason] = useState("near_expiry");
  const [addReplacement, setAddReplacement] = useState(false);
  const [replacementQuantity, setReplacementQuantity] = useState("");
  const [replacementExpirationDate, setReplacementExpirationDate] = useState("");
  const [pullingOut, setPullingOut] = useState(false);

  const { hasPermission } = useAuth();

  useEffect(() => {
    loadItems();
    loadProducts();
  }, []);

  useEffect(() => {
    if (activeTab === "discrepancies" && pullOuts.length === 0) {
      loadPullOuts();
    }
  }, [activeTab, pullOuts.length]);

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

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const loadPullOuts = async () => {
    setPullOutsLoading(true);
    try {
      const data = await getPullOuts();
      setPullOuts(data);
    } catch (error) {
      console.error("Failed to load pull outs:", error);
    } finally {
      setPullOutsLoading(false);
    }
  };

  // --- Add Item ---
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !quantity || !expirationDate) return;
    setSubmitting(true);
    try {
      await addInventoryItem({ productId: selectedProductId, quantity, expirationDate });
      setSelectedProductId("");
      setQuantity("");
      setExpirationDate("");
      setIsModalOpen(false);
      loadItems();
      loadProducts();
    } catch (error) {
      console.error("Add item failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProductId("");
    setQuantity("");
    setExpirationDate("");
  };

  // --- Delete ---
  const handleDeleteInventory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this stock entry?")) return;
    setDeletingId(id);
    try {
      await API.delete(`/inventory/${id}`);
      loadItems();
    } catch (error) {
      alert("Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  };

  // --- Edit ---
  const handleOpenEditModal = (item) => {
    setEditItem({
      ...item,
      expirationDate: item.expirationDate ? new Date(item.expirationDate).toISOString().split("T")[0] : "",
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditItem(null);
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    if (!editItem.quantity || !editItem.expirationDate) return;
    setEditing(true);
    try {
      await updateInventoryItem(editItem._id, {
        quantity: Number(editItem.quantity),
        expirationDate: editItem.expirationDate,
      });
      handleCloseEditModal();
      loadItems();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to update item");
    } finally {
      setEditing(false);
    }
  };

  // --- Pull Out ---
  const handleOpenPullOutModal = (item) => {
    setPullOutItem(item);
    setPullOutQuantity(String(item.quantity));
    setPullOutReason("near_expiry");
    setAddReplacement(false);
    setReplacementQuantity("");
    setReplacementExpirationDate("");
    setIsPullOutModalOpen(true);
  };

  const handleClosePullOutModal = () => {
    setIsPullOutModalOpen(false);
    setPullOutItem(null);
    setPullOutQuantity("");
    setPullOutReason("near_expiry");
    setAddReplacement(false);
    setReplacementQuantity("");
    setReplacementExpirationDate("");
  };

  const handlePullOut = async (e) => {
    e.preventDefault();
    if (!pullOutQuantity || Number(pullOutQuantity) <= 0) return;
    if (addReplacement && (!replacementQuantity || !replacementExpirationDate)) return;

    setPullingOut(true);
    try {
      await pullOutInventoryItem(pullOutItem._id, {
        quantityPulledOut: Number(pullOutQuantity),
        reason: pullOutReason,
        addReplacement,
        replacementQuantity: addReplacement ? Number(replacementQuantity) : undefined,
        replacementExpirationDate: addReplacement ? replacementExpirationDate : undefined,
      });
      handleClosePullOutModal();
      loadItems();
      if (pullOuts.length > 0) loadPullOuts();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to pull out item");
    } finally {
      setPullingOut(false);
    }
  };

  // --- Helpers ---
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getExpirationStatus = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(dateString);
    expDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "expired";
    if (diffDays <= 7) return "warning";
    return "normal";
  };

  const getDaysLabel = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(dateString);
    expDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Today";
    if (diffDays <= 7) return `${diffDays}d left`;
    return null;
  };

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-gray-400" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 ml-1 text-primary-500" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 ml-1 text-primary-500" />
    );
  };

  // Group items by product — filter empty batches, sort groups, sort batches by expiry asc
  // Returns a flat list of rows: { item, product, isFirst, isLast }
  const flatRows = useMemo(() => {
    const filtered = items.filter(
      (item) =>
        item.quantity > 0 &&
        item.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups = {};
    filtered.forEach((item) => {
      const pid = item.product?._id;
      if (!pid) return;
      if (!groups[pid]) groups[pid] = { product: item.product, batches: [] };
      groups[pid].batches.push(item);
    });

    // Sort batches within each group by expiry ascending
    Object.values(groups).forEach((g) => {
      g.batches.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
    });

    // Sort groups
    const sortedGroups = Object.values(groups).sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === "price") {
        aVal = a.product.price; bVal = b.product.price;
      } else if (sortConfig.key === "quantity") {
        aVal = Math.min(...a.batches.map((i) => i.quantity));
        bVal = Math.min(...b.batches.map((i) => i.quantity));
      } else if (sortConfig.key === "expirationDate") {
        aVal = new Date(a.batches[0].expirationDate);
        bVal = new Date(b.batches[0].expirationDate);
      } else {
        aVal = a.product.name; bVal = b.product.name;
      }
      if (typeof aVal === "string") {
        return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });

    return sortedGroups.flatMap(({ product, batches }) => {
      const minBatchQty = Math.min(...batches.map((i) => i.quantity));
      return batches.map((item, idx) => ({
        item,
        product,
        minBatchQty,
        isFirst: idx === 0,
        isLast: idx === batches.length - 1,
      }));
    });
  }, [items, searchTerm, sortConfig]);

  const filteredPullOuts = pullOuts.filter((p) =>
    p.product?.name?.toLowerCase().includes(discrepancySearch.toLowerCase())
  );

  const isPullOutFormValid =
    pullOutQuantity &&
    Number(pullOutQuantity) > 0 &&
    Number(pullOutQuantity) <= (pullOutItem?.quantity || 0) &&
    (!addReplacement || (replacementQuantity && replacementExpirationDate));

  const selectedProduct = products.find((p) => p._id === selectedProductId);

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Stocks</h1>
                <p className="text-xs text-gray-500 hidden sm:block">{items.filter(i => i.quantity > 0).length} active stock entries</p>
              </div>
            </div>

            {activeTab === "stock" && hasPermission("inventory", "add") && (
              <Button variant="success" icon={Plus} onClick={() => setIsModalOpen(true)}>
                <span className="hidden sm:inline">Add Stock</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("stock")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "stock" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Package className="w-4 h-4" />
            Active Stock
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === "stock" ? "bg-primary-100 text-primary-700" : "bg-gray-200 text-gray-600"
              }`}
            >
              {items.filter(i => i.quantity > 0).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("discrepancies")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "discrepancies"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <TriangleAlert className="w-4 h-4" />
            Pull Outs
          </button>
        </div>

        {/* ── ACTIVE STOCK TAB ── */}
        {activeTab === "stock" && (
          <>
            <div className="sticky top-16 z-10 bg-gray-50 pb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

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
                        <th
                          onClick={() => handleSort("name")}
                          className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                        >
                          <span className="flex items-center">Product <SortIcon col="name" /></span>
                        </th>
                        <th
                          onClick={() => handleSort("quantity")}
                          className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                        >
                          <span className="flex items-center">Quantity <SortIcon col="quantity" /></span>
                        </th>
                        <th
                          onClick={() => handleSort("expirationDate")}
                          className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                        >
                          <span className="flex items-center">Expiration Date <SortIcon col="expirationDate" /></span>
                        </th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {flatRows.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">
                              {searchTerm ? "No stock matches your search" : "No stock entries yet"}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                              {searchTerm ? "Try a different search term" : "Add your first stock entry to get started"}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        flatRows.map(({ item, product, minBatchQty, isFirst }) => {
                          const isLowStock = Number(item.quantity) <= LOW_STOCK_THRESHOLD;
                          const expStatus = getExpirationStatus(item.expirationDate);
                          const daysLabel = getDaysLabel(item.expirationDate);
                          const expStyles = {
                            expired: "bg-red-100 text-red-800",
                            warning: "bg-yellow-100 text-yellow-800",
                            normal: "bg-green-100 text-green-800",
                          };

                          return (
                            <tr
                              key={item._id}
                              className={`hover:bg-gray-50 transition-colors ${isFirst ? "border-t-2 border-gray-200" : ""}`}
                            >
                              {/* Name — only on first batch of each product */}
                              <td className="px-6 py-4">
                                {isFirst ? (
                                  <span className="font-medium text-gray-900">{product.name}</span>
                                ) : (
                                  <span className="pl-3 text-gray-300 text-sm select-none">└</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                                    isLowStock ? "bg-warning-100 text-warning-800" : "bg-success-100 text-success-800"
                                  }`}
                                >
                                  {item.quantity}
                                  {isLowStock && <AlertCircle className="w-3 h-3 ml-1" />}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium ${expStyles[expStatus]}`}>
                                  {formatDate(item.expirationDate)}
                                  {daysLabel && <span className="text-xs opacity-75">({daysLabel})</span>}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                  {hasPermission("inventory", "edit") && (
                                    <>
                                      <Button variant="primary" size="small" icon={Pencil}
                                        onClick={() => handleOpenEditModal(item)}>
                                        Edit
                                      </Button>
                                      <Button variant="warning" size="small" icon={PackageMinus}
                                        onClick={() => handleOpenPullOutModal(item)}>
                                        Pull Out
                                      </Button>
                                    </>
                                  )}
                                  {hasPermission("inventory", "delete") && (
                                    <Button variant="danger" size="small" icon={Trash2}
                                      onClick={() => handleDeleteInventory(item._id)}
                                      loading={deletingId === item._id}>
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── DISCREPANCIES TAB ── */}
        {activeTab === "discrepancies" && (
          <>
            <div className="sticky top-16 z-10 bg-gray-50 pb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search pull outs..."
                  value={discrepancySearch}
                  onChange={(e) => setDiscrepancySearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
                />
                {discrepancySearch && (
                  <button onClick={() => setDiscrepancySearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="card overflow-hidden animate-fade-in">
              {pullOutsLoading ? (
                <div className="p-6">
                  <TableSkeleton rows={5} columns={6} />
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Qty Pulled Out
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Pulled By
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Replacement
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPullOuts.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-red-400" />
                              <span className="font-medium text-gray-900">{record.product?.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              {record.quantityPulledOut}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium capitalize ${
                                REASON_STYLES[record.reason] || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {record.reason.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(record.date)}</td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {record.pulledOutBy?.username || "—"}
                          </td>
                          <td className="px-6 py-4">
                            {record.replacedByItemId ? (
                              <div className="flex items-center gap-1.5 text-sm text-success-700">
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                <span className="font-medium">
                                  {record.replacedByItemId.product?.name}
                                </span>
                                <span className="text-gray-500">
                                  (×{record.replacedByItemId.quantity}, exp.{" "}
                                  {formatDate(record.replacedByItemId.expirationDate)})
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No replacement</span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {filteredPullOuts.length === 0 && !pullOutsLoading && (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <TriangleAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">
                              {discrepancySearch
                                ? "No records match your search"
                                : "No pull outs recorded"}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">Pull-out records will appear here</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── ADD ITEM MODAL ── */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add Stock">
        <form onSubmit={handleAddItem} className="space-y-4">
          {/* Product selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all bg-white text-gray-900"
              required
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — ₱{p.price?.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Price hint */}
          {selectedProduct && (
            <div className="bg-primary-50 border border-primary-100 rounded-lg px-3 py-2 text-sm text-primary-700">
              Price: <strong>₱{selectedProduct.price?.toLocaleString()}</strong> — to change price, go to the Products page
            </div>
          )}

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
            label="Expiration Date"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            required
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal} fullWidth>
              Cancel
            </Button>
            <Button type="submit" variant="success" loading={submitting} fullWidth icon={Plus}>
              Add Stock
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── EDIT ITEM MODAL ── */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Stock">
        {editItem && (
          <form onSubmit={handleEditItem} className="space-y-4">
            {/* Read-only product info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Product</p>
              <p className="font-medium text-gray-900">{editItem.product?.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                Price: <span className="text-primary-600 font-medium">₱{editItem.product?.price?.toLocaleString()}</span>
                <span className="ml-2 text-xs text-gray-400">(edit in Products page)</span>
              </p>
            </div>
            <Input
              label="Quantity"
              type="number"
              placeholder="Enter quantity"
              value={editItem.quantity}
              onChange={(e) => setEditItem({ ...editItem, quantity: e.target.value })}
              required
              min="0"
            />
            <Input
              label="Expiration Date"
              type="date"
              value={editItem.expirationDate}
              onChange={(e) => setEditItem({ ...editItem, expirationDate: e.target.value })}
              required
            />
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseEditModal} fullWidth>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={editing} fullWidth icon={Pencil}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── PULL OUT MODAL ── */}
      <Modal isOpen={isPullOutModalOpen} onClose={handleClosePullOutModal} title="Pull Out Stock">
        {pullOutItem && (
          <form onSubmit={handlePullOut} className="space-y-4">
            {/* Item info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{pullOutItem.product?.name}</p>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Current stock: {pullOutItem.quantity}</span>
                <span>Expires: {formatDate(pullOutItem.expirationDate)}</span>
              </div>
            </div>

            <Input
              label="Quantity to Pull Out"
              type="number"
              placeholder="Enter quantity"
              value={pullOutQuantity}
              onChange={(e) => setPullOutQuantity(e.target.value)}
              required
              min="1"
              max={pullOutItem.quantity}
            />

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason</label>
              <select
                value={pullOutReason}
                onChange={(e) => setPullOutReason(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all bg-white text-gray-900"
              >
                {PULL_OUT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Replacement toggle */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addReplacement}
                  onChange={(e) => setAddReplacement(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Add replacement stock</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Create a new stock entry with a fresh expiration date
                  </p>
                </div>
              </label>

              {addReplacement && (
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                  <div className="bg-primary-50 rounded-lg px-3 py-2 text-sm text-primary-700">
                    Replacement stock will use <strong>{pullOutItem.product?.name}</strong> at ₱{pullOutItem.product?.price?.toLocaleString()}
                  </div>
                  <Input
                    label="New Quantity"
                    type="number"
                    placeholder="Enter new quantity"
                    value={replacementQuantity}
                    onChange={(e) => setReplacementQuantity(e.target.value)}
                    required={addReplacement}
                    min="1"
                  />
                  <Input
                    label="New Expiration Date"
                    type="date"
                    value={replacementExpirationDate}
                    onChange={(e) => setReplacementExpirationDate(e.target.value)}
                    required={addReplacement}
                  />
                </div>
              )}
            </div>

            {pullOutQuantity && Number(pullOutQuantity) > pullOutItem.quantity && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                Cannot pull out more than available quantity
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClosePullOutModal} fullWidth>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="warning"
                loading={pullingOut}
                fullWidth
                icon={PackageMinus}
                disabled={!isPullOutFormValid}
              >
                Confirm Pull Out
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
