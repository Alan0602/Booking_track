// src/context/WalletContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";

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
  const defaultWallets = { alhind: 0, akbar: 0, office: 0 };

  const [wallets, setWallets] = useState(() => {
    const saved = localStorage.getItem("wallets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          alhind: Number(parsed.alhind) || 0,
          akbar: Number(parsed.akbar) || 0,
          office: Number(parsed.office) || 0,
        };
      } catch {
        return defaultWallets;
      }
    }
    return defaultWallets;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("walletTransactions");
    return saved ? JSON.parse(saved) : [];
  });

  // ──────────────────────────────────────────────────────────────
  // PERSISTENCE
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("wallets", JSON.stringify(wallets));
  }, [wallets]);

  useEffect(() => {
    localStorage.setItem("walletTransactions", JSON.stringify(transactions));
  }, [transactions]);

  // ──────────────────────────────────────────────────────────────
  // CORE: UPDATE
  // ──────────────────────────────────────────────────────────────
  const updateWallet = (key, amount, op = "add") => {
    setWallets((prev) => {
      const current = Number(prev[key] ?? 0);
      const delta = Number(amount) || 0;
      const updated = op === "add" ? current + delta : current - delta;
      return { ...prev, [key]: Math.max(0, updated) };
    });
  };

  const addToWallet = (key, amount, user = "System", meta = {}) => {
    if (!key || amount <= 0) return;
    updateWallet(key, amount, "add");
    logTransaction(key, amount, "credit", user, meta);
  };

  const deductFromWallet = (key, amount, user = "System", meta = {}) => {
    if (!key || amount <= 0) return;
    const current = Number(wallets[key] ?? 0);
    if (current < amount) {
      const msg = `Insufficient balance in ${key}. Available: ₹${current.toFixed(2)}`;
      toast.error(msg);
      throw new Error(msg);
    }
    updateWallet(key, amount, "deduct");
    logTransaction(key, amount, "debit", user, meta);
  };

  const logTransaction = (key, amount, op, user, meta) => {
    setTransactions((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        walletKey: key,
        amount: Number(amount),
        operation: op,
        user,
        timestamp: new Date().toISOString(),
        ...meta,
      },
    ]);
  };

  // ──────────────────────────────────────────────────────────────
  // APPLY ON CONFIRM
  // ──────────────────────────────────────────────────────────────
  const applyBookingWallet = (booking, user = "Confirm Booking") => {
    if (!booking) return;

    const base = booking.basePay || 0;
    const markup = booking.markupAmount || 0;
    const officeIncome = base + markup;

    if (booking.platform === PLATFORM.DIRECT) {
      if (officeIncome > 0) {
        addToWallet(WALLET_KEYS.OFFICE, officeIncome, user, {
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
      if (base > 0) deductFromWallet(platformKey, base, user, { ...meta, type: "base_pay" });
      if (booking.commissionAmount > 0) {
        addToWallet(platformKey, booking.commissionAmount, user, { ...meta, type: "commission" });
      }
    }

    if (officeIncome > 0) {
      addToWallet(WALLET_KEYS.OFFICE, officeIncome, user, {
        ...meta,
        description: "Office profit: base + markup",
      });
    }
  };

  // ──────────────────────────────────────────────────────────────
  // REFUND ON UN-CONFIRM
  // ──────────────────────────────────────────────────────────────
  const refundBookingWallet = (booking, user = "Unconfirm") => {
    if (!booking) return;

    const base = booking.basePay || 0;
    const markup = booking.markupAmount || 0;
    const officeRefund = base + markup;

    if (booking.platform === PLATFORM.DIRECT) {
      if (officeRefund > 0) {
        deductFromWallet(WALLET_KEYS.OFFICE, officeRefund, user, {
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
      if (base > 0) addToWallet(platformKey, base, user, { ...meta, type: "base_refund" });
      if (booking.commissionAmount > 0) {
        deductFromWallet(platformKey, booking.commissionAmount, user, { ...meta, type: "commission_refund" });
      }
    }

    if (officeRefund > 0) {
      deductFromWallet(WALLET_KEYS.OFFICE, officeRefund, user, {
        ...meta,
        description: "Refund: base + markup → Office",
      });
    }
  };

  // ──────────────────────────────────────────────────────────────
  // FULL REFUND ON DELETE
  // ──────────────────────────────────────────────────────────────
  const refundBookingOnDelete = (booking, user = "Delete Booking") => {
    if (!booking) return;

    const base = booking.basePay || 0;
    const markup = booking.markupAmount || 0;
    const officeRefund = base + markup;

    if (booking.platform === PLATFORM.DIRECT) {
      if (officeRefund > 0) {
        deductFromWallet(WALLET_KEYS.OFFICE, officeRefund, user, {
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
      if (base > 0) addToWallet(platformKey, base, user, { ...meta, type: "base_refund" });
      if (booking.commissionAmount > 0) {
        deductFromWallet(platformKey, booking.commissionAmount, user, { ...meta, type: "commission_refund" });
      }
    }

    if (officeRefund > 0) {
      deductFromWallet(WALLET_KEYS.OFFICE, officeRefund, user, {
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
    { name: "Office Fund", amount: getWallet("office"), key: "office", formatted: formatWallet("office") },
  ];

  // ──────────────────────────────────────────────────────────────
  // RETURN
  // ──────────────────────────────────────────────────────────────
  return (
    <WalletContext.Provider
      value={{
        walletData,
        wallets,
        transactions,
        addToWallet,
        deductFromWallet,
        applyBookingWallet,
        refundBookingWallet,
        refundBookingOnDelete,
        getWallet,
        formatWallet,
        PLATFORM,
        WALLET_KEYS,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};