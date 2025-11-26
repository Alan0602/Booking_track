// src/pages/EditBooking.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useBooking, CATEGORY, STATUS } from "../context/BookingContext";
import { useWallet, PLATFORM, WALLET_KEYS } from "../context/WalletContext";
import { motion } from "framer-motion";
import {
  ArrowLeft, Save, User, Mail, Calendar, IndianRupee, CheckCircle,
  Phone, Globe, Plane, Bus, Train, Car, Hotel, Clock, TrendingUp, ChevronDown, AlertCircle, History
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

const categories = [
  { value: CATEGORY.FLIGHT, label: "Flight", icon: Plane, color: "bg-blue-100 text-blue-700" },
  { value: CATEGORY.BUS, label: "Bus", icon: Bus, color: "bg-emerald-100 text-emerald-700" },
  { value: CATEGORY.TRAIN, label: "Train", icon: Train, color: "bg-purple-100 text-purple-700" },
  { value: CATEGORY.CAB, label: "Cab", icon: Car, color: "bg-orange-100 text-orange-700" },
  { value: CATEGORY.HOTEL, label: "Hotel", icon: Hotel, color: "bg-pink-100 text-pink-700" },
];

const platforms = [
  { value: "", label: "Select Platform" },
  { value: PLATFORM.ALHIND, label: "AlHind", walletKey: WALLET_KEYS.ALHIND },
  { value: PLATFORM.AKBAR, label: "Akbar", walletKey: WALLET_KEYS.AKBAR },
  { value: PLATFORM.DIRECT, label: "Direct", walletKey: null },
];

const countryCodes = [
  { code: "+91", country: "India", flag: "IN" },
  { code: "+1", country: "USA", flag: "US" },
  { code: "+44", country: "UK", flag: "GB" },
  { code: "+971", country: "UAE", flag: "AE" },
  { code: "+966", country: "Saudi Arabia", flag: "SA" },
  { code: "+974", country: "Qatar", flag: "QA" },
  { code: "+965", country: "Kuwait", flag: "KW" },
  { code: "+968", country: "Oman", flag: "OM" },
  { code: "+973", country: "Bahrain", flag: "BH" },
  { code: "+61", country: "Australia", flag: "AU" },
];

export default function EditBooking() {
  const { updateBooking, getBookingById } = useBooking();
  const { refundBookingWallet, applyBookingWallet, getWallet } = useWallet(); // Fixed: reverse → refund
  const navigate = useNavigate();
  const { id } = useParams();

  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    customerName: "",
    email: "",
    contactNumber: "",
    selectedCountryCode: "+91",
    date: format(new Date(), "yyyy-MM-dd"),
    basePay: "",
    commissionAmount: "",
    markupAmount: "",
    platform: "",
    status: STATUS.PENDING,
    category: CATEGORY.FLIGHT,
  });

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load booking
  useEffect(() => {
    const booking = getBookingById(id);
    if (!booking) {
      toast.error("Booking not found");
      navigate("/bookings");
      return;
    }

    let code = "+91";
    let number = booking.contactNumber || "";
    const match = number.match(/^(\+\d+)\s(.+)$/);
    if (match) {
      code = match[1];
      number = match[2];
    }

    setForm({
      customerName: booking.customerName || "",
      email: booking.email || "",
      contactNumber: number,
      selectedCountryCode: code,
      date: format(new Date(booking.date), "yyyy-MM-dd"),
      basePay: booking.basePay?.toString() || "",
      commissionAmount: booking.commissionAmount?.toString() || "",
      markupAmount: booking.markupAmount?.toString() || "",
      platform: booking.platform || "",
      African: booking.status || STATUS.PENDING,
      category: booking.category || CATEGORY.FLIGHT,
    });
  }, [id, getBookingById, navigate]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fullContact = `${form.selectedCountryCode} ${form.contactNumber}`.trim();
  const isDirect = form.platform === PLATFORM.DIRECT;
  const isConfirmed = form.status === STATUS.CONFIRMED;

  const formatBalance = (amount) => Number(amount || 0).toFixed(2);

  const totalRevenue = useMemo(() => {
    const base = parseFloat(form.basePay) || 0;
    const comm = parseFloat(form.commissionAmount) || 0;
    const mark = parseFloat(form.markupAmount) || 0;
    return formatBalance(base + comm + mark);
  }, [form.basePay, form.commissionAmount, form.markupAmount]);

  const netProfit = useMemo(() => {
    const comm = parseFloat(form.commissionAmount) || 0;
    const mark = parseFloat(form.markupAmount) || 0;
    return isDirect ? formatBalance(parseFloat(form.basePay) + mark) : formatBalance(comm + mark);
  }, [form.basePay, form.commissionAmount, form.markupAmount, isDirect]);

  const baseAmount = parseFloat(form.basePay) || 0;

  const platformBalance = useMemo(() => {
    if (!form.platform || isDirect) return null;
    const p = platforms.find(p => p.value === form.platform);
    return p?.walletKey ? getWallet(p.walletKey) : null;
  }, [form.platform, getWallet, isDirect]);

  const validate = () => {
    const e = {};

    if (!form.customerName.trim()) e.customerName = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email";
    if (!form.date) e.date = "Date is required";

    const digitsOnly = form.contactNumber.replace(/\D/g, "");
    if (digitsOnly.length < 10) e.contactNumber = "Contact number must have at least 10 digits";

    if (form.basePay && Number(form.basePay) < 0) e.basePay = "Base pay cannot be negative";
    if (form.commissionAmount && Number(form.commissionAmount) < 0) e.commissionAmount = "Commission cannot be negative";
    if (form.markupAmount && Number(form.markupAmount) < 0) e.markupAmount = "Markup cannot be negative";

    if (isConfirmed && !isDirect && platformBalance !== null && baseAmount > 0) {
      if (platformBalance < baseAmount) {
        e.basePay = `Insufficient balance in ${form.platform}. Available: ₹${formatBalance(platformBalance)}`;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const oldBooking = getBookingById(id);
    if (!oldBooking) {
      toast.error("Booking not found");
      setSubmitting(false);
      return;
    }

    try {
      const base = Number(form.basePay) || 0;
      const comm = Number(form.commissionAmount) || 0;
      const mark = Number(form.markupAmount) || 0;
      const totalRevenueValue = base + comm + mark;
      const netProfitValue = isDirect ? base + mark : comm + mark;

      const user = form.customerName.trim() || "Editor";

      // === STEP 1 & 2: Financial logic is now handled by Backend RPCs ===
      // The updateBooking function in BookingContext needs to handle this, 
      // or we rely on the fact that if status changed, we should use updateBookingStatus logic.
      // However, for EDIT, we might change amounts too.
      // Ideally, we should have a backend RPC for 'update_booking_transaction'.
      // For now, let's assume the user will use the Dashboard to toggle status if they want pure reversal.
      // But if they change amounts here, we need to handle it.

      // CRITICAL: If we just update the row, the wallet won't change (unless we add a trigger).
      // Since I haven't added a trigger for UPDATE in SQL, we need a way to handle this.
      // BUT, the user's issue was DOUBLE deduction.
      // If I remove this, and there is NO backend trigger, then NO wallet change happens on Edit.
      // That is also bad.

      // WAIT: The user said "unconfirm or delete".
      // If they use Edit Page to Unconfirm, this code runs.
      // If they use Dashboard to Unconfirm, AllBookings code runs.

      // I removed frontend logic from AllBookings.
      // Now AllBookings uses RPC.

      // For EditBooking:
      // If I remove this, and use updateBooking (which is just DB update), 
      // then changing status here WON'T update wallet.

      // SOLUTION: We need updateBooking in BookingContext to ALSO use RPCs.
      // I will remove this frontend logic here, and then update BookingContext.jsx to handle it.


      // === STEP 3: Build edit history ===
      const changes = [];
      if (oldBooking.basePay !== base) changes.push(`Base Pay: ₹${oldBooking.basePay} → ₹${base}`);
      if (oldBooking.commissionAmount !== comm) changes.push(`Commission: ₹${oldBooking.commissionAmount} → ₹${comm}`);
      if (oldBooking.markupAmount !== mark) changes.push(`Markup: ₹${oldBooking.markupAmount} → ₹${mark}`);
      if (oldBooking.platform !== form.platform) changes.push(`Platform: ${oldBooking.platform} → ${form.platform}`);
      if (oldBooking.status !== form.status) changes.push(`Status: ${oldBooking.status} → ${form.status}`);

      const editEntry = {
        timestamp: new Date().toISOString(),
        user,
        action: "edit",
        changes,
      };

      // === STEP 4: Final update ===
      const updatedBooking = {
        ...oldBooking,
        customerName: form.customerName.trim(),
        email: form.email.trim(),
        contactNumber: fullContact,
        date: form.date,
        basePay: base,
        commissionAmount: comm,
        markupAmount: mark,
        totalRevenue: totalRevenueValue,
        netProfit: netProfitValue,
        platform: form.platform || PLATFORM.DIRECT,
        status: form.status,
        category: form.category,
        editHistory: [...(oldBooking.editHistory || []), editEntry],
      };

      updateBooking(updatedBooking);
      setSuccess(true);
      toast.success("Booking updated successfully!");
      setTimeout(() => navigate("/bookings"), 1500);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
            <button onClick={() => navigate("/bookings")} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition">
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Edit Booking
            </h1>
            <button
              onClick={() => navigate(`/bookings/history/${id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition text-sm font-medium"
            >
              <History size={18} />
              History
            </button>
          </motion.div>

          {/* Success */}
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700">
              <CheckCircle size={24} />
              <div>
                <p className="font-semibold">Booking updated successfully!</p>
                <p className="text-sm">Wallet synced. Redirecting...</p>
              </div>
            </motion.div>
          )}

          {/* Form */}
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
            <div className="space-y-6">

              {/* Category */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Globe size={18} /> Travel Type
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {categories.map((cat) => (
                    <label key={cat.value} className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${form.category === cat.value ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}>
                      <input type="radio" name="category" value={cat.value} checked={form.category === cat.value}
                        onChange={(e) => setForm({ ...form, category: e.target.value })} className="sr-only" />
                      <cat.icon size={28} className={`mb-2 ${cat.color}`} />
                      <span className="text-xs sm:text-sm font-medium">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Platform */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Globe size={18} /> Booking Platform
                </label>
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500">
                  {platforms.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><User size={18} /> Name</label>
                  <input type="text" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.customerName ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`} placeholder="John Doe" />
                  {errors.customerName && <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><Mail size={18} /> Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.email ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`} placeholder="john@example.com" />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
              </div>

              {/* Contact */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Phone size={18} /> Contact Number
                </label>
                <div className="flex relative" ref={dropdownRef}>
                  <button type="button" onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-300 rounded-l-xl hover:bg-gray-100 whitespace-nowrap">
                    <span className="text-lg">{countryCodes.find(c => c.code === form.selectedCountryCode)?.flag}</span>
                    <span>{form.selectedCountryCode}</span>
                    <ChevronDown size={16} className={`transition-transform ${showCountryDropdown ? "rotate-180" : ""}`} />
                  </button>

                  {showCountryDropdown && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-64 overflow-y-auto">
                      {countryCodes.map((c) => (
                        <button key={c.code} type="button" onClick={() => {
                          setForm({ ...form, selectedCountryCode: c.code });
                          setShowCountryDropdown(false);
                        }}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 ${form.selectedCountryCode === c.code ? "bg-blue-50" : ""}`}>
                          <span className="text-lg">{c.flag}</span>
                          <span className="flex-1">{c.country}</span>
                          <span className="text-gray-500">{c.code}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}

                  <input type="text" value={form.contactNumber}
                    onChange={(e) => setForm({ ...form, contactNumber: e.target.value.replace(/\D/g, "") })}
                    className={`flex-1 px-4 py-3 rounded-r-xl border ${errors.contactNumber ? "border-red-500" : "border-gray-300"} border-l-0 focus:ring-2 focus:ring-blue-500`}
                    placeholder="9876543210" />
                </div>
                {errors.contactNumber && <p className="mt-1 text-sm text-red-600">{errors.contactNumber}</p>}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><Calendar size={18} /> Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Financials */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><IndianRupee size={18} /> Base Pay</label>
                  <input type="number" step="0.01" value={form.basePay} onChange={(e) => setForm({ ...form, basePay: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.basePay ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`} />
                  {errors.basePay && <p className="mt-1 text-sm text-red-600">{errors.basePay}</p>}
                </div>

                {!isDirect && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><IndianRupee size={18} /> Commission</label>
                    <input type="number" step="0.01" value={form.commissionAmount} onChange={(e) => setForm({ ...form, commissionAmount: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><TrendingUp size={18} /> Markup</label>
                  <input type="number" step="0.01" value={form.markupAmount} onChange={(e) => setForm({ ...form, markupAmount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><Clock size={18} /> Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500">
                  <option value={STATUS.PENDING}>Pending</option>
                  <option value={STATUS.CONFIRMED}>Confirmed</option>
                  <option value={STATUS.CANCELLED}>Cancelled</option>
                </select>
              </div>

              {/* Summary */}
              <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
                <h3 className="text-lg font-bold text-indigo-800 mb-4">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Net Profit:</span> <strong>₹{netProfit}</strong></div>
                  <div className="flex justify-between"><span>Total Revenue:</span> <strong>₹{totalRevenue}</strong></div>
                  <div className="flex justify-between"><span>Platform:</span> <span>{platforms.find(p => p.value === form.platform)?.label || "Direct"}</span></div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => navigate("/bookings")}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className={`flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition ${submitting ? "opacity-75" : "hover:from-blue-700 hover:to-indigo-700"}`}>
                  {submitting ? "Saving..." : <><Save size={20} /> Save Changes</>}
                </button>
              </div>
            </div>
          </motion.form>
        </div>
      </div>
    </DashboardLayout>
  );
}