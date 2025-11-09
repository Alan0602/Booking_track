// src/pages/AllCustomers.jsx
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import { useBooking } from "../context/BookingContext";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  Mail,
  Package,
  Calendar,
  Globe,
  Copy,
  CheckCircle,
  Clock,
  TrendingUp,
  ChevronDown,
  Plane,
  Bus,
  Train,
  Car,
  Hotel,
  User,
  Users,
  IndianRupee,
  Search,
  Filter,
} from "lucide-react";

const categoryIcons = {
  flight: Plane,
  bus: Bus,
  train: Train,
  cab: Car,
  hotel: Hotel,
};

const categoryColors = {
  flight: "bg-blue-100 text-blue-700",
  bus: "bg-emerald-100 text-emerald-700",
  train: "bg-purple-100 text-purple-700",
  cab: "bg-orange-100 text-orange-700",
  hotel: "bg-pink-100 text-pink-700",
};

const platformLabels = {
  alhind: "AlHind",
  akbar: "Akbar",
  direct: "Direct",
};

export default function AllCustomers() {
  const navigate = useNavigate();
  const { bookings, isLoading } = useBooking();
  const [expanded, setExpanded] = useState(new Set());
  const [copied, setCopied] = useState({ field: "", id: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Extract unique customers
  const uniqueCustomers = useMemo(() => {
    const map = new Map();

    bookings.forEach((booking) => {
      const key = `${booking.email?.toLowerCase().trim()}|${booking.contactNumber?.trim()}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          customerName: booking.customerName,
          email: booking.email,
          contactNumber: booking.contactNumber,
          bookings: [],
        });
      }
      map.get(key).bookings.push(booking);
    });

    return Array.from(map.values()).map((cust) => {
      const sortedBookings = cust.bookings.sort((a, b) => new Date(b.date) - new Date(a.date));

      const totalRevenue = sortedBookings.reduce((s, b) => s + (b.totalRevenue || 0), 0);
      const netProfit = sortedBookings.reduce((s, b) => s + (b.netProfit || 0), 0);
      const basePayTotal = sortedBookings.reduce((s, b) => s + (b.basePay || 0), 0);
      const commissionTotal = sortedBookings.reduce((s, b) => s + (b.commissionAmount || 0), 0);
      const markupTotal = sortedBookings.reduce((s, b) => s + (b.markupAmount || 0), 0);

      const confirmed = sortedBookings.filter((b) => b.status === "confirmed").length;
      const pending = sortedBookings.filter((b) => b.status === "pending").length;
      const cancelled = sortedBookings.filter((b) => b.status === "cancelled").length;

      return {
        ...cust,
        bookings: sortedBookings,
        stats: {
          total: sortedBookings.length,
          confirmed,
          pending,
          cancelled,
          revenue: totalRevenue,
          profit: netProfit,
          basePay: basePayTotal,
          commission: commissionTotal,
          markup: markupTotal,
        },
      };
    });
  }, [bookings]);

  // Filter & Search
  const filteredCustomers = useMemo(() => {
    return uniqueCustomers
      .filter((cust) => {
        const search = searchTerm.toLowerCase();
        return (
          cust.customerName?.toLowerCase().includes(search) ||
          cust.email?.toLowerCase().includes(search) ||
          cust.contactNumber?.includes(search)
        );
      })
      .filter((cust) => {
        if (filterStatus === "all") return true;
        return cust.bookings.some((b) => b.status === filterStatus);
      })
      .sort((a, b) => b.stats.revenue - a.stats.revenue);
  }, [uniqueCustomers, searchTerm, filterStatus]);

  const toggleExpand = (id) => {
    const newSet = new Set(expanded);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpanded(newSet);
  };

  const copy = (text, field, id) => {
    navigator.clipboard.writeText(text);
    setCopied({ field, id });
    setTimeout(() => setCopied({ field: "", id: "" }), 2000);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition font-medium"
            >
              <ArrowLeft size={22} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              All Customers
            </h1>
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </motion.div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Customers", value: uniqueCustomers.length, icon: Users },
              { label: "Total Bookings", value: bookings.length, icon: Package },
              { label: "Total Revenue", value: `₹${uniqueCustomers.reduce((s, c) => s + c.stats.revenue, 0).toLocaleString()}`, icon: IndianRupee },
              { label: "Avg. Revenue", value: `₹${uniqueCustomers.length ? Math.round(uniqueCustomers.reduce((s, c) => s + c.stats.revenue, 0) / uniqueCustomers.length).toLocaleString() : 0}`, icon: TrendingUp },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 text-center"
              >
                <stat.icon size={28} className="mx-auto text-indigo-600 mb-2" />
                <p className="text-xs text-gray-600">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Customer List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50">
                <User size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">No customers found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isExpanded = expanded.has(cust.id);

                return (
                  <motion.div
                    key={cust.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/30 overflow-hidden"
                  >
                    {/* Customer Header */}
                    <button
                      onClick={() => toggleExpand(cust.id)}
                      className="w-full p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-indigo-50/50 transition"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                          {cust.customerName?.charAt(0).toUpperCase() || "C"}
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-bold text-gray-900">{cust.customerName}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <Mail size={14} /> {cust.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone size={14} /> {cust.contactNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Total Revenue</p>
                          <p className="font-bold text-green-700">₹{cust.stats.revenue.toLocaleString()}</p>
                        </div>
                        <ChevronDown
                          size={20}
                          className={`text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {/* Expanded Bookings */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-200/50"
                        >
                          <div className="p-6 space-y-4">
                            {/* Mini Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                              {[
                                { label: "Bookings", value: cust.stats.total },
                                { label: "Confirmed", value: cust.stats.confirmed },
                                { label: "Pending", value: cust.stats.pending },
                                { label: "Profit", value: `₹${cust.stats.profit.toLocaleString()}` },
                              ].map((s, i) => (
                                <div key={i} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3">
                                  <p className="text-xs text-gray-600">{s.label}</p>
                                  <p className="font-bold text-gray-900">{s.value}</p>
                                </div>
                              ))}
                            </div>

                            {/* Booking List */}
                            <div className="space-y-3">
                              {cust.bookings.map((b) => {
                                const Icon = categoryIcons[b.category] || Package;
                                const color = categoryColors[b.category] || "bg-gray-100 text-gray-700";

                                return (
                                  <div
                                    key={b.id}
                                    className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-indigo-50 transition"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-full ${color}`}>
                                        <Icon size={18} />
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          {b.category.charAt(0).toUpperCase() + b.category.slice(1)} • #{b.id}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          {format(new Date(b.date), "dd MMM yyyy")} • {platformLabels[b.platform] || b.platform}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-right">
                                      <div>
                                        <p className="font-bold text-green-700">₹{Number(b.totalRevenue).toLocaleString()}</p>
                                        <p className="text-xs text-gray-600">
                                          Base: ₹{Number(b.basePay).toLocaleString()} | 
                                          Comm: ₹{Number(b.commissionAmount).toLocaleString()} | 
                                          Markup: ₹{Number(b.markupAmount).toLocaleString()}
                                        </p>
                                      </div>
                                      <StatusBadge status={b.status} />
                                      <Link
                                        to={`/bookings/view/${b.id}`}
                                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                                      >
                                        View
                                      </Link>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}