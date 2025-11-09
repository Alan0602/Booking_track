// src/pages/Reports.jsx
import { useState, useMemo, useRef } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useBooking, STATUS } from "../context/BookingContext";
import { useExpense } from "../context/ExpenseContext";
import DashboardLayout from "../components/DashboardLayout";

import {
  Download, Calendar, TrendingUp, TrendingDown, Users,
  FileText, Filter, BarChart3, PieChart, Activity, Target,
  ArrowUpRight, ArrowDownRight, IndianRupee, ShoppingCart,
  FileDown, Gauge, Sparkles, Sun, Moon,
} from "lucide-react";

import {
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar,
} from "recharts";

const REPORT_TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "revenue", label: "Revenue", icon: TrendingUp },
  { id: "expenses", label: "Expenses", icon: ShoppingCart },
  { id: "customers", label: "Customers", icon: Users },
  { id: "performance", label: "Performance", icon: Gauge },
];

const Reports = () => {
  // --------------------------------------------------------------
  // 1. LIVE CONTEXT (bookings & expenses)
  // --------------------------------------------------------------
  const { bookings = [] } = useBooking();          // <-- live array
  const { expenses = [] } = useExpense();          // <-- live array

  // --------------------------------------------------------------
  // 2. UI STATE
  // --------------------------------------------------------------
  const [dateRange, setDateRange] = useState("thisMonth");
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  const [reportTab, setReportTab] = useState("overview");
  const [darkMode, setDarkMode] = useState(false);

  const reportRef = useRef(null);

  // --------------------------------------------------------------
  // 3. DATE RANGE CALCULATION
  // --------------------------------------------------------------
  const { start, end } = useMemo(() => {
    const now = new Date();
    let s = startOfMonth(now);
    let e = endOfMonth(now);

    if (dateRange === "custom" && customStart && customEnd) {
      s = startOfDay(customStart);
      e = endOfDay(customEnd);
    } else {
      switch (dateRange) {
        case "lastMonth":
          s = startOfMonth(subMonths(now, 1));
          e = endOfMonth(subMonths(now, 1));
          break;
        case "last3Months":
          s = startOfMonth(subMonths(now, 3));
          e = endOfMonth(now);
          break;
        case "thisYear":
          s = new Date(now.getFullYear(), 0, 1);
          e = now;
          break;
        default:
          break;
      }
    }
    return { start: s, end: e };
  }, [dateRange, customStart, customEnd]);

  // --------------------------------------------------------------
  // 4. FILTERED CONFIRMED BOOKINGS (only CONFIRMED count)
  // --------------------------------------------------------------
  const confirmedInRange = useMemo(() => {
    return bookings.filter(b => {
      const d = new Date(b.date);
      return b.status === STATUS.CONFIRMED && d >= start && d <= end;
    });
  }, [bookings, start, end, STATUS.CONFIRMED]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });
  }, [expenses, start, end]);

  // --------------------------------------------------------------
  // 5. CORE METRICS (live)
  // --------------------------------------------------------------
  const totalRevenue = confirmedInRange.reduce((s, b) => s + (Number(b.totalRevenue) || 0), 0);
  const bookingProfit = confirmedInRange.reduce((s, b) => s + (Number(b.netProfit) || 0), 0);
  const totalExpense = filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const netProfit = bookingProfit - totalExpense;
  const profitMargin = totalRevenue ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;
  const bookingCount = confirmedInRange.length;
  const avgBooking = bookingCount ? Math.round(totalRevenue / bookingCount) : 0;

  // previous-period growth (same length)
  const prevRevenue = useMemo(() => {
    const diff = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - diff - 86400000);
    const prevEnd = new Date(end.getTime() - diff - 86400000);
    return bookings
      .filter(b => {
        const d = new Date(b.date);
        return b.status === STATUS.CONFIRMED && d >= prevStart && d <= prevEnd;
      })
      .reduce((s, b) => s + (Number(b.totalRevenue) || 0), 0);
  }, [bookings, start, end, STATUS.CONFIRMED]);

  const revenueGrowth = prevRevenue
    ? Number((((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1))
    : 0;

  // --------------------------------------------------------------
  // 6. CHART DATA (live)
  // --------------------------------------------------------------
  const dailyRevenue = useMemo(() => {
    const days = eachDayOfInterval({ start, end });
    return days.map(day => {
      const dayRev = confirmedInRange
        .filter(b => format(new Date(b.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
        .reduce((s, b) => s + (Number(b.totalRevenue) || 0), 0);
      return { date: format(day, "MMM d"), revenue: dayRev };
    });
  }, [confirmedInRange, start, end]);

  const topCustomers = useMemo(() => {
    const map = {};
    confirmedInRange.forEach(b => {
      const name = b.customerName || "Unknown";
      map[name] = (map[name] || 0) + (Number(b.totalRevenue) || 0);
    });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [confirmedInRange]);

  const expenseByCategory = useMemo(() => {
    const map = { Fuel: 0, Salary: 0, Rent: 0, Marketing: 0, Maintenance: 0, Other: 0 };
    filteredExpenses.forEach(e => {
      const cat = e.category || "Other";
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(c => c.value > 0);
  }, [filteredExpenses]);

  const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

  // --------------------------------------------------------------
  // 7. EXPORT FUNCTIONS (always latest filtered data)
  // --------------------------------------------------------------
  const exportCSV = () => {
    const headers = "Type,Date,Description,Base Pay,Revenue,Amount,Category/Customer\n";
    const rows = [
      ...confirmedInRange.map(b =>
        `Booking,${format(new Date(b.date), "yyyy-MM-dd")},${b.customerName || ""},${b.basePay || 0},${b.totalRevenue || 0},,${b.category || ""}`
      ),
      ...filteredExpenses.map(e =>
        `Expense,${format(new Date(e.date), "yyyy-MM-dd")},${e.description || ""},,,-${e.amount},${e.category || "Other"}`
      ),
    ];
    const csv = headers + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, `report-${format(start, "yyyy-MM-dd")}-to-${format(end, "yyyy-MM-dd")}.csv`);
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`report-${format(start, "yyyy-MM-dd")}-to-${format(end, "yyyy-MM-dd")}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    }
  };

  // --------------------------------------------------------------
  // 8. PERFORMANCE METRICS (live)
  // --------------------------------------------------------------
  const performanceMetrics = useMemo(() => {
    const avgNetProfitPerBooking = bookingCount ? (bookingProfit / bookingCount).toFixed(0) : 0;
    const avgCommissionPerBooking = bookingCount
      ? (confirmedInRange.reduce((s, b) => s + (Number(b.commissionAmount) || 0), 0) / bookingCount).toFixed(0)
      : 0;

    return [
      { label: "Avg Net Profit/Booking", value: `₹${avgNetProfitPerBooking}`, icon: TrendingUp },
      { label: "Avg Commission/Booking", value: `₹${avgCommissionPerBooking}`, icon: IndianRupee },
      { label: "Profit Margin", value: `${profitMargin}%`, icon: Target },
    ];
  }, [confirmedInRange, bookingProfit, bookingCount, profitMargin]);

  // --------------------------------------------------------------
  // 9. RENDER
  // --------------------------------------------------------------
  return (
    <DashboardLayout>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-slate-50 via-white to-indigo-50"}`}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

          {/* HEADER */}
          <motion.header
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-3xl p-8 shadow-2xl text-white ${
              darkMode
                ? "bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900"
                : "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
            }`}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-20 -left-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-10 h-10 text-white/90" />
                  <h1 className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-pink-100 animate-gradient-x">
                    Professional Reports
                  </h1>
                </div>
                <p className="text-lg text-white/90">
                  {format(start, "MMM d")} – {format(end, "MMM d, yyyy")}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Users size={16} /> {bookingCount} confirmed bookings
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <IndianRupee size={16} /> ₹{totalRevenue.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Live</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={exportCSV} className="flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition">
                  <Download size={18} /> CSV
                </button>
                <button onClick={exportPDF} className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-600 font-semibold rounded-xl shadow-md hover:shadow-lg transition">
                  <FileDown size={18} /> PDF
                </button>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition"
                >
                  {darkMode ? <Sun size={18} className="text-yellow-300" /> : <Moon size={18} />}
                </button>
              </div>
            </div>
          </motion.header>

          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 flex gap-3 flex-wrap items-center">
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className={`px-5 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 shadow-sm transition ${
                  darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white/80 border-gray-200"
                }`}
              >
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="last3Months">Last 3 Months</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateRange === "custom" && (
                <div className="flex gap-2">
                  <DatePicker
                    selected={customStart}
                    onChange={setCustomStart}
                    selectsStart
                    startDate={customStart}
                    endDate={customEnd}
                    placeholderText="Start"
                    className={`px-4 py-2 rounded-lg border text-sm ${
                      darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"
                    }`}
                  />
                  <DatePicker
                    selected={customEnd}
                    onChange={setCustomEnd}
                    selectsEnd
                    startDate={customStart}
                    endDate={customEnd}
                    minDate={customStart}
                    placeholderText="End"
                    className={`px-4 py-2 rounded-lg border text-sm ${
                      darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"
                    }`}
                  />
                </div>
              )}
            </div>

            <div className={`flex p-1 rounded-xl ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              {REPORT_TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setReportTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      reportTab === tab.id
                        ? "bg-white shadow-md text-indigo-600"
                        : darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN CONTENT (live) */}
          <div ref={reportRef} className="space-y-8">

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {[
                { label: "Revenue", value: totalRevenue, growth: revenueGrowth, icon: IndianRupee, color: "indigo" },
                { label: "Expenses", value: totalExpense, icon: ShoppingCart, color: "rose" },
                { label: "Net Profit", value: netProfit, margin: profitMargin, icon: Target, color: netProfit >= 0 ? "emerald" : "red" },
                { label: "Confirmed", value: bookingCount, icon: Users, color: "blue" },
                { label: "Avg Booking", value: avgBooking, icon: IndianRupee, color: "amber" },
              ].map((kpi, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className={`p-6 rounded-2xl shadow-xl text-white bg-gradient-to-br from-${kpi.color}-500 to-${kpi.color}-600`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">{kpi.label}</p>
                      <p className="text-2xl font-bold mt-1">₹{Number(kpi.value).toLocaleString()}</p>
                      {kpi.growth !== undefined && (
                        <p className="text-xs mt-1 flex items-center gap-1">
                          {kpi.growth > 0 ? <ArrowUpRight size={14} className="text-emerald-300" /> : <ArrowDownRight size={14} className="text-rose-300" />}
                          <span className={kpi.growth > 0 ? "text-emerald-300" : "text-rose-300"}>{Math.abs(kpi.growth)}%</span>
                        </p>
                      )}
                      {kpi.margin !== undefined && <p className="text-xs mt-1">{kpi.margin}% margin</p>}
                    </div>
                    <kpi.icon size={28} className="opacity-80" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* TAB CONTENT */}
            <AnimatePresence mode="wait">
              {reportTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                        <Activity size={20} className="text-indigo-600 dark:text-indigo-400" /> Daily Revenue
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={v => `₹${v}`} />
                          <Bar dataKey="revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className={`p-6 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                        <PieChart size={20} className="text-indigo-600 dark:text-indigo-400" /> Profit Margin
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{ value: Math.max(0, profitMargin) }]}>
                          <RadialBar dataKey="value" fill="#10b981" background />
                          <Tooltip />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <p className="text-center mt-4 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{profitMargin}%</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {reportTab === "revenue" && (
                <motion.div key="revenue" className={`p-6 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Revenue Trend</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#c4b5fd" />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {reportTab === "expenses" && (
                <motion.div key="expenses" className={`p-6 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Expense Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={expenseByCategory}
                        cx="50%" cy="50%"
                        innerRadius={70} outerRadius={110}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {expenseByCategory.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {reportTab === "customers" && (
                <motion.div key="customers" className="space-y-4">
                  {topCustomers.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400">No confirmed customers</p>
                  ) : (
                    topCustomers.map((c, i) => (
                      <div key={i} className={`p-5 rounded-xl shadow-md flex items-center justify-between ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{c.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">₹{c.amount.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-600 dark:text-indigo-400">
                            {totalRevenue > 0 ? (c.amount / totalRevenue * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {reportTab === "performance" && (
                <motion.div key="performance" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {performanceMetrics.map((m, i) => (
                    <div key={i} className="bg-gradient-to-br from-violet-500 to-purple-600 p-6 rounded-2xl text-white shadow-xl">
                      <m.icon size={32} />
                      <p className="mt-3 text-sm opacity-90">{m.label}</p>
                      <p className="text-3xl font-bold">{m.value}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

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
          animation: gradient-x 8s ease infinite;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default Reports;