import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Coins, ChevronDown, Check, Loader2, X } from "lucide-react";
import { getFirestore, doc, updateDoc, addDoc, collection, increment } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "../../config/firebase";

interface CreditPackage {
  id: string;
  credits: number;
  label: string;
  bonus?: number;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "starter", credits: 100, label: "Starter" },
  { id: "growth", credits: 500, label: "Growth", bonus: 50 },
  { id: "pro", credits: 1000, label: "Pro", bonus: 150 },
  { id: "enterprise", credits: 5000, label: "Enterprise", bonus: 1000 },
];

interface BuyCreditsModalProps {
  onClose: () => void;
  onPurchaseComplete?: () => void;
}

export function BuyCreditsModal({ onClose, onPurchaseComplete }: BuyCreditsModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(CREDIT_PACKAGES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handlePurchase = async () => {
    try {
      setPurchasing(true);
      const auth = getAuth(app);
      const user = auth.currentUser;

      if (!user) {
        alert("Please log in first");
        return;
      }

      const db = getFirestore(app);
      const totalCredits = selectedPackage.credits + (selectedPackage.bonus || 0);
      const totalPrice = totalCredits; // 1 credit = 1 KES

      // Add credits to existing balance (not replace)
      await updateDoc(doc(db, "users", user.uid), {
        credits: increment(totalCredits),
      });

      // Add transaction record (income - buying credits)
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        type: "credit-purchase",
        amount: totalPrice,
        credits: totalCredits,
        description: `Purchased ${selectedPackage.label} package`,
        packageId: selectedPackage.id,
        status: "completed",
        createdAt: new Date(),
      });

      alert(`Successfully purchased ${totalCredits} credits!`);
      onPurchaseComplete?.();
      onClose();
    } catch (err) {
      console.error("Purchase failed:", err);
      alert("Purchase failed. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const totalCredits = selectedPackage.credits + (selectedPackage.bonus || 0);
  // const totalPrice = totalCredits; // 1 credit = 1 KES

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full ">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Coins size={18} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Buy Credits</h2>
              <p className="text-xs text-gray-500">1 credit = 1 KES</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Package selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Package</p>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 transition"
              >
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-900">{selectedPackage.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {totalCredits.toLocaleString()} credits
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition shrink-0 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-999">
                  <div className="max-h-[240px] overflow-y-auto">
                    {CREDIT_PACKAGES.map((pkg) => {
                      const pkgTotal = pkg.credits + (pkg.bonus || 0);
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 transition flex items-center justify-between text-sm border-b border-gray-100 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{pkg.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {pkgTotal.toLocaleString()} credits • KES {pkgTotal}
                            </p>
                          </div>
                          {selectedPackage.id === pkg.id && (
                            <Check size={16} className="text-[#7877C6] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="pt-2 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Base</span>
              <span className="font-semibold">{selectedPackage.credits.toLocaleString()}</span>
            </div>
            {selectedPackage.bonus && (
              <div className="flex items-center justify-between text-green-600">
                <span className="font-medium">Bonus</span>
                <span className="font-semibold">+{selectedPackage.bonus.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-[#7877C6]">{totalCredits.toLocaleString()} credits</span>
            </div>
          </div>

          {/* Buy button */}
          <button
            onClick={handlePurchase}
            disabled={purchasing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#7877C6] text-white text-sm font-semibold hover:bg-[#6665b5] disabled:opacity-50 transition cursor-pointer"
          >
            {purchasing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Coins size={14} />
                Buy Credits
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Render as portal to avoid stacking context issues
  return createPortal(modalContent, document.body);
}

