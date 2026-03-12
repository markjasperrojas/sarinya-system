import { useEffect, useState } from "react";
import {
  getInventoryItems,
  getPullOuts,
  addInventoryItem,
  sellInventoryItem,
  updateInventoryItem,
  pullOutInventoryItem,
} from "../services/inventoryService";
import API from "../api";
import { useLocation } from "react-router-dom";
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
  ShoppingCart,
  Pencil,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  PackageMinus,
  ArrowLeftRight,
  TriangleAlert,
} from "lucide-react";

const LOW_STOCK_THRESHOLD = 5;

const PULL_OUT_REASONS = [
  { value: "near_expiry", label: "Near Expiry" },
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [deletingId, setDeletingId] = useState(null);

  // Discrepancies state
  const [pullOuts, setPullOuts] = useState([]);
  const [pullOutsLoading, setPullOutsLoading] = useState(false);
  const [discrepancySearch, setDiscrepancySearch] = useState("");

  // Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sell modal state
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sellQuantity, setSellQuantity] = useState("");
  const [selling, setSelling] = useState(false);

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
  const location = useLocation();

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (activeTab === "discrepancies" && pullOuts.length === 0) {
      loadPullOuts();
    }
  }, [activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sort = params.get("sort");
    const dir = params.get("dir");
    if (sort && ["name", "quantity", "price", "expirationDate"].includes(sort)) {
      setSortConfig({ key: sort, direction: dir === "desc" ? "desc" : "asc" });
    }
  }, [location.search]);

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
    if (!name || !quantity || !price || !expirationDate) return;
    setSubmitting(true);
    try {
      await addInventoryItem({ name, quantity, price, expirationDate });
      setName(""); setQuantity(""); setPrice(""); setExpirationDate("");
      setIsModalOpen(false);
      loadItems();
    } catch (error) {
      console.error("Add item failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setName(""); setQuantity(""); setPrice(""); setExpirationDate("");
  };

  // --- Delete ---
  const handleDeleteInventory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
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

  // --- Sell ---
  const handleOpenSellModal = (item) => {
    setSelectedItem(item);
    setSellQuantity("");
    setIsSellModalOpen(true);
  };

  const handleCloseSellModal = () => {
    setIsSellModalOpen(false);
    setSelectedItem(null);
    setSellQuantity("");
  };

  const handleSellItem = async (e) => {
    e.preventDefault();
    if (!sellQuantity || Number(sellQuantity) <= 0) return;
    setSelling(true);
    try {
      await sellInventoryItem(selectedItem._id, Number(sellQuantity));
      handleCloseSellModal();
      loadItems();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to sell item");
    } finally {
      setSelling(false);
    }
  };

  const sellPreviewTotal = selectedItem
    ? Number(sellQuantity || 0) * selectedItem.price
    : 0;

  // --- Edit ---
  const handleOpenEditModal = (item) => {
    setEditItem({
      ...item,
      expirationDate: item.expirationDate
        ? new Date(item.expirationDate).toISOString().split("T")[0]
        : "",
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditItem(null);
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    if (!editItem.name || !editItem.quantity || !editItem.price || !editItem.expirationDate) return;
    setEditing(true);
    try {
      await updateInventoryItem(editItem._id, {
        name: editItem.name,
        quantity: Number(editItem.quantity),
        price: Number(editItem.price),
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
      // Refresh pull-outs if discrepancies tab was already loaded
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

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-gray-400" />;
    return sortConfig.direction === "asc"
      ? <ChevronUp className="w-3.5 h-3.5 ml-1 text-primary-500" />
      : <ChevronDown className="w-3.5 h-3.5 ml-1 text-primary-500" />;
  };

  const filteredItems = [...items]
    .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === "expirationDate") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const filteredPullOuts = pullOuts.filter((p) =>
    p.itemName.toLowerCase().includes(discrepancySearch.toLowerCase())
  );

  const isPullOutFormValid =
    pullOutQuantity &&
    Number(pullOutQuantity) > 0 &&
    Number(pullOutQuantity) <= (pullOutItem?.quantity || 0) &&
    (!addReplacement || (replacementQuantity && replacementExpirationDate));

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
                <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {items.length} active items
                </p>
              </div>
            </div>

            {activeTab === "stock" && hasPermission("inventory", "add") && (
              <Button
                variant="success"
                icon={Plus}
                onClick={() => setIsModalOpen(true)}
              >
                <span className="hidden sm:inline">Add Item</span>
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
              activeTab === "stock"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Package className="w-4 h-4" />
            Active Stock
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              activeTab === "stock" ? "bg-primary-100 text-primary-700" : "bg-gray-200 text-gray-600"
            }`}>
              {items.length}
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
            Discrepancies
            {pullOuts.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === "discrepancies" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-600"
              }`}>
                {pullOuts.length}
              </span>
            )}
          </button>
        </div>

        {/* ── ACTIVE STOCK TAB ── */}
        {activeTab === "stock" && (
          <>
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="card overflow-hidden animate-fade-in">
              {loading ? (
                <div className="p-6">
                  <TableSkeleton rows={5} columns={5} />
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th onClick={() => handleSort("name")} className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100">
                          <span className="flex items-center">Item Name <SortIcon col="name" /></span>
                        </th>
                        <th onClick={() => handleSort("quantity")} className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100">
                          <span className="flex items-center">Quantity <SortIcon col="quantity" /></span>
                        </th>
                        <th onClick={() => handleSort("price")} className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100">
                          <span className="flex items-center">Price <SortIcon col="price" /></span>
                        </th>
                        <th onClick={() => handleSort("expirationDate")} className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100">
                          <span className="flex items-center">Expiration Date <SortIcon col="expirationDate" /></span>
                        </th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredItems.map((item) => {
                        const isLowStock = Number(item.quantity) <= LOW_STOCK_THRESHOLD;
                        return (
                          <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${isLowStock ? "bg-warning-500" : "bg-success-500"}`} />
                                <span className="font-medium text-gray-900">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                                isLowStock ? "bg-warning-100 text-warning-800" : "bg-success-100 text-success-800"
                              }`}>
                                {item.quantity}
                                {isLowStock && <AlertCircle className="w-3 h-3 ml-1" />}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              ₱{item.price?.toLocaleString() || 0}
                            </td>
                            <td className="px-6 py-4">
                              {(() => {
                                const status = getExpirationStatus(item.expirationDate);
                                const statusStyles = {
                                  expired: "bg-red-100 text-red-800",
                                  warning: "bg-yellow-100 text-yellow-800",
                                  normal: "bg-green-100 text-green-800",
                                };
                                const statusLabels = {
                                  expired: "Expired",
                                  warning: "Expiring Soon",
                                  normal: "",
                                };
                                return (
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${statusStyles[status]}`}>
                                    {formatDate(item.expirationDate)}
                                    {statusLabels[status] && (
                                      <span className="ml-1 text-xs">({statusLabels[status]})</span>
                                    )}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2 flex-wrap">
                                {hasPermission("sales", "add") && (
                                  <Button
                                    variant="success"
                                    size="small"
                                    icon={ShoppingCart}
                                    onClick={() => handleOpenSellModal(item)}
                                    disabled={item.quantity === 0}
                                  >
                                    Sell
                                  </Button>
                                )}
                                {hasPermission("inventory", "edit") && (
                                  <>
                                    <Button
                                      variant="primary"
                                      size="small"
                                      icon={Pencil}
                                      onClick={() => handleOpenEditModal(item)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="warning"
                                      size="small"
                                      icon={PackageMinus}
                                      onClick={() => handleOpenPullOutModal(item)}
                                      disabled={item.quantity === 0}
                                    >
                                      Pull Out
                                    </Button>
                                  </>
                                )}
                                {hasPermission("inventory", "delete") && (
                                  <Button
                                    variant="danger"
                                    size="small"
                                    icon={Trash2}
                                    onClick={() => handleDeleteInventory(item._id)}
                                    loading={deletingId === item._id}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredItems.length === 0 && !loading && (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">
                              {searchTerm ? "No items match your search" : "No inventory items yet"}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                              {searchTerm ? "Try a different search term" : "Add your first item to get started"}
                            </p>
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

        {/* ── DISCREPANCIES TAB ── */}
        {activeTab === "discrepancies" && (
          <>
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search discrepancies..."
                  value={discrepancySearch}
                  onChange={(e) => setDiscrepancySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
                />
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
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Qty Pulled</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Pulled By</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Replacement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPullOuts.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-red-400" />
                              <span className="font-medium text-gray-900">{record.itemName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              {record.quantityPulledOut}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium capitalize ${
                              REASON_STYLES[record.reason] || "bg-gray-100 text-gray-700"
                            }`}>
                              {record.reason.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {record.pulledOutBy?.username || "—"}
                          </td>
                          <td className="px-6 py-4">
                            {record.replacedByItemId ? (
                              <div className="flex items-center gap-1.5 text-sm text-success-700">
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                <span className="font-medium">{record.replacedByItemId.name}</span>
                                <span className="text-gray-500">
                                  (×{record.replacedByItemId.quantity}, exp. {formatDate(record.replacedByItemId.expirationDate)})
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
                              {discrepancySearch ? "No records match your search" : "No discrepancies recorded"}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                              Pull-out records will appear here
                            </p>
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
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add New Item">
        <form onSubmit={handleAddItem} className="space-y-4">
          <Input label="Item Name" type="text" placeholder="Enter item name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Quantity" type="number" placeholder="Enter quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="0" />
          <Input label="Price (₱)" type="number" placeholder="Enter price" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" step="0.01" />
          <Input label="Expiration Date" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} required />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal} fullWidth>Cancel</Button>
            <Button type="submit" variant="success" loading={submitting} fullWidth icon={Plus}>Add Item</Button>
          </div>
        </form>
      </Modal>

      {/* ── SELL ITEM MODAL ── */}
      <Modal isOpen={isSellModalOpen} onClose={handleCloseSellModal} title="Sell Item">
        {selectedItem && (
          <form onSubmit={handleSellItem} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{selectedItem.name}</p>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Available: {selectedItem.quantity}</span>
                <span>Price: ₱{selectedItem.price?.toLocaleString()}</span>
              </div>
            </div>
            <Input label="Quantity to Sell" type="number" placeholder="Enter quantity" value={sellQuantity} onChange={(e) => setSellQuantity(e.target.value)} required min="1" max={selectedItem.quantity} />
            {sellQuantity && Number(sellQuantity) > 0 && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-success-700">Total:</span>
                  <span className="text-xl font-bold text-success-700">₱{sellPreviewTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
            {sellQuantity && Number(sellQuantity) > selectedItem.quantity && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                Cannot sell more than available quantity
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseSellModal} fullWidth>Cancel</Button>
              <Button type="submit" variant="success" loading={selling} fullWidth icon={ShoppingCart} disabled={!sellQuantity || Number(sellQuantity) <= 0 || Number(sellQuantity) > selectedItem.quantity}>
                Confirm Sale
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── EDIT ITEM MODAL ── */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Item">
        {editItem && (
          <form onSubmit={handleEditItem} className="space-y-4">
            <Input label="Item Name" type="text" placeholder="Enter item name" value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} required />
            <Input label="Quantity" type="number" placeholder="Enter quantity" value={editItem.quantity} onChange={(e) => setEditItem({ ...editItem, quantity: e.target.value })} required min="0" />
            <Input label="Price (₱)" type="number" placeholder="Enter price" value={editItem.price} onChange={(e) => setEditItem({ ...editItem, price: e.target.value })} required min="0" step="0.01" />
            <Input label="Expiration Date" type="date" value={editItem.expirationDate} onChange={(e) => setEditItem({ ...editItem, expirationDate: e.target.value })} required />
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseEditModal} fullWidth>Cancel</Button>
              <Button type="submit" variant="primary" loading={editing} fullWidth icon={Pencil}>Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── PULL OUT MODAL ── */}
      <Modal isOpen={isPullOutModalOpen} onClose={handleClosePullOutModal} title="Pull Out Item">
        {pullOutItem && (
          <form onSubmit={handlePullOut} className="space-y-4">
            {/* Item info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{pullOutItem.name}</p>
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
                  <option key={r.value} value={r.value}>{r.label}</option>
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
                  <p className="text-xs text-gray-500 mt-0.5">Create a new entry with a fresh expiration date</p>
                </div>
              </label>

              {addReplacement && (
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                  {/* Pre-filled read-only info */}
                  <div className="bg-primary-50 rounded-lg px-3 py-2 text-sm text-primary-700">
                    Name & price will be copied from <strong>{pullOutItem.name}</strong> (₱{pullOutItem.price?.toLocaleString()})
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
              <Button type="button" variant="outline" onClick={handleClosePullOutModal} fullWidth>Cancel</Button>
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
