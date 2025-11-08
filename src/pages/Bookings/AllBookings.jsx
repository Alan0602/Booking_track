// src/pages/AllBookings.jsx
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Package, Calendar, Users, DollarSign, TrendingUp,
  Phone, Globe, Sun, Moon, Filter, Search, ChevronDown,
} from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import BookingTable from "./BookingTable";
import { useBooking, STATUS } from "../../context/BookingContext";
import { useExpense } from "../../context/ExpenseContext";
import { useWallet } from "../../context/WalletContext";
import { useState, useMemo, useEffect, useRef } from "react";

const AllBookings = () => {
  const {
    bookings,
    removeBooking,
    updateBookingStatus,
    isLoading,
    getStats,
  } = useBooking();
  const { expenses = [] } = useExpense();
  const {
    applyBookingWallet,
    refundBookingWallet,
    refundBookingOnDelete,
    reverseBookingWallet,
  } = useWallet();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [darkMode, setDarkMode] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const statusRef = useRef(null);
  const categoryRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setShowStatusDropdown(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBookings = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    return bookings.filter((b) => {
      const matchesSearch =
        !searchLower ||
        b.customerName?.toLowerCase().includes(searchLower) ||
        b.email?.toLowerCase().includes(searchLower) ||
        b.contactNumber?.toLowerCase().includes(searchLower) ||
        b.platform?.toLowerCase().includes(searchLower) ||
        b.category?.toLowerCase().includes(searchLower) ||
        b.id?.toLowerCase().includes(searchLower);

      const matchesStatus = filterStatus === "all" || b.status === filterStatus;
      const matchesCategory = filterCategory === "all" || b.category === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [bookings, searchTerm, filterStatus, filterCategory]);

  const stats = useMemo(() => {
    const base = getStats?.() || {
      total: 0, pending: 0, confirmed: 0, cancelled: 0,
      revenue: 0, netProfitTotal: 0,
    };
    const expenseTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netProfit = base.netProfitTotal - expenseTotal;

    return {
      total: base.total,
      confirmed: base.confirmed,
      pending: base.pending,
      revenue: base.revenue,
      netProfit,
    };
  }, [getStats, expenses]);

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "flight", label: "Flight" },
    { value: "bus", label: "Bus" },
    { value: "train", label: "Train" },
    { value: "cab", label: "Cab" },
    { value: "hotel", label: "Hotel" },
  ];

  const statusOptions = [
    { value: "all", label: "All Status", color: "text-gray-600 dark:text-gray-400" },
    { value: STATUS.PENDING, label: "Pending", color: "text-amber-600 dark:text-amber-400" },
    { value: STATUS.CONFIRMED, label: "Confirmed", color: "text-emerald-600 dark:text-emerald-400" },
    { value: STATUS.CANCELLED, label: "Cancelled", color: "text-red-600 dark:text-red-400" },
  ];

  // === HANDLE STATUS CHANGE WITH WALLET LOGIC ===
  const handleStatusChange = (id, currentStatus) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    const nextStatus = currentStatus === STATUS.CONFIRMED ? STATUS.PENDING : STATUS.CONFIRMED;

    // If going from CONFIRMED → PENDING
    if (currentStatus === STATUS.CONFIRMED && nextStatus === STATUS.PENDING) {
      refundBookingWallet(booking, "User"); // Refund platform + office
    }

    // If going from PENDING → CONFIRMED
    if (currentStatus === STATUS.PENDING && nextStatus === STATUS.CONFIRMED) {
      applyBookingWallet(booking, "User"); // Apply platform + office
    }

    updateBookingStatus(id, nextStatus);
  };

  // === HANDLE DELETE WITH FULL REFUND ===
  const handleRemove = (id) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    if (window.confirm("Delete this booking? All wallet entries will be refunded.")) {
      refundBookingOnDelete(booking, "User");
      removeBooking(id);
    }
  };

  return (
    <DashboardLayout>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-slate-50 via-white to-indigo-50"}`}>
        <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

          {/* HEADER */}
          <div className={`relative overflow-hidden rounded-2xl p-8 shadow-2xl text-white ${darkMode ? "bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900" : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700"}`}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Package className="w-9 h-9 text-white/90" />
                  <h1 className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100 animate-gradient-x">
                    All Bookings
                  </h1>
                </div>
                <p className="text-lg text-white/90 max-w-md">
                  Manage bookings with real-time wallet, profit, and history tracking.
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <TrendingUp size={18} className="text-green-300" />
                    <span className="font-semibold">{stats.total}</span>
                    <span className="text-sm text-white/90">Total</span>
                  </div>
                  <div className="text-sm text-white/90">
                    Revenue: ₹{stats.revenue.toLocaleString()} • Net: ₹{stats.netProfit.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to="/bookings/add" className="group relative inline-flex items-center gap-3 px-6 py-3.5 bg-white text-indigo-600 font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
                  <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-50 transition-opacity"></span>
                  <Plus size={22} className="relative z-10 group-hover:rotate-90 transition-transform" />
                  <span className="relative z-10">Add Booking</span>
                </Link>
                <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition">
                  {darkMode ? <Sun size={18} className="text-yellow-300" /> : <Moon size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { label: "Total", value: stats.total, icon: Package, gradient: darkMode ? "from-blue-600 to-blue-700" : "from-blue-500 to-blue-600" },
              { label: "Confirmed", value: stats.confirmed, icon: Calendar, gradient: darkMode ? "from-emerald-600 to-emerald-700" : "from-green-500 to-emerald-600" },
              { label: "Pending", value: stats.pending, icon: Users, gradient: darkMode ? "from-orange-600 to-orange-700" : "from-amber-500 to-orange-600" },
              { label: "Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, gradient: darkMode ? "from-purple-600 to-indigo-700" : "from-purple-500 to-indigo-600" },
              { label: "Net Profit", value: `₹${stats.netProfit.toLocaleString()}`, icon: TrendingUp, gradient: stats.netProfit >= 0 ? (darkMode ? "from-emerald-600 to-emerald-700" : "from-green-500 to-emerald-600") : (darkMode ? "from-red-600 to-red-700" : "from-red-500 to-rose-600") },
            ].map((stat, idx) => (
              <div key={idx} className={`bg-gradient-to-br ${stat.gradient} p-6 rounded-xl text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon size={28} className="opacity-80" />
                </div>
              </div>
            ))}
          </div>

          {/* SEARCH & FILTERS */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="flex-1 max-w-md">
              <div className={`relative flex items-center ${darkMode ? "bg-gray-800" : "bg-white"} rounded-xl shadow-sm border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <Search size={20} className={`absolute left-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, ID, platform..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-transparent outline-none transition text-base ${darkMode ? "text-white placeholder-gray-400" : "text-gray-900 placeholder-gray-500"}`}
                />
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <div ref={categoryRef} className="relative">
                <button onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className={`flex items-center gap-2 px-4 py-3.5 rounded-xl font-medium transition-all ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  <Filter size={18} />
                  Category
                  {filterCategory !== "all" && (
                    <span className="capitalize text-blue-600 dark:text-blue-400">
                      {categoryOptions.find(c => c.value === filterCategory)?.label}
                    </span>
                  )}
                  <ChevronDown size={16} className={`transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`} />
                </button>
                {showCategoryDropdown && (
                  <div className={`absolute top-full left-0 mt-2 w-48 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-xl border overflow-hidden z-20`}>
                    {categoryOptions.map((opt) => (
                      <button key={opt.value} onClick={() => { setFilterCategory(opt.value); setShowCategoryDropdown(false); }} className={`w-full text-left px-4 py-3 flex items-center justify-between transition-all ${filterCategory === opt.value ? darkMode ? "bg-blue-900/50 text-blue-300" : "bg-blue-50 text-blue-700" : darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"}`}>
                        <span>{opt.label}</span>
                        {filterCategory === opt.value && <span className="text-green-500">Check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div ref={statusRef} className="relative">
                <button onClick={() => setShowStatusDropdown(!showStatusDropdown)} className={`flex items-center gap-2 px-4 py-3.5 rounded-xl font-medium transition-all ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  <Filter size={18} />
                  Status
                  {filterStatus !== "all" && (
                    <span className={statusOptions.find(s => s.value === filterStatus)?.color}>
                      {statusOptions.find(s => s.value === filterStatus)?.label}
                    </span>
                  )}
                  <ChevronDown size={16} className={`transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} />
                </button>
                {showStatusDropdown && (
                  <div className={`absolute top-full right-0 mt-2 w-48 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-xl border overflow-hidden z-20`}>
                    {statusOptions.map((opt) => (
                      <button key={opt.value} onClick={() => { setFilterStatus(opt.value); setShowStatusDropdown(false); }} className={`w-full text-left px-4 py-3 flex items-center justify-between transition-all ${filterStatus === opt.value ? darkMode ? "bg-blue-900/50 text-blue-300" : "bg-blue-50 text-blue-700" : darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"}`}>
                        <span>{opt.label}</span>
                        {filterStatus === opt.value && <span className="text-green-500">Check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} rounded-2xl shadow-sm border overflow-hidden`}>
            {isLoading ? (
              <div className="p-16 flex flex-col items-center justify-center text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-indigo-600 mb-4"></div>
                <p>Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className={`text-center py-16 px-6 ${darkMode ? "text-gray-400" : "text-gray-900"}`}>
                <div className={`${darkMode ? "bg-gray-700" : "bg-gray-50"} w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5`}>
                  <Package size={48} className={darkMode ? "text-gray-500" : "text-gray-400"} />
                </div>
                <h3 className={`text-xl font-semibold ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                  {searchTerm || filterStatus !== "all" || filterCategory !== "all" ? "No bookings found" : "No bookings yet"}
                </h3>
                <p className={`${darkMode ? "text-gray-500" : "text-gray-500"} mt-2 max-w-sm mx-auto`}>
                  {searchTerm || filterStatus !== "all" || filterCategory !== "all" ? "Try adjusting your search or filters." : "Get started by creating your first booking."}
                </p>
                {!searchTerm && filterStatus === "all" && filterCategory === "all" && (
                  <Link to="/bookings/add" className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 ${darkMode ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"} text-white font-medium rounded-xl transition shadow-md`}>
                    <Plus size={18} />
                    Add First Booking
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <BookingTable
                  bookings={filteredBookings}
                  onUpdateStatus={handleStatusChange}
                  onRemove={handleRemove}
                  onEdit={(id) => navigate(`/bookings/edit/${id}`)}
                  onHistory={(id) => navigate(`/bookings/history/${id}`)}
                  darkMode={darkMode}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 6s ease infinite;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default AllBookings;