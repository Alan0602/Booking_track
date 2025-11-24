// // src/context/ExpenseContext.jsx
// import { createContext, useContext, useState, useEffect } from "react";
// import { v4 as uuidv4 } from "uuid";

// const ExpenseContext = createContext(undefined);

// export const ExpenseProvider = ({ children }) => {
//   const [expenses, setExpenses] = useState(() => {
//     const saved = localStorage.getItem("expenses");
//     return saved ? JSON.parse(saved) : [];
//   });

//   // Sync to localStorage
//   useEffect(() => {
//     localStorage.setItem("expenses", JSON.stringify(expenses));
//   }, [expenses]);

//   // ── ADD EXPENSE WITH CATEGORY ──
//   const addExpense = (desc, amount, category = "Other") => {
//     if (!desc.trim() || amount <= 0) return;

//     const newExpense = {
//       id: uuidv4(),
//       description: desc.trim(),
//       amount: Number(amount),
//       category: category.trim() || "Other",
//       date: new Date().toISOString(),
//     };

//     setExpenses(prev => [...prev, newExpense]);
//   };

//   // ── REMOVE EXPENSE ──
//   const removeExpense = (id) => {
//     setExpenses(prev => prev.filter(e => e.id !== id));
//   };

//   // ── TOTAL SPENT ──
//   const total = expenses.reduce((sum, e) => sum + e.amount, 0);

//   // ── TOP CATEGORIES (optional helper) ──
//   const getCategoryTotals = () => {
//     const map = {};
//     expenses.forEach(e => {
//       const cat = e.category || "Other";
//       map[cat] = (map[cat] || 0) + e.amount;
//     });
//     return Object.entries(map)
//       .map(([name, amount]) => ({ name, amount }))
//       .sort((a, b) => b.amount - a.amount);
//   };

//   return (
//     <ExpenseContext.Provider value={{
//       expenses,
//       addExpense,
//       removeExpense,
//       total,
//       getCategoryTotals, // optional, or compute in component
//     }}>
//       {children}
//     </ExpenseContext.Provider>
//   );
// };

// export const useExpense = () => {
//   const ctx = useContext(ExpenseContext);
//   if (!ctx) throw new Error("useExpense must be used within ExpenseProvider");
//   return ctx;
// };

// src/context/ExpenseContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../utils/supabase";
import { useAuth } from "./AuthContext";
import { useWallet } from "./WalletContext";

const ExpenseContext = createContext(undefined);

export const ExpenseProvider = ({ children }) => {
  const { user } = useAuth();
  const { refreshWallets, refreshTransactions } = useWallet();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Map DB row → UI shape
  const fromRow = (row) => ({
    id: row.id,
    description: row.description,
    amount: Number(row.amount || 0),
    category: row.category || "Other",
    // Support either 'date' or legacy 'expense_date'
    date: row.date || row.expense_date, // ISO
    status: "logged",
    createdAt: row.created_at,
    paymentMethod: row.payment_method || "cash",
    vendor: row.vendor || "",
    location: row.location || "",
    notes: row.notes || "",
    isRecurring: !!row.is_recurring,
    tags: row.tags || [],
    attachment: row.attachment_url || null,
  });

  // Fetch all expenses (admin visibility across users)
  const refreshExpenses = async () => {
    if (!user) {
      setExpenses([]);
      return [];
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      const mapped = (data || []).map(fromRow);
      setExpenses(mapped);
      return mapped;
    } catch (err) {
      console.error("Failed to fetch expenses:", err?.message || err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── ADD EXPENSE (supports object or legacy params) ──
  const addExpense = async (...args) => {
    let expenseData;
    if (args.length === 1 && typeof args[0] === "object" && args[0].description) {
      expenseData = { ...args[0] };
    } else {
      const [desc, amount, category = "Other"] = args;
      if (!desc?.trim() || amount <= 0) throw new Error("Invalid expense");
      expenseData = {
        description: desc.trim(),
        amount: Number(amount),
        category: category?.trim() || "Other",
        date: new Date().toISOString(),
        paymentMethod: "cash",
      };
    }

    if (!user) throw new Error("Not authenticated");
    if (!expenseData.description?.trim() || Number(expenseData.amount) <= 0) {
      throw new Error("Invalid expense");
    }

    const id = crypto.randomUUID();
    // Compose expense_date from date and optional time
    const isoExpenseDate = (() => {
      const d = expenseData.date || new Date().toISOString();
      const t = expenseData.time || "00:00";
      try {
        return new Date(`${d.split("T")[0]}T${t}`).toISOString();
      } catch {
        return new Date(d).toISOString();
      }
    })();

    const payload = {
      p_expense_id: id,
      p_user_id: user.id,
      p_description: expenseData.description,
      p_amount: Number(expenseData.amount),
      p_category: expenseData.category || "Other",
      // Align with backend signature expecting 'p_date'
      p_date: isoExpenseDate,
      p_payment_method: expenseData.paymentMethod || "cash",
      p_vendor: expenseData.vendor || null,
      p_location: expenseData.location || null,
      p_notes: expenseData.notes || null,
      p_is_recurring: !!expenseData.isRecurring,
      p_tags: expenseData.tags || [],
      // Do NOT send attachment if function doesn't accept it
    };

    try {
      const { data, error } = await supabase.rpc("create_expense_transaction", payload);
      if (error) throw error;

      // Fetch inserted row to ensure consistent shape
      const { data: fresh, error: fetchErr } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .single();
      const mapped = fresh
        ? fromRow(fresh)
        : fromRow({
            id,
            description: payload.p_description,
            amount: payload.p_amount,
            category: payload.p_category,
            date: payload.p_date,
            created_at: new Date().toISOString(),
            payment_method: payload.p_payment_method,
            vendor: payload.p_vendor,
            location: payload.p_location,
            notes: payload.p_notes,
            is_recurring: payload.p_is_recurring,
            tags: payload.p_tags,
          });
      if (fetchErr) {
        console.warn("Fetch inserted expense failed:", fetchErr);
      }
      setExpenses((prev) => [mapped, ...prev]);
      // Refresh wallet balances/activity after atomic RPC completes
      try {
        await refreshWallets?.();
        await refreshTransactions?.();
      } catch (e) {
        console.warn("Wallet refresh after addExpense failed:", e?.message || e);
      }
      return mapped;
    } catch (err) {
      console.error("Error adding expense and transaction:", err?.message || err);
      throw new Error(err?.message || "Failed to add expense");
    }
  };

  // ── REMOVE EXPENSE (atomic delete + refund via RPC) ──
  const removeExpense = async (id) => {
    if (!user) throw new Error("Not authenticated");
    if (!id) throw new Error("Expense id required");
    try {
      const { error } = await supabase.rpc("delete_expense_transaction", {
        p_expense_id: id,
        p_user_id: user.id,
      });
      if (error) throw error;
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      try {
        await refreshWallets?.();
        await refreshTransactions?.();
      } catch (e) {
        console.warn("Wallet refresh after removeExpense failed:", e?.message || e);
      }
      return true;
    } catch (err) {
      console.error("Failed to delete expense:", err?.message || err);
      throw new Error(err?.message || "Failed to delete expense");
    }
  };

  // ── TOTAL SPENT ──
  const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // ── TOP CATEGORIES (optional helper) ──
  const getCategoryTotals = () => {
    const map = {};
    expenses.forEach((e) => {
      const cat = e.category || "Other";
      map[cat] = (map[cat] || 0) + Number(e.amount || 0);
    });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  return (
    <ExpenseContext.Provider value={{
      expenses,
      loading,
      refreshExpenses,
      addExpense,
      removeExpense,
      total,
      getCategoryTotals,
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error("useExpense must be used within ExpenseProvider");
  return ctx;
};