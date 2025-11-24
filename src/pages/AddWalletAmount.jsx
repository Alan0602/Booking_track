// src/pages/AddWalletAmount.jsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useWallet, WALLET_KEYS } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Minus,
  Wallet as WalletIcon,
  CheckCircle,
  Clock,
  User,
  Copy,
  IndianRupee,
} from "lucide-react";
import { format } from "date-fns";

const walletOptions = [
  { value: WALLET_KEYS.ALHIND, label: "AlHind", color: "from-emerald-400 to-teal-600" },
  { value: WALLET_KEYS.AKBAR, label: "Akbar", color: "from-purple-400 to-indigo-600" },
  { value: WALLET_KEYS.OFFICE, label: "Office Fund", color: "from-amber-400 to-orange-600" },
];

export default function AddWalletAmount() {
  const {
    addToWallet,
    deductFromWallet,
    transactions,
    getWallet,
    formatWallet,
  } = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    wallet: "",
    amount: "",
    mode: "add",
    name: user?.name || "",
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState(""); // ← NEW: Custom message
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState("");

  const currentBalance = useMemo(() => getWallet(form.wallet), [form.wallet, getWallet]);
  const formattedBalance = useMemo(() => formatWallet(form.wallet), [form.wallet, formatWallet]);

  const validate = () => {
    const e = {};
    if (!form.wallet) e.wallet = "Select a wallet";
    if (!form.amount || Number(form.amount) <= 0) e.amount = "Enter a valid amount";
    if (!form.name.trim()) e.name = "Name is required";
    if (form.mode === "remove" && Number(form.amount) > currentBalance) {
      e.amount = `Insufficient balance: ₹${formattedBalance}`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const amount = Number(form.amount);
      const walletLabel = walletOptions.find(w => w.value === form.wallet)?.label || "Wallet";

      if (form.mode === "add") {
        await addToWallet(form.wallet, amount, form.name.trim());
        setSuccessMessage(`₹${amount.toFixed(2)} added to ${walletLabel}!`);
      } else {
        await deductFromWallet(form.wallet, amount, form.name.trim());
        setSuccessMessage(`₹${amount.toFixed(2)} deducted from ${walletLabel}!`);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSuccessMessage("");
        setForm({ ...form, amount: "", name: user?.name || "" });
      }, 2000);
    } catch (err) {
      alert(err.message || "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  };

  const recentTransactions = useMemo(() => {
    return (transactions || [])
      .filter(t => t.walletKey === form.wallet)
      .slice(-6)
      .reverse();
  }, [transactions, form.wallet]);

  const copyBalance = () => {
    navigator.clipboard.writeText(formattedBalance);
    setCopied("balance");
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition font-medium"
            >
              <ArrowLeft size={22} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Wallet Manager
            </h1>
            <div className="w-24" />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* === FORM CARD === */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <WalletIcon size={28} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Update Wallet</h2>
              </div>

              {/* SUCCESS MESSAGE */}
              <AnimatePresence mode="wait">
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 shadow-md"
                  >
                    <CheckCircle size={28} className="text-emerald-600" />
                    <div>
                      <p className="font-bold text-lg">{successMessage}</p>
                      <p className="text-sm">Wallet updated successfully.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Add / Remove Toggle */}
                <div className="flex gap-3">
                  {["add", "remove"].map((mode) => {
                    const isActive = form.mode === mode;
                    const Icon = mode === "add" ? Plus : Minus;
                    const gradient = mode === "add"
                      ? "from-emerald-500 to-teal-600"
                      : "from-red-500 to-rose-600";

                    return (
                      <motion.button
                        key={mode}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setForm({ ...form, mode })}
                        className={`flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
                          isActive
                            ? `bg-gradient-to-r ${gradient} text-white`
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Icon size={20} />
                        {mode === "add" ? "Add Funds" : "Deduct Funds"}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Wallet Select */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <WalletIcon size={18} /> Select Wallet
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {walletOptions.map((opt) => {
                      const isSelected = form.wallet === opt.value;
                      return (
                        <motion.label
                          key={opt.value}
                          whileHover={{ scale: 1.02 }}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-gradient-to-br ${opt.color} rounded-lg shadow-md`} />
                            <span className="font-medium">{opt.label}</span>
                          </div>
                          <input
                            type="radio"
                            name="wallet"
                            value={opt.value}
                            checked={isSelected}
                            onChange={(e) => setForm({ ...form, wallet: e.target.value })}
                            className="sr-only"
                          />
                        </motion.label>
                      );
                    })}
                  </div>
                  {errors.wallet && <p className="mt-2 text-sm text-red-600">{errors.wallet}</p>}
                </div>

                {/* Current Balance */}
                {form.wallet && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <IndianRupee size={18} className="text-indigo-600" />
                      <span className="text-sm font-medium text-gray-700">Current Balance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xl text-indigo-800">
                        ₹{formattedBalance}
                      </span>
                      <button
                        onClick={copyBalance}
                        className="p-1.5 rounded hover:bg-indigo-100 transition"
                        title="Copy balance"
                      >
                        <Copy size={16} className={copied === "balance" ? "text-emerald-600" : "text-indigo-600"} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <User size={18} /> Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your name"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    } bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-base`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Amount */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <IndianRupee size={18} /> Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="0.00"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                        errors.amount ? "border-red-500" : "border-gray-300"
                      } bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-base`}
                    />
                    <IndianRupee size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all ${
                    form.mode === "add"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                  } ${submitting ? "opacity-75 cursor-not-allowed" : ""}`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {form.mode === "add" ? <Plus size={20} /> : <Minus size={20} />}
                      {form.mode === "add" ? "Add to Wallet" : "Deduct from Wallet"}
                    </span>
                  )}
                </motion.button>
              </form>
            </motion.div>

            {/* === RECENT TRANSACTIONS === */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                  <Clock size={28} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Clock size={36} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500">No transactions yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Select a wallet to view activity.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          t.operation === "credit"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {t.operation === "credit" ? <Plus size={18} /> : <Minus size={18} />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{t.user}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(t.timestamp), "dd MMM yyyy, hh:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          t.operation === "credit" ? "text-emerald-700" : "text-red-700"
                        }`}>
                          {t.operation === "credit" ? "+" : "-"}₹{t.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {walletOptions.find(w => w.value === t.walletKey)?.label}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}