import { useEffect, useState } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/productService";
import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/Modal";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";
import ImageUploadField from "../components/ImageUploadField";
import { Plus, Tag, Pencil, Trash2, Search, Package, X, LayoutGrid, List } from "lucide-react";
import API from "../api";
import { PRODUCT_CATEGORIES } from "../constants/categories";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Stock counts per product (product._id → total qty)
  const [stockCounts, setStockCounts] = useState({});

  // Add modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addImageUrl, setAddImageUrl] = useState(null);
  const [addCategories, setAddCategories] = useState([]);
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [editError, setEditError] = useState("");
  const [editing, setEditing] = useState(false);

  const { isAdmin } = useAuth();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [prods, inventory] = await Promise.all([
        getProducts(),
        API.get("/inventory").then((r) => r.data),
      ]);
      setProducts(prods);

      // Aggregate stock counts
      const counts = {};
      inventory.forEach((item) => {
        const pid = item.product?._id;
        if (pid) counts[pid] = (counts[pid] || 0) + item.quantity;
      });
      setStockCounts(counts);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Add ---
  const handleOpenAdd = () => {
    setAddName("");
    setAddPrice("");
    setAddImageUrl(null);
    setAddCategories([]);
    setAddError("");
    setIsAddOpen(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError("");
    if (!addName.trim() || addPrice === "") return;
    setAdding(true);
    try {
      await createProduct({ name: addName.trim(), price: Number(addPrice), image_url: addImageUrl || null, categories: addCategories });
      setIsAddOpen(false);
      loadAll();
    } catch (error) {
      setAddError(error.response?.data?.error || "Failed to create product");
    } finally {
      setAdding(false);
    }
  };

  // --- Edit ---
  const handleOpenEdit = (product) => {
    setEditProduct({ ...product, categories: product.categories || [] });
    setEditError("");
    setIsEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditError("");
    if (!editProduct.name?.trim() || editProduct.price === "") return;
    setEditing(true);
    try {
      await updateProduct(editProduct._id, {
        name: editProduct.name.trim(),
        price: Number(editProduct.price),
        image_url: editProduct.image_url || null,
        categories: editProduct.categories || [],
      });
      setIsEditOpen(false);
      loadAll();
    } catch (error) {
      setEditError(error.response?.data?.error || "Failed to update product");
    } finally {
      setEditing(false);
    }
  };

  // --- Delete ---
  const handleDelete = async (product) => {
    const stock = stockCounts[product._id] || 0;
    if (stock > 0) {
      alert(`Cannot delete "${product.name}" — it still has ${stock} units in inventory.`);
      return;
    }
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    setDeletingId(product._id);
    try {
      await deleteProduct(product._id);
      loadAll();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || (p.categories || []).includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Products</h1>
                <p className="text-xs text-gray-500 hidden sm:block">{products.length} products</p>
              </div>
            </div>
            {isAdmin() && (
              <Button variant="success" icon={Plus} onClick={handleOpenAdd}>
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* Search + View Toggle */}
        <div className="sticky top-16 z-10 bg-gray-50 pb-4 mb-2 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
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
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("card")}
                className={`p-2.5 transition-colors ${viewMode === "card" ? "bg-primary-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                title="Card view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2.5 transition-colors ${viewMode === "table" ? "bg-primary-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Category filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">
              {searchTerm ? "No products match your search" : "No products yet"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm ? "Try a different search term" : "Add your first product to get started"}
            </p>
          </div>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
            {filteredProducts.map((product) => {
              const stock = stockCounts[product._id] || 0;
              return (
                <div key={product._id} className="flex flex-col">
                  <Card
                    image={product.image_url}
                    name={product.name}
                    price={product.price}
                  />
                  {(isAdmin() || isAdmin()) && (
                    <div className="flex gap-2 mt-2">
                      {isAdmin() && (
                        <Button
                          variant="primary"
                          size="small"
                          icon={Pencil}
                          onClick={() => handleOpenEdit(product)}
                          fullWidth
                        >
                          Edit
                        </Button>
                      )}
                      {isAdmin() && (
                        <Button
                          variant="danger"
                          size="small"
                          icon={Trash2}
                          onClick={() => handleDelete(product)}
                          loading={deletingId === product._id}
                          disabled={stock > 0}
                          title={stock > 0 ? "Cannot delete while stock exists" : "Delete product"}
                          fullWidth
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Image</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Stock</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Categories</th>
                  {(isAdmin() || isAdmin()) && (
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const stock = stockCounts[product._id] || 0;
                  return (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-gray-700">₱{Number(product.price).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stock > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {stock} units
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(product.categories || []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(product.categories || []).map((val) => {
                              const cat = PRODUCT_CATEGORIES.find((c) => c.value === val);
                              return cat ? (
                                <span key={val} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100">
                                  {cat.label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      {(isAdmin() || isAdmin()) && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            {isAdmin() && (
                              <Button
                                variant="primary"
                                size="small"
                                icon={Pencil}
                                onClick={() => handleOpenEdit(product)}
                              >
                                Edit
                              </Button>
                            )}
                            {isAdmin() && (
                              <Button
                                variant="danger"
                                size="small"
                                icon={Trash2}
                                onClick={() => handleDelete(product)}
                                loading={deletingId === product._id}
                                disabled={stock > 0}
                                title={stock > 0 ? "Cannot delete while stock exists" : "Delete product"}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Product">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Product Name"
            type="text"
            placeholder="e.g., Pork Humba"
            value={addName}
            onChange={(e) => { setAddName(e.target.value); setAddError(""); }}
            required
          />
          <Input
            label="Price (₱)"
            type="number"
            placeholder="0.00"
            value={addPrice}
            onChange={(e) => { setAddPrice(e.target.value); setAddError(""); }}
            required
            min="0"
            step="0.01"
          />
          <ImageUploadField
            currentUrl={null}
            onUrlChange={(url) => { setAddImageUrl(url); setAddError(""); }}
          />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Categories (optional)</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {PRODUCT_CATEGORIES.map((cat) => (
                <label key={cat.value} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={addCategories.includes(cat.value)}
                    onChange={(e) => {
                      setAddCategories((prev) =>
                        e.target.checked ? [...prev, cat.value] : prev.filter((v) => v !== cat.value)
                      );
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  {cat.label}
                </label>
              ))}
            </div>
          </div>
          {addError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {addError}
            </p>
          )}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} fullWidth>
              Cancel
            </Button>
            <Button type="submit" variant="success" loading={adding} fullWidth icon={Plus}>
              Add Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Product">
        {editProduct && (
          <form onSubmit={handleEdit} className="space-y-4">
            <Input
              label="Product Name"
              type="text"
              value={editProduct.name}
              onChange={(e) => { setEditProduct({ ...editProduct, name: e.target.value }); setEditError(""); }}
              required
            />
            <Input
              label="Price (₱)"
              type="number"
              value={editProduct.price}
              onChange={(e) => { setEditProduct({ ...editProduct, price: e.target.value }); setEditError(""); }}
              required
              min="0"
              step="0.01"
            />
            <ImageUploadField
              currentUrl={editProduct.image_url || null}
              onUrlChange={(url) => { setEditProduct({ ...editProduct, image_url: url }); setEditError(""); }}
            />
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Categories (optional)</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <label key={cat.value} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={(editProduct.categories || []).includes(cat.value)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...(editProduct.categories || []), cat.value]
                          : (editProduct.categories || []).filter((v) => v !== cat.value);
                        setEditProduct({ ...editProduct, categories: next });
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    {cat.label}
                  </label>
                ))}
              </div>
            </div>
            {editError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {editError}
              </p>
            )}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} fullWidth>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={editing} fullWidth icon={Pencil}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
