// src/context/WalletContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import supabase from "../utils/supabase";
import { useAuth } from "./AuthContext";

const WalletContext = createContext();

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
};

// ──────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────
export const PLATFORM = {
  ALHIND: "Alhind",
  AKBAR: "Akbar",
  DIRECT: "Direct",
};

export const WALLET_KEYS = {
  ALHIND: "alhind",
  AKBAR: "akbar",
  OFFICE: "office",
};

// ──────────────────────────────────────────────────────────────
// PROVIDER
// ──────────────────────────────────────────────────────────────
export const WalletProvider = ({ children }) => {
  const { user } = useAuth();

  // Local view of balances keyed by internal keys
  const [wallets, setWallets] = useState({ alhind: 0, akbar: 0, office: 0 });
  // Index of wallets in Supabase: name -> { id, name, balance }
  const [walletIndex, setWalletIndex] = useState({});
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  // Mapping between internal keys and Supabase wallet names
  const WALLET_NAME_MAP = {
    [WALLET_KEYS.ALHIND]: "AlHind",
    [WALLET_KEYS.AKBAR]: "Akbar",
    [WALLET_KEYS.OFFICE]: "Office-Funds",
  };

  const NAME_TO_KEY = {
    AlHind: WALLET_KEYS.ALHIND,
    Akbar: WALLET_KEYS.AKBAR,
    "Office-Funds": WALLET_KEYS.OFFICE,
  };

  const loadWallets = async () => {
    if (!user) {
      setWallets({ alhind: 0, akbar: 0, office: 0 });
      setWalletIndex({});
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("wallets")
      .select("id,name,balance")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch wallets:", error);
      toast.error("Failed to load wallets");
      setLoading(false);
      return;
    }

    const index = {};
    const next = { alhind: 0, akbar: 0, office: 0 };
    (data || []).forEach((w) => {
      index[w.name] = { id: w.id, name: w.name, balance: Number(w.balance || 0) };
      const key = NAME_TO_KEY[w.name];
      if (key) {
        if (key === WALLET_KEYS.ALHIND) next.alhind = Number(w.balance || 0);
        if (key === WALLET_KEYS.AKBAR) next.akbar = Number(w.balance || 0);
        if (key === WALLET_KEYS.OFFICE) next.office = Number(w.balance || 0);
      }
    });

    setWalletIndex(index);
    setWallets(next);
    setLoading(false);
    // Refresh transactions after wallets index is ready (id→key mapping)
    await loadTransactions();
  };

  useEffect(() => {
    loadWallets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadTransactions = async (limit = 100) => {
    if (!user) {
      setTransactions([]);
      return;
    }
    // Build wallet id → key map from walletIndex
    const idToKey = {};
    Object.entries(walletIndex).forEach(([name, obj]) => {
      const k = NAME_TO_KEY[name];
      if (k && obj?.id) idToKey[obj.id] = k;
    });

    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("id,wallet_id,amount,created_at,created_by,description")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to fetch wallet transactions:", error);
      toast.error("Failed to load wallet activity");
      return;
    }

    const mapped = (data || []).map((row) => ({
      id: row.id,
      walletKey: idToKey[row.wallet_id] || null,
      operation: Number(row.amount) >= 0 ? "credit" : "debit",
      amount: Math.abs(Number(row.amount || 0)),
      user: row.created_by || "User",
      timestamp: row.created_at,
      description: row.description,
    }));

    setTransactions(mapped);
  };
  const recordTransaction = async (key, delta, meta = {}, actor = "System") => {
    const name = WALLET_NAME_MAP[key];
    const wallet = name ? walletIndex[name] : undefined;
    if (!wallet || !wallet.id) {
      const msg = `Wallet not found for key: ${String(key)}`;
      toast.error(msg);
      throw new Error(msg);
    }
    const amount = Number(delta || 0);
    if (amount === 0) return;
    const payload = {
      wallet_id: wallet.id,
      booking_id: meta.bookingId || null,
      amount,
      description: meta.description || meta.action || "Wallet transaction",
      created_by: user?.id || null,
    };
    const { error } = await supabase.from("wallet_transactions").insert([payload]);
    if (error) {
      console.error("Wallet transaction failed:", error);
      throw new Error(error.message || "Failed to record transaction");
    }
    await loadWallets();
    await loadTransactions();
  };

  const addToWallet = async (key, amount, actor = "System", meta = {}) => {
    if (!key || Number(amount) <= 0) return;
    await recordTransaction(key, Math.abs(Number(amount)), meta, actor);
    toast.success(`₹${Number(amount).toFixed(2)} credited to ${key}`);
  };

  const deductFromWallet = async (key, amount, actor = "System", meta = {}) => {
    if (!key || Number(amount) <= 0) return;
    const current = Number(wallets[key] ?? 0);
    if (current < Number(amount)) {
      const msg = `Insufficient balance in ${key}. Available: ₹${current.toFixed(2)}`;
      toast.error(msg);
      throw new Error(msg);
    }
    await recordTransaction(key, -Math.abs(Number(amount)), meta, actor);
    toast.success(`₹${Number(amount).toFixed(2)} debited from ${key}`);
  };

  
  const applyBookingWallet = async (booking, actor = "Confirm Booking") => {
    if (!booking) return;
    const base = Number(booking.basePay || 0);
    const markup = Number(booking.markupAmount || 0);
    const officeIncome = base + markup;

    if (booking.platform === PLATFORM.DIRECT) {
      if (officeIncome > 0) {
        await addToWallet(WALLET_KEYS.OFFICE, officeIncome, actor, {
          bookingId: booking.id,
          action: "apply_direct",
          description: "Direct: base + markup → Office",
        });
      }
      return;
    }

    const platformKey =
      booking.platform === PLATFORM.ALHIND
        ? WALLET_KEYS.ALHIND
        : booking.platform === PLATFORM.AKBAR
        ? WALLET_KEYS.AKBAR
        : null;

    const meta = { bookingId: booking.id, action: "apply" };

    if (platformKey) {
      if (base > 0) await deductFromWallet(platformKey, base, actor, { ...meta, type: "base_pay" });
      if (booking.commissionAmount > 0) {
        await addToWallet(platformKey, Number(booking.commissionAmount), actor, { ...meta, type: "commission" });
      }
    }

    if (officeIncome > 0) {
      await addToWallet(WALLET_KEYS.OFFICE, officeIncome, actor, {
        ...meta,
        description: "Office profit: base + markup",
      });
    }
  };

  // ──────────────────────────────────────────────────────────────
  // REFUND ON UN-CONFIRM
  // ──────────────────────────────────────────────────────────────
  const refundBookingWallet = async (booking, actor = "Unconfirm") => {
    if (!booking) return;
    const base = Number(booking.basePay || 0);
    const markup = Number(booking.markupAmount || 0);
    const officeRefund = base + markup;

    if (booking.platform === PLATFORM.DIRECT) {
      if (officeRefund > 0) {
        await deductFromWallet(WALLET_KEYS.OFFICE, officeRefund, actor, {
          bookingId: booking.id,
          action: "refund_direct",
          description: "Refund: base + markup → Office",
        });
      }
      return;
    }

    const platformKey =
      booking.platform === PLATFORM.ALHIND
        ? WALLET_KEYS.ALHIND
        : booking.platform === PLATFORM.AKBAR
        ? WALLET_KEYS.AKBAR
        : null;

    const meta = { bookingId: booking.id, action: "refund_unconfirm" };

    if (platformKey) {
      if (base > 0) await addToWallet(platformKey, base, actor, { ...meta, type: "base_refund" });
      if (booking.commissionAmount > 0) {
        await deductFromWallet(platformKey, Number(booking.commissionAmount), actor, { ...meta, type: "commission_refund" });
      }
    }

    if (officeRefund > 0) {
      await deductFromWallet(WALLET_KEYS.OFFICE, officeRefund, actor, {
        ...meta,
        description: "Refund: base + markup → Office",
      });
    }
  };

  // ──────────────────────────────────────────────────────────────
  // FULL REFUND ON DELETE
  // ──────────────────────────────────────────────────────────────
  const refundBookingOnDelete = async (booking, actor = "Delete Booking") => {
    if (!booking) return;

    const base = Number(booking.basePay || 0);
    const markup = Number(booking.markupAmount || 0);
    const officeRefund = base + markup;

    if (booking.platform === PLATFORM.DIRECT) {
      if (officeRefund > 0) {
        await deductFromWallet(WALLET_KEYS.OFFICE, officeRefund, actor, {
          bookingId: booking.id,
          action: "refund_delete_direct",
          description: "Delete refund: base + markup",
        });
      }
      return;
    }

    const platformKey =
      booking.platform === PLATFORM.ALHIND
        ? WALLET_KEYS.ALHIND
        : booking.platform === PLATFORM.AKBAR
        ? WALLET_KEYS.AKBAR
        : null;

    const meta = { bookingId: booking.id, action: "refund_on_delete" };

    if (platformKey) {
      if (base > 0) await addToWallet(platformKey, base, actor, { ...meta, type: "base_refund" });
      if (booking.commissionAmount > 0) {
        await deductFromWallet(platformKey, Number(booking.commissionAmount), actor, { ...meta, type: "commission_refund" });
      }
    }

    if (officeRefund > 0) {
      await deductFromWallet(WALLET_KEYS.OFFICE, officeRefund, actor, {
        ...meta,
        description: "Delete refund: base + markup",
      });
    }
  };

  // ──────────────────────────────────────────────────────────────
  // GETTERS
  // ──────────────────────────────────────────────────────────────
  const getWallet = (key) => Number(wallets[key] ?? 0);

  const formatWallet = (key) =>
    getWallet(key).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const walletData = [
    { name: "AlHind", amount: getWallet("alhind"), key: "alhind", formatted: formatWallet("alhind") },
    { name: "Akbar", amount: getWallet("akbar"), key: "akbar", formatted: formatWallet("akbar") },
    { name: "Office-Funds", amount: getWallet("office"), key: "office", formatted: formatWallet("office") },
  ];

  // ──────────────────────────────────────────────────────────────
  // NEW: EXPENSE LOGIC (ADDED BELOW — NO CHANGES ABOVE)
  // ──────────────────────────────────────────────────────────────

  // Debit Office Fund when expense is logged
  const debitOfficeForExpense = (expenseData, user = "Expense Logger") => {
    if (!expenseData || !expenseData.amount || expenseData.amount <= 0) {
      throw new Error("Invalid expense amount");
    }
    const amount = Number(expenseData.amount);
    deductFromWallet(WALLET_KEYS.OFFICE, amount, user, {
      expenseId: expenseData.id,
      description: expenseData.description,
      category: expenseData.category,
      action: "expense_debit",
    });
    toast.success(`₹${amount.toFixed(2)} debited from Office Fund`);
  };

  // Refund to Office Fund when expense is deleted
  const refundExpenseToOffice = (expenseData, user = "Expense Deleted") => {
    if (!expenseData || !expenseData.amount || expenseData.amount <= 0) {
      toast.error("Invalid expense for refund");
      return;
    }
    const amount = Number(expenseData.amount);
    addToWallet(WALLET_KEYS.OFFICE, amount, user, {
      expenseId: expenseData.id,
      description: `Refund: ${expenseData.description}`,
      category: expenseData.category,
      action: "expense_refund_on_delete",
    });
    toast.success(`₹${amount.toFixed(2)} refunded to Office Fund`);
  };

  // ──────────────────────────────────────────────────────────────
  // RETURN (added new functions to context)
  // ──────────────────────────────────────────────────────────────
  return (
    <WalletContext.Provider
      value={{
        walletData,
        wallets,
        loading,
        transactions,
        refreshTransactions: loadTransactions,
        refreshWallets: loadWallets,
        addToWallet,
        deductFromWallet,
        applyBookingWallet,
        refundBookingWallet,
        refundBookingOnDelete,
        getWallet,
        formatWallet,
        PLATFORM,
        WALLET_KEYS,

        // NEW: Expense functions
        debitOfficeForExpense,
        refundExpenseToOffice,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};