import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeft, Edit2, Trash2, Save, X, Filter, Package } from "lucide-react";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "../../config/firebase";
import type { DashboardContextType } from "../Dashboard";
import type { MarketplaceTemplate } from "../../constants/marketplaceTemplates";
import { EmptyState } from "../../components/EmptyState";

type SaleDetail = {
  date: Date | null;
  amountPaid: number;
};

type SellerProduct = MarketplaceTemplate & {
  salesCount: number;
  revenue: number;
  totalSpent: number;
  salePrice?: number;
  saleDetails: SaleDetail[];
};

type EditingProduct = {
  id: string;
  name: string;
  price: number;
};

const SellerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { activeOrg: _activeOrg } = useOutletContext<DashboardContextType>();
  const auth = getAuth(app);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<SellerProduct[]>([]);
  const [currentUser, setCurrentUser] = useState(() => getAuth(app).currentUser);
  const [salesPopup, setSalesPopup] = useState<{ productId: string; top: number; left: number } | null>(null);
  const salesPopupCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSalesPopup = (productId: string, rect: DOMRect) => {
    if (salesPopupCloseTimer.current) {
      clearTimeout(salesPopupCloseTimer.current);
      salesPopupCloseTimer.current = null;
    }
    setSalesPopup({ productId, top: rect.bottom + 8, left: rect.left + rect.width / 2 });
  };

  const scheduleCloseSalesPopup = () => {
    salesPopupCloseTimer.current = setTimeout(() => setSalesPopup(null), 150);
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubAuth();
  }, []);

  // Load seller products
  useEffect(() => {
    if (!currentUser) return;

    const loadProducts = async () => {
      try {
        setLoading(true);
        const db = getFirestore(app);

        // Query marketplace templates created by this user
        const q = query(
          collection(db, "marketplaceTemplates"),
          where("createdBy", "==", currentUser.uid)
        );

        const snap = await getDocs(q);
        const templatesData = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as any));

        // For each template, fetch sales count from transactions
        const productsWithSales = await Promise.all(
          templatesData.map(async (template) => {
            const transactionsQ = query(
              collection(db, "users", currentUser.uid, "transactions"),
              where("templateId", "==", template.id)
            );

            const transactionSnap = await getDocs(transactionsQ);
            const allDocs = transactionSnap.docs.map((doc) => doc.data());

            const getSalePrice = (sale: any) =>
              sale.salePrice ??
              (sale.amount != null ? Math.round(sale.amount / 0.8) : null) ??
              0;

            // Only count actual sales. This subcollection is queried by
            // templateId only, so if the seller ever bought their own
            // template it would also contain a type: "template-purchase"
            // doc with a NEGATIVE amount (written in TemplateMarketplace.tsx)
            // — exclude that, and any other non-positive-price record.
            const sales = allDocs.filter(
              (sale) => sale.type === "sale" && getSalePrice(sale) > 0
            );

            const salesCount = sales.length;
            // Use salePrice (the price locked in at the moment of that specific
            // purchase, written in TemplateMarketplace.tsx) — NOT the template's
            // current price, since price can change after past sales happened.
            // Seller keeps 80%, platform takes 20%, of the price paid at sale time.
            const revenue = sales.reduce((sum, sale) => sum + getSalePrice(sale) * 0.8, 0);
            const totalSpent = sales.reduce((sum, sale) => sum + getSalePrice(sale) * 0.2, 0);

            const saleDetails: SaleDetail[] = sales
              .map((sale) => ({
                date: sale.createdAt?.toDate?.() || null,
                amountPaid: getSalePrice(sale),
              }))
              .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

            return {
              ...template,
              salesCount,
              revenue,
              totalSpent,
              salePrice: template.price,
              saleDetails,
            };
          })
        );

        const sorted = productsWithSales.sort(
          (a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0)
        );

        setProducts(sorted);
        setFilteredProducts(sorted);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [currentUser]);

  const handleEditProduct = (product: SellerProduct) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      price: product.price,
    });
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !currentUser) return;

    try {
      setIsSaving(true);
      const db = getFirestore(app);

      await updateDoc(
        doc(db, "marketplaceTemplates", editingProduct.id),
        {
          name: editingProduct.name.trim(),
          price: Math.max(0, editingProduct.price),
        }
      );

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
              ...p,
              name: editingProduct.name.trim(),
              price: Math.max(0, editingProduct.price),
            }
            : p
        )
      );
      setFilteredProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
              ...p,
              name: editingProduct.name.trim(),
              price: Math.max(0, editingProduct.price),
            }
            : p
        )
      );

      setEditingProduct(null);
    } catch (err) {
      console.error("Failed to save product:", err);
      alert("Failed to save product. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure? This will remove the product from the marketplace.")) {
      return;
    }

    try {
      setDeletingId(productId);
      const db = getFirestore(app);

      await deleteDoc(doc(db, "marketplaceTemplates", productId));

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setFilteredProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert("Failed to delete product. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Calculate totals
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-5 w-5 border-2 border-gray-200 border-t-[#7877C6] rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Back button */}
      <button
        onClick={() => navigate("/dashboard/design")}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition cursor-pointer"
      >
        <ArrowLeft size={13} />
        Back to design
      </button>

      {/* Main layout - Sidebar + Content */}
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full min-w-0">
        {/* ── Left: Shop summary sidebar ── */}
        <div className="w-full lg:w-72 shrink-0">
          {/* Main stats card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">My Shop</h1>
              <p className="text-xs text-gray-500 mt-1">Your marketplace performance</p>
            </div>

            {/* Revenue highlight */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">KES {totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-2">80% of all sales you make</p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Products count */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Products</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{products.length}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Package size={20} className="text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Products table ── */}
        {products.length === 0 ? (
          <div className="flex-1">
            <EmptyState
              icon={Package}
              title="No products yet"
              description="Publish your first design to the marketplace to start earning"
            />
          </div>
        ) : (
          <div className="flex-1 w-full min-w-0 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-4 border-b border-gray-100">
              <Filter size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500">Showing {filteredProducts.length} products</span>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm table-fixed min-w-[640px]">
                <colgroup>
                  <col className="w-[34%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-3 sm:px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Product
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Price
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-center text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Sales
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Earnings
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Fee
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 sm:px-6 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {product.previewUrl && (
                            <img
                              src={product.previewUrl}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate text-xs">{product.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                        <p className="text-gray-900 text-xs">
                          {product.price === 0 ? "Free" : `KES ${product.price.toLocaleString()}`}
                        </p>
                      </td>
                      <td className="px-3 sm:px-6 py-3 text-center whitespace-nowrap">
                        {product.salesCount > 0 ? (
                          <span
                            onMouseEnter={(e) =>
                              openSalesPopup(product.id, e.currentTarget.getBoundingClientRect())
                            }
                            onMouseLeave={scheduleCloseSalesPopup}
                            className="inline-block px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold cursor-default"
                          >
                            {product.salesCount}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 text-right whitespace-nowrap">
                        {product.salesCount > 0 ? (
                          <p className="text-green-600 text-xs font-semibold">
                            +KES {product.revenue.toLocaleString()}
                          </p>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 text-right whitespace-nowrap">
                        {product.salesCount > 0 ? (
                          <p className="text-red-600 text-xs font-semibold">
                            -KES {product.totalSpent.toLocaleString()}
                          </p>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-600 hover:text-[#7877C6]"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={deletingId === product.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition text-gray-600 hover:text-red-600 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Sales transaction popup — fixed positioning so it isn't clipped by
          the table's overflow-x-auto or the panel's overflow-hidden */}
      {salesPopup && (() => {
        const product = filteredProducts.find((p) => p.id === salesPopup.productId);
        if (!product) return null;
        return (
          <div
            style={{
              position: "fixed",
              top: salesPopup.top,
              left: salesPopup.left,
              transform: "translateX(-50%)",
            }}
            onMouseEnter={() => {
              if (salesPopupCloseTimer.current) {
                clearTimeout(salesPopupCloseTimer.current);
                salesPopupCloseTimer.current = null;
              }
            }}
            onMouseLeave={scheduleCloseSalesPopup}
            className="z-50 w-56 max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto
              bg-white border border-gray-100 rounded-xl shadow-lg p-2 text-left"
          >
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-2 pb-1.5">
              Transactions
            </p>
            <div className="space-y-1">
              {product.saleDetails.map((sale, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-gray-50"
                >
                  <span className="text-[11px] text-gray-500">
                    {sale.date
                      ? sale.date.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                      : "Unknown date"}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-900">
                    KES {sale.amountPaid.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Edit modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Edit Product</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7877C6]/20 focus:border-[#7877C6]"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (KES)</label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7877C6]/20 focus:border-[#7877C6]"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You'll earn 80% of the price (KES {Math.round(editingProduct.price * 0.8)})
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7877C6] text-white rounded-xl font-medium hover:bg-[#6665b5] transition disabled:opacity-50"
              >
                <Save size={16} />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;