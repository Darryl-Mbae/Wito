import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Search, ArrowLeft, ShoppingBag, Package } from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  arrayUnion,
  increment,
  getDocs,
  query,
  orderBy,
  runTransaction,

} from "firebase/firestore";

import { getAuth } from "firebase/auth";
import app from "../../config/firebase";
import type { DashboardContextType } from "../Dashboard";
import { MARKETPLACE_CATEGORIES } from "../../constants/marketplaceTemplates";
import type { MarketplaceTemplate } from "../../constants/marketplaceTemplates";

// ─── Market Card ──────────────────────────────────────────────────────────

interface MarketCardProps {
  item: MarketplaceTemplate;
  isPurchased: boolean;
  isBuying: boolean;
  onBuy: (item: MarketplaceTemplate) => void;
}

const MarketCard: React.FC<MarketCardProps> = ({ item, isPurchased, isBuying, onBuy }) => {
  const [hovered, setHovered] = useState(false);

  // Determine aspect ratio based on category
  const aspectRatio =
    item.category === "story" ? 1080 / 1920 :
      item.category === "flyer" ? 1080 / 1080 :
        1080 / 1350; // post default

  console.log(item)

  return (
    <div
      className="rounded-2xl border border-gray-100 overflow-hidden bg-white cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Preview - full aspect ratio */}
      <div
        className="relative w-full bg-gradient-to-br from-[#7877C6] to-[#a5a4e0] overflow-hidden"
        style={{ aspectRatio }}
      >
        {item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/40 text-[10px] font-medium tracking-widest uppercase">
              No preview
            </span>
          </div>
        )}

        {/* Price badge - top right */}
        <div className="absolute top-2.5 right-2.5 bg-[#7877C6] text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 z-10">
          {item.price === 0 ? "Free" : `KES ${item.price}`}
        </div>

        {/* Hover overlay - full coverage */}
        <div className={`absolute inset-0 bg-[#141228]/55 flex flex-col justify-end p-2.5 transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              !isBuying && onBuy(item);
            }}
            disabled={isBuying}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-medium transition cursor-pointer
    ${isBuying
                ? "bg-[#7877C6]/50 animate-pulse"
                : isPurchased
                  ? "bg-gray-500 hover:bg-gray-600"
                  : "bg-[#7877C6] hover:bg-[#6665b5]"
              }`}
          >
            <ShoppingBag size={12} />
            {isBuying ? (isPurchased ? "Restoring..." : "Buying...") : isPurchased ? "Restore" : "Buy Flyer"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── TemplateMarketplace ──────────────────────────────────────────────────

const TemplateMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const { activeOrg } = useOutletContext<DashboardContextType>();
  const orgId = activeOrg?.id;

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | "post" | "story" | "flyer">("all");
  const [marketplaceTemplates, setMarketplaceTemplates] = useState<MarketplaceTemplate[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // ── Load marketplace templates from Firebase ────────────────────────────────
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const db = getFirestore(app);
        const snap = await getDocs(
          query(collection(db, "marketplaceTemplates"), orderBy("createdAt", "desc"))
        );
        setMarketplaceTemplates(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          } as MarketplaceTemplate))
        );
      } catch (err) {
        console.error("Failed to load marketplace templates:", err);
      }
    };
    loadTemplates();
  }, []);

  // ── Load purchased IDs ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!orgId) return;
    getDoc(doc(getFirestore(app), "organizations", orgId)).then((snap) => {
      if (snap.exists()) {
        setPurchasedIds(snap.data().purchasedMarketplaceIds ?? []);
      }
      setLoading(false);
    });
  }, [orgId]);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return marketplaceTemplates.filter((t) => {
      const matchCat = category === "all" || t.category === category;
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [search, category, marketplaceTemplates]);

  // ── Purchase / get template ─────────────────────────────────────────────────
  const handleGetTemplate = async (item: MarketplaceTemplate) => {
    if (!orgId) return;
    setBuyingId(item.id);
    try {
      const db = getFirestore(app);
      const auth = getAuth(app);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const templateData = (item as any).templateData || {
        htmlCode: (item as any).htmlCode,
        jsonData: (item as any).jsonData,
        variables: item.variables || [],
      };

      const userRef = doc(db, "users", currentUser.uid);
      const orgRef = doc(db, "organizations", orgId);
      // Pre-generate a ref for the copied template so we can .set() it inside the transaction
      const newTemplateRef = doc(collection(db, "organizations", orgId, "templates"));

      // ── Atomic core: credit check, deduction, ownership flag, template copy ──
      const { alreadyOwned } = await runTransaction(db, async (tx) => {
        const orgSnap = await tx.get(orgRef);
        if (!orgSnap.exists()) throw new Error("Organization not found");

        const currentPurchased: string[] = orgSnap.data().purchasedMarketplaceIds ?? [];
        const alreadyOwned = currentPurchased.includes(item.id);

        let userSnap = null;
        if (!alreadyOwned && item.price > 0) {
          userSnap = await tx.get(userRef);
          const currentCredits = userSnap.exists() ? (userSnap.data().credits ?? 0) : 0;
          if (currentCredits < item.price) {
            throw new Error(`INSUFFICIENT_CREDITS:${currentCredits}`);
          }
        }

        // Copy the template into the buyer's org library
        tx.set(newTemplateRef, {
          name: item.name,
          method: "html",
          htmlCode: templateData.htmlCode,
          jsonData: templateData.jsonData,
          variables: templateData.variables,
          layoutPreset: item.layoutPreset,
          marketplaceId: item.id,
          isForSale: false,
          createdAt: serverTimestamp(),
        });

        if (!alreadyOwned) {
          if (item.price > 0) {
            tx.update(userRef, { credits: increment(-item.price) });
          }
          tx.update(orgRef, { purchasedMarketplaceIds: arrayUnion(item.id) });
        }

        return { alreadyOwned };
      });

      if (!alreadyOwned) {
        setPurchasedIds((prev) => [...prev, item.id]);

        // Logging / seller payout — not price-critical, fine outside the transaction
        await addDoc(collection(db, "organizations", orgId, "transactions"), {
          type: "template",
          templateId: item.id,
          templateName: item.name,
          sellerUserId: item.createdBy,
          amount: item.price,
          createdAt: serverTimestamp(),
        });

        await addDoc(collection(db, "users", currentUser.uid, "transactions"), {
          type: "template-purchase",
          templateId: item.id,
          templateName: item.name,
          amount: -item.price,
          createdAt: serverTimestamp(),
        });

        if (item.createdBy && item.price > 0) {
          const sellerCredit = Math.round(item.price * 0.8);
          await updateDoc(doc(db, "users", item.createdBy), { credits: increment(sellerCredit) });

          await addDoc(collection(db, "users", item.createdBy, "transactions"), {
            type: "template",
            templateId: item.id,
            templateName: item.name,
            buyerUserId: currentUser.uid,
            buyerOrgId: orgId,
            salePrice: item.price,
            sellerCredit,
            platformFee: item.price - sellerCredit,
            createdAt: serverTimestamp(),
          });

          await addDoc(collection(db, "users", item.createdBy, "notifications"), {
            category: "sale",
            from: "Marketplace",
            subject: `Your template "${item.name}" was purchased`,
            preview: `You earned ${sellerCredit} credits (80% of KES ${item.price}). Your balance has been updated.`,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }

      navigate(`/dashboard/design/flyer?templateId=${newTemplateRef.id}`);
    } catch (err: any) {
      console.error("Purchase failed:", err);
      if (typeof err?.message === "string" && err.message.startsWith("INSUFFICIENT_CREDITS:")) {
        const have = err.message.split(":")[1];
        alert(`Not enough credits. You have ${have}, this costs ${item.price}.`);
      } else {
        alert("Purchase failed. Please try again.");
      }
    } finally {
      setBuyingId(null);
    }
  };

  // ── Layout helpers ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard/design")}
          className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Template store</h1>
      </div>

      {/* Search + filters */}
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="relative flex-1 lg:max-w-[40%]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7877C6]/20 focus:border-[#7877C6]"
          />
        </div>
        <div className="flex gap-1.5">
          {MARKETPLACE_CATEGORIES.map((f) => (
            <button
              key={f.id}
              onClick={() => setCategory(f.id)}
              className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition cursor-pointer
                ${category === f.id
                  ? "bg-[#7877C6] text-white border-[#7877C6]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 rounded-full border-2 border-[#7877C6] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-5 gap-3">
          {filtered.map((item) => {
            const isPurchased = purchasedIds.includes(item.id);
            const isBuying = buyingId === item.id;

            return (
              <MarketCard
                key={item.id}
                item={item}
                isPurchased={isPurchased}
                isBuying={isBuying}
                onBuy={handleGetTemplate}
              />
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <EmptyState
          icon={Package}
          title="No templates found"
          description={search ? "Try a different search" : "Browse and buy templates to get started"}
        />
      )}
    </div>
  );
};

export default TemplateMarketplace;
