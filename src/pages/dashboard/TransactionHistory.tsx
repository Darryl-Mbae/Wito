import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "../../config/firebase";
import { BuyCreditsModal } from "./BuyCredits";

interface Transaction {
  id: string;
  type: "sale" | "template-purchase" | "credit-purchase" | "withdrawal" | "deposit";
  amount: number;
  description: string;
  templateName?: string;
  createdAt: string;
  status: "completed" | "pending" | "failed";
}

const TransactionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
  const auth = getAuth(app);
  const unsubAuth = onAuthStateChanged(auth, (user) => {
    if (user) {
      loadTransactions();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  });
  return () => unsubAuth();
}, []);



  const loadTransactions = async () => {
    try {
      setRefreshing(true);
      const auth = getAuth(app);
      const user = auth.currentUser;

      if (!user) return;

      const db = getFirestore(app);

      // Fetch user transactions
      const transactionsQ = query(
        collection(db, "users", user.uid, "transactions"),
        orderBy("createdAt", "desc")
      );

      const transactionSnap = await getDocs(transactionsQ);
      const txns = transactionSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || "purchase",
          amount: data.amount || 0,
          description: data.description || "",
          templateName: data.templateName,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
          status: data.status || "completed",
        } as Transaction;
      });

      setTransactions(txns);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sale":
      case "credit-purchase":
        return <ArrowUpRight size={14} className="text-green-500" />;
      case "template-purchase":
        return <ArrowDownLeft size={14} className="text-red-500" />;
      case "withdrawal":
        return <ArrowDownLeft size={14} className="text-amber-500" />;
      default:
        return <ArrowUpRight size={14} className="text-blue-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sale":
        return "Template Sale";
      case "template-purchase":
        return "Template Purchase";
      case "credit-purchase":
        return "Buy Credits";
      case "withdrawal":
        return "Withdrawal";
      default:
        return "Credit";
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case "sale":
      case "credit-purchase":
      case "deposit":
        return "text-green-600";
      case "template-purchase":
      case "withdrawal":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-5 w-5 border-2 border-gray-200 border-t-[#7877C6] rounded-full" />
      </div>
    );
  }

  const handlePurchaseComplete = () => {
    // Refresh transactions after purchase
    loadTransactions();
  };

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition cursor-pointer"
      >
        <ArrowLeft size={13} />
        Back
      </button>

      {/* Single right column - EventDetail style logs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Transaction Logs</h2>
            <p className="text-xs text-gray-500 mt-1">{transactions.length} transactions</p>
          </div>
          <button
            onClick={() => loadTransactions()}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-600 font-medium"
            title="Refresh transactions"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Logs list */}
        <div className="divide-y divide-gray-100">
          {transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No transactions yet</p>
            </div>
          ) : (
            transactions.map((txn) => (
              <div
                key={txn.id}
                className="px-6 py-3.5 hover:bg-gray-50 transition flex items-center justify-between gap-4"
              >
                {/* Left: Icon + Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 flex items-center justify-center p-2 bg-gray-50 rounded-lg">
                    {getTypeIcon(txn.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900">
                      {txn.description || getTypeLabel(txn.type)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(txn.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Right: Amount + Status */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${getAmountColor(txn.type)}`}>
                      {txn.amount >= 0 ? "+" : ""}
                      KES {txn.amount.toLocaleString()}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                        txn.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : txn.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Buy Credits Modal */}
      {showBuyCredits && (
        <BuyCreditsModal 
          onClose={() => setShowBuyCredits(false)}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
    </div>
  );
};

export default TransactionHistoryPage;
