// // src/pages/Dashboard.jsx
// import { useState, useMemo } from "react";
// import DashboardLayout from "../components/DashboardLayout";
// import FundsChart from "../components/FundsChart";
// import { useBooking, STATUS } from "../context/BookingContext";
// import { useFunds } from "../context/FundsContext";
// import { useExpense } from "../context/ExpenseContext";
// import { useAuth } from "../context/AuthContext";
// import {
//   TrendingUp, Calendar, DollarSign, Activity,
//   Download, Search, Clock, UserCheck, FileText,
//   ArrowUpRight, ArrowDownRight, Receipt, AlertTriangle,
//   Moon, Sun, IndianRupee
// } from "lucide-react";
// import { motion } from "framer-motion";
// import {
//   format,
//   startOfMonth,
//   endOfMonth,
//   subMonths,
//   isWithinInterval,
// } from "date-fns";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   Legend,
//   ReferenceLine,
//   BarChart,
//   Bar,
//   Cell
// } from 'recharts';

// const Dashboard = () => {
//   const { bookings = [], getStats, isLoading: bookingsLoading } = useBooking();
//   const { totals = {} } = useFunds();
//   const { expenses = [] } = useExpense();
//   const { user } = useAuth();

//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [darkMode, setDarkMode] = useState(false);

//   /* ────────────────────── DATE PERIODS ────────────────────── */
//   const currentPeriod = useMemo(() => {
//     const now = new Date('2025-11-07');
//     return { start: startOfMonth(now), end: endOfMonth(now) };
//   }, []);

//   const previousPeriod = useMemo(() => {
//     const prev = subMonths(new Date('2025-11-07'), 1);
//     return { start: startOfMonth(prev), end: endOfMonth(prev) };
//   }, []);

//   const filterByRange = (items, range) =>
//     items.filter(item => {
//       const d = new Date(item.date);
//       return isWithinInterval(d, { start: range.start, end: range.end });
//     });

//   const currentBookings   = filterByRange(bookings, currentPeriod);
//   const previousBookings  = filterByRange(bookings, previousPeriod);
//   const currentExpenses   = filterByRange(expenses, currentPeriod);
//   const previousExpenses  = filterByRange(expenses, previousPeriod);

//   const currentExpenseTotal = currentExpenses.reduce((s, e) => s + e.amount, 0);
//   const prevExpenseTotal    = previousExpenses.reduce((s, e) => s + e.amount, 0);

//   /* ────────────────────── LIVE STATS FROM CONTEXT ────────────────────── */
//   const liveStats = useMemo(() => getStats(), [getStats]);

//   const currentConfirmedBookings = currentBookings.filter(b => b.status === STATUS.CONFIRMED);
//   const previousConfirmedBookings = previousBookings.filter(b => b.status === STATUS.CONFIRMED);

//   const currentStats = useMemo(() => {
//     const totalRevenue = currentConfirmedBookings.reduce((s, b) => s + (b.totalRevenue || 0), 0);
//     const totalBaseAmount = currentConfirmedBookings.reduce((s, b) => s + (b.basePay || 0), 0);
//     const totalNetProfit = currentConfirmedBookings.reduce((s, b) => s + (b.netProfit || 0), 0);
//     const count = currentConfirmedBookings.length;
//     const avgRevenue = count > 0 ? totalRevenue / count : 0;
//     const highestRevenue = currentConfirmedBookings.reduce((m, b) => Math.max(m, b.totalRevenue || 0), 0);
//     return { totalRevenue, totalBaseAmount, totalNetProfit, count, avgRevenue: Math.round(avgRevenue), highestRevenue };
//   }, [currentConfirmedBookings]);

//   const previousStats = useMemo(() => {
//     const totalRevenue = previousConfirmedBookings.reduce((s, b) => s + (b.totalRevenue || 0), 0);
//     const totalBaseAmount = previousConfirmedBookings.reduce((s, b) => s + (b.basePay || 0), 0);
//     const totalNetProfit = previousConfirmedBookings.reduce((s, b) => s + (b.netProfit || 0), 0);
//     const count = previousConfirmedBookings.length;
//     const avgRevenue = count > 0 ? totalRevenue / count : 0;
//     const highestRevenue = previousConfirmedBookings.reduce((m, b) => Math.max(m, b.totalRevenue || 0), 0);
//     return { totalRevenue, totalBaseAmount, totalNetProfit, count, avgRevenue: Math.round(avgRevenue), highestRevenue };
//   }, [previousConfirmedBookings]);

//   const currentNetProfit = currentStats.totalNetProfit - currentExpenseTotal;
//   const previousNetProfit = previousStats.totalNetProfit - prevExpenseTotal;

//   /* ────────────────────── TREND CALCULATOR ────────────────────── */
//   const calcTrend = (cur, prev) => {
//     if (prev === 0) return { value: "N/A", change: 0, isPositive: false };
//     const change = ((cur - prev) / prev) * 100;
//     const isPositive = change >= 0;
//     return {
//       value: `${isPositive ? "+" : ""}${change.toFixed(1)}%`,
//       change: Math.abs(change),
//       isPositive,
//     };
//   };

//   const trends = {
//     bookings: calcTrend(currentStats.count, previousStats.count),
//     revenue: calcTrend(currentStats.totalRevenue, previousStats.totalRevenue),
//     avgBooking: calcTrend(currentStats.avgRevenue, previousStats.avgRevenue),
//     highest: currentStats.highestRevenue > previousStats.highestRevenue
//       ? { value: "New Record", change: 100, isPositive: true }
//       : { value: "–", change: 0, isPositive: false },
//     expenses: calcTrend(currentExpenseTotal, prevExpenseTotal),
//     profit: calcTrend(currentNetProfit, previousNetProfit),
//   };

//   const stats = [
//     { title: "Total Bookings", value: currentStats.count, trend: trends.bookings, icon: Calendar, gradient: "from-violet-500 to-purple-600" },
//     { title: "Total Revenue", value: `₹${currentStats.totalRevenue.toLocaleString()}`, trend: trends.revenue, icon: IndianRupee, gradient: "from-emerald-500 to-teal-600" },
//     { title: "Base Amount Total", value: `₹${currentStats.totalBaseAmount.toLocaleString()}`, trend: null, icon: IndianRupee, gradient: "from-cyan-500 to-blue-600" },
//     { title: "Avg Revenue", value: `₹${currentStats.avgRevenue.toLocaleString()}`, trend: trends.avgBooking, icon: TrendingUp, gradient: "from-cyan-500 to-blue-600" },
//     { title: "Highest Revenue", value: `₹${currentStats.highestRevenue.toLocaleString()}`, trend: trends.highest, icon: AlertTriangle, gradient: "from-amber-500 to-orange-600" },
//     { title: "Total Expenses", value: `₹${currentExpenseTotal.toLocaleString()}`, trend: trends.expenses, icon: Receipt, gradient: "from-rose-500 to-red-600" },
//     { title: "Net Profit", value: `₹${currentNetProfit.toLocaleString()}`, trend: trends.profit, icon: Activity, gradient: (currentNetProfit >= 0 ? "from-lime-500 to-green-600" : "from-orange-500 to-red-600") },
//   ];

//   /* ────────────────────── FILTERED BOOKINGS ────────────────────── */
//   const filteredBookings = useMemo(() => {
//     return bookings.filter(b => {
//       const matchesSearch =
//         b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         b.id?.toLowerCase().includes(searchTerm.toLowerCase());
//       const matchesFilter = filterStatus === "all" || (b.status?.toLowerCase() === filterStatus.toLowerCase());
//       return matchesSearch && matchesFilter;
//     });
//   }, [bookings, searchTerm, filterStatus]);

//   const recentBookings = filteredBookings.slice(0, 5);

//   /* ────────────────────── TOP SOURCES ────────────────────── */
//   const topSources = useMemo(() => {
//     const grouped = bookings.reduce((acc, b) => {
//       const name = b.customerName || 'Unknown';
//       if (!acc[name]) acc[name] = { name, bookings: 0, revenue: 0 };
//       acc[name].bookings += 1;
//       acc[name].revenue += (b.totalRevenue || 0);
//       return acc;
//     }, {});
//     const sorted = Object.values(grouped)
//       .sort((a, b) => b.revenue - a.revenue)
//       .slice(0, 5);
//     const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];
//     return sorted.map((s, i) => ({ ...s, fill: colors[i] || '#6366f1' }));
//   }, [bookings]);

//   /* ────────────────────── CHART DATA (12 MONTHS) ────────────────────── */
//   const chartData = useMemo(() => {
//     const months = [];
//     const now = new Date('2025-11-07');
//     for (let i = 11; i >= 0; i--) {
//       const date = subMonths(now, i);
//       months.push({
//         month: format(date, 'MMM yy'),
//         revenue: 0,
//         netProfit: 0,
//         expense: 0
//       });
//     }

//     bookings.forEach(b => {
//       if (b.date && b.status === STATUS.CONFIRMED) {
//         const d = new Date(b.date);
//         const monthKey = format(d, 'MMM yy');
//         const idx = months.findIndex(m => m.month === monthKey);
//         if (idx !== -1) {
//           months[idx].revenue += (b.totalRevenue || 0);
//           months[idx].netProfit += (b.netProfit || 0);
//         }
//       }
//     });

//     expenses.forEach(e => {
//       if (e.date) {
//         const d = new Date(e.date);
//         const monthKey = format(d, 'MMM yy');
//         const idx = months.findIndex(m => m.month === monthKey);
//         if (idx !== -1) {
//           months[idx].expense += (e.amount || 0);
//         }
//       }
//     });

//     return months.map(m => ({
//       month: m.month,
//       revenue: m.revenue,
//       expense: -m.expense,
//       profit: m.netProfit - m.expense
//     }));
//   }, [bookings, expenses]);

//   const gridStroke = darkMode ? "#374151" : "#f1f5f9";
//   const refStroke = darkMode ? "#6b7280" : "#9ca3af";

//   /* ────────────────────── RENDER ────────────────────── */
//   return (
//     <DashboardLayout>
//       <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-slate-50 via-white to-indigo-50"}`}>
//         <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

//           {/* HEADER */}
//           <motion.header
//             initial={{ opacity: 0, y: -30 }}
//             animate={{ opacity: 1, y: 0 }}
//             className={`relative overflow-hidden rounded-3xl p-8 shadow-2xl text-white ${
//               darkMode
//                 ? "bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900"
//                 : "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700"
//             }`}
//           >
//             <div className="absolute inset-0 opacity-20">
//               <div className="absolute -top-20 -left-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
//               <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
//             </div>

//             <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
//               <div className="space-y-3">
//                 <div className="flex items-center gap-3">
//                   <Activity className="w-10 h-10 text-white/90" />
//                   <h1 className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100 animate-gradient-x">
//                     Welcome back, {user?.name?.replace("Compass ", "") || "Admin"}
//                   </h1>
//                 </div>
//                 <p className="text-lg text-white/90">Live financial & booking insights</p>
//                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full w-fit">
//                   <div className="flex items-center gap-2">
//                     <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
//                     <span>Live • {format(new Date('2025-11-07'), "h:mm a")}</span>
//                   </div>
//                   <div className="text-white/80">
//                     Net Profit: <strong>₹{currentNetProfit.toLocaleString()}</strong>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex gap-3">
//                 <button className="group relative inline-flex items-center gap-3 px-6 py-3.5 bg-white text-indigo-600 font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
//                   <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-50 transition-opacity"></span>
//                   <Download size={22} className="relative z-10" />
//                   <span className="relative z-10">Export Report</span>
//                 </button>

//                 <button
//                   onClick={() => setDarkMode(!darkMode)}
//                   className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition"
//                 >
//                   {darkMode ? <Sun size={18} /> : <Moon size={18} />}
//                 </button>
//               </div>
//             </div>
//           </motion.header>

//           {/* STATS CARDS */}
//           <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-5">
//             {stats.map((stat, i) => (
//               <motion.div
//                 key={stat.title}
//                 initial={{ opacity: 0, scale: 0.9 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{ delay: i * 0.1 }}
//                 whileHover={{ y: -8, scale: 1.03 }}
//                 className="group relative"
//               >
//                 <div className={`relative overflow-hidden rounded-2xl p-6 shadow-xl border ${
//                   darkMode
//                     ? "bg-gray-800 border-gray-700 text-white"
//                     : "bg-white/80 border-gray-100"
//                 } hover:shadow-2xl transition-all duration-300`}>
//                   <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

//                   <div className="flex justify-between items-start mb-3">
//                     <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-md`}>
//                       <stat.icon size={22} />
//                     </div>
//                     {stat.trend && (
//                       <div className="flex items-center gap-1 text-xs font-bold">
//                         {stat.trend.value === "New Record" ? (
//                           <AlertTriangle size={14} className="text-amber-600" />
//                         ) : stat.trend.value === "–" || stat.trend.value === "N/A" ? (
//                           <span className={darkMode ? "text-gray-400" : "text-gray-500"}>–</span>
//                         ) : stat.trend.isPositive ? (
//                           <ArrowUpRight size={14} className="text-emerald-600" />
//                         ) : (
//                           <ArrowDownRight size={14} className="text-rose-600" />
//                         )}
//                         <span className={
//                           stat.trend.value === "New Record" ? "text-amber-600" :
//                           stat.trend.value === "–" || stat.trend.value === "N/A"
//                             ? darkMode ? "text-gray-400" : "text-gray-500"
//                             : stat.trend.isPositive ? "text-emerald-600" : "text-rose-600"
//                         }>
//                           {stat.trend.value}
//                         </span>
//                       </div>
//                     )}
//                   </div>

//                   <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{stat.title}</p>
//                   <p className={`text-2xl font-bold mt-1 ${darkMode ? "text-white" : "text-gray-900"}`}>{stat.value}</p>

//                   {stat.trend && stat.trend.change > 0 && (
//                     <div className="mt-4">
//                       <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
//                         <motion.div
//                           initial={{ width: 0 }}
//                           animate={{ width: `${Math.min(stat.trend.change, 100)}%` }}
//                           transition={{ duration: 1, delay: 0.3 }}
//                           className={`h-full rounded-full ${
//                             stat.trend.isPositive
//                               ? "bg-gradient-to-r from-emerald-500 to-teal-500"
//                               : "bg-gradient-to-r from-rose-500 to-red-500"
//                           }`}
//                         />
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </motion.div>
//             ))}
//           </div>

//           {/* CHART + RECENT ACTIVITY */}
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Chart */}
//             <motion.div
//               initial={{ opacity: 0, y: 40 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.4 }}
//               className={`lg:col-span-2 rounded-2xl shadow-xl overflow-hidden ${
//                 darkMode ? "bg-gray-800" : "bg-white/80"
//               } border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
//             >
//               <div className={`p-6 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
//                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//                   <div>
//                     <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Revenue Trend</h2>
//                     <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Revenue (+), Expenses (-) & Net Profit Over Time</p>
//                   </div>
//                   <select className={`px-4 py-2 text-sm rounded-xl border ${
//                     darkMode
//                       ? "bg-gray-700 border-gray-600 text-white"
//                       : "bg-white border-gray-200"
//                   } focus:ring-2 focus:ring-indigo-500`}>
//                     <option>Last 12 months</option>
//                     <option>Last 6 months</option>
//                     <option>Last 3 months</option>
//                   </select>
//                 </div>
//               </div>
//               <div className="p-6">
//                 <div className="h-80">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
//                       <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
//                       <XAxis dataKey="month" tick={{ fontSize: 12, fill: darkMode ? "#9ca3af" : "#64748b" }} />
//                       <YAxis tick={{ fontSize: 12, fill: darkMode ? "#9ca3af" : "#64748b" }} allowDecimals={false} />
//                       <ReferenceLine y={0} stroke={refStroke} strokeDasharray="3 3" />
//                       <Tooltip
//                         formatter={(value, name) => {
//                           const label = name === 'revenue' ? 'Revenue' : name === 'expense' ? 'Expenses' : 'Net Profit';
//                           const sign = name === 'revenue' ? '' : name === 'profit' ? '' : '-';
//                           return [`₹${Math.abs(value).toLocaleString()}`, `${sign}${label}`];
//                         }}
//                         contentStyle={{
//                           backgroundColor: darkMode ? "#1f2937" : "#f8fafc",
//                           border: `1px solid ${darkMode ? "#374151" : "#e2e8f0"}`,
//                           borderRadius: "8px"
//                         }}
//                         labelStyle={{ color: darkMode ? "#ffffff" : "#374151" }}
//                       />
//                       <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: darkMode ? "#9ca3af" : "#64748b" }} />
//                       <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Revenue" dot={{ fill: "#10b981", r: 4 }} activeDot={{ r: 6 }} />
//                       <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} name="Expenses" dot={{ fill: "#ef4444", r: 4 }} activeDot={{ r: 6 }} />
//                       <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="Net Profit" strokeDasharray="5 5" dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 6 }} />
//                     </LineChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>
//             </motion.div>

//             {/* Recent Activity */}
//             <motion.div
//               initial={{ opacity: 0, x: 40 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ delay: 0.5 }}
//               className={`rounded-2xl shadow-xl p-6 ${
//                 darkMode ? "bg-gray-800" : "bg-white/80"
//               } border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
//             >
//               <h3 className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>Recent Activity</h3>
//               <div className="space-y-3 max-h-80 overflow-y-auto">
//                 {recentBookings.length > 0 ? (
//                   recentBookings.map(b => {
//                     const isHighValue = b.totalRevenue >= 50000;
//                     return (
//                       <div key={b.id} className={`flex items-center gap-3 p-3 rounded-xl hover:${darkMode ? "bg-gray-700" : "bg-gray-50"} transition`}>
//                         <div className={`p-2 rounded-full ${b.status === STATUS.CONFIRMED ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
//                           {b.status === STATUS.CONFIRMED ? <UserCheck size={16} /> : <Clock size={16} />}
//                         </div>
//                         <div className="flex-1">
//                           <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{b.customerName}</p>
//                           <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>#{b.id}</p>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           {isHighValue && (
//                             <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">HIGH</span>
//                           )}
//                           <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>₹{b.totalRevenue}</p>
//                         </div>
//                       </div>
//                     );
//                   })
//                 ) : (
//                   <p className={`text-sm text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No recent bookings</p>
//                 )}
//               </div>
//             </motion.div>
//           </div>

//           {/* BOTTOM ROW */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

//             {/* Recent Bookings Table */}
//             <motion.div
//               initial={{ opacity: 0, y: 40 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.6 }}
//               className={`rounded-2xl shadow-xl overflow-hidden ${
//                 darkMode ? "bg-gray-800" : "bg-white/80"
//               } border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
//             >
//               <div className={`p-6 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
//                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//                   <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Recent Bookings</h3>
//                   <div className="flex gap-3 w-full sm:w-auto">
//                     <div className="relative flex-1 sm:flex-initial">
//                       <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
//                       <input
//                         type="text"
//                         placeholder="Search bookings..."
//                         value={searchTerm}
//                         onChange={e => setSearchTerm(e.target.value)}
//                         className={`pl-10 pr-4 py-2.5 w-full text-sm rounded-xl border ${
//                           darkMode
//                             ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
//                             : "bg-white border-gray-200"
//                         } focus:ring-2 focus:ring-indigo-500 transition`}
//                       />
//                     </div>
//                     <select
//                       value={filterStatus}
//                       onChange={e => setFilterStatus(e.target.value)}
//                       className={`px-4 py-2.5 text-sm rounded-xl border ${
//                         darkMode
//                           ? "bg-gray-700 border-gray-600 text-white"
//                           : "bg-white border-gray-200"
//                       }`}
//                     >
//                       <option value="all">All</option>
//                       <option value="confirmed">Confirmed</option>
//                       <option value="pending">Pending</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
//                     <tr>
//                       {["ID","Customer","Date","Base Amount","Revenue","Status"].map(h => (
//                         <th key={h} className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? "text-gray-300" : "text-gray-500"}`}>{h}</th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-100"}`}>
//                     {bookingsLoading ? (
//                       Array(5).fill(0).map((_, i) => (
//                         <tr key={i}><td colSpan={6} className="px-6 py-4"><div className={`h-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded animate-pulse`} /></td></tr>
//                       ))
//                     ) : recentBookings.length > 0 ? (
//                       recentBookings.map(b => (
//                         <tr key={b.id} className={`hover:${darkMode ? "bg-gray-700" : "bg-gray-50"} transition`}>
//                           <td className="px-6 py-3 text-sm font-medium text-indigo-600">#{b.id}</td>
//                           <td className={`px-6 py-3 text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{b.customerName}</td>
//                           <td className={`px-6 py-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{format(new Date(b.date), "MMM d, yyyy")}</td>
//                           <td className={`px-6 py-3 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>₹{Number(b.basePay || 0).toLocaleString()}</td>
//                           <td className={`px-6 py-3 text-sm font-bold ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>₹{Number(b.totalRevenue || 0).toLocaleString()}</td>
//                           <td className="px-6 py-3">
//                             <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
//                               b.status === STATUS.CONFIRMED
//                                 ? "bg-emerald-100 text-emerald-800"
//                                 : "bg-amber-100 text-amber-800"
//                             }`}>
//                               {b.status.charAt(0).toUpperCase() + b.status.slice(1).toLowerCase()}
//                             </span>
//                           </td>
//                         </tr>
//                       ))
//                     ) : (
//                       <tr><td colSpan={6} className={`px-6 py-10 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No bookings found</td></tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </motion.div>

//             {/* Top Revenue Sources */}
//             <motion.div
//               initial={{ opacity: 0, y: 40 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.3 }}
//               className={`rounded-2xl shadow-xl p-6 ${
//                 darkMode ? "bg-gray-800" : "bg-white/80"
//               } border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
//             >
//               <div className="flex justify-between items-center mb-5">
//                 <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Top Revenue Sources</h3>
//                 <FileText size={22} className={darkMode ? "text-gray-400" : "text-gray-400"} />
//               </div>

//               <div className="h-64">
//                 {topSources.length > 0 ? (
//                   <ResponsiveContainer width="100%" height="100%">
//                     <BarChart data={topSources} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
//                       <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
//                       <XAxis type="number" hide />
//                       <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: darkMode ? "#9ca3af" : "#64748b" }} width={120} />
//                       <Tooltip
//                         formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']}
//                         contentStyle={{
//                           backgroundColor: darkMode ? "#1f2937" : "#f8fafc",
//                           border: `1px solid ${darkMode ? "#374151" : "#e2e8f0"}`,
//                           borderRadius: "8px"
//                         }}
//                       />
//                       <Bar dataKey="revenue" minWidth={100}>
//                         {topSources.map((_, i) => (
//                           <Cell key={`cell-${i}`} fill={_.fill} />
//                         ))}
//                       </Bar>
//                     </BarChart>
//                   </ResponsiveContainer>
//                 ) : (
//                   <div className="flex items-center justify-center h-full">
//                     <p className={`text-sm text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No data available</p>
//                   </div>
//                 )}
//               </div>

//               {topSources.length > 0 && (
//                 <div className="mt-4 space-y-2">
//                   {topSources.map((s, i) => (
//                     <div key={i} className="flex items-center justify-between text-xs">
//                       <div className="flex items-center gap-2">
//                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.fill }}></div>
//                         <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{s.name}</span>
//                       </div>
//                       <span className={darkMode ? "text-gray-400" : "text-gray-500"}>{s.bookings} bookings</span>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </motion.div>
//           </div>

//         </div>
//       </div>

//       <style jsx>{`
//         @keyframes gradient-x {
//           0%, 100% { background-position: 0% 50%; }
//           50% { background-position: 100% 50%; }
//         }
//         .animate-gradient-x {
//           background-size: 200% 200%;
//           animation: gradient-x 8s ease infinite;
//         }
//       `}</style>
//     </DashboardLayout>
//   );
// };

// export default Dashboard;


// src/pages/Dashboard.jsx
import { useState, useMemo ,useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import FundsChart from "../components/FundsChart";
import { useBooking, STATUS } from "../context/BookingContext";
import { useFunds } from "../context/FundsContext";
import { useExpense } from "../context/ExpenseContext";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp, Calendar, DollarSign, Activity,
  Download, Search, Clock, UserCheck, FileText,
  ArrowUpRight, ArrowDownRight, Receipt, AlertTriangle,
  Moon, Sun, IndianRupee
} from "lucide-react";
import { motion } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
} from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const Dashboard = () => {
  const { bookings = [], getStats, isLoading: bookingsLoading } = useBooking();
  const { totals = {} } = useFunds();
  const { expenses = [] } = useExpense();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [darkMode, setDarkMode] = useState(false);

  /* ────────────────────── DATE PERIODS ────────────────────── */
  const currentPeriod = useMemo(() => {
    const now = new Date('2025-11-07');
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }, []);

  const previousPeriod = useMemo(() => {
    const prev = subMonths(new Date('2025-11-07'), 1);
    return { start: startOfMonth(prev), end: endOfMonth(prev) };
  }, []);

  const filterByRange = (items, range) =>
    items.filter(item => {
      const d = new Date(item.date);
      return isWithinInterval(d, { start: range.start, end: range.end });
    });

  const currentBookings   = filterByRange(bookings, currentPeriod);
  const previousBookings  = filterByRange(bookings, previousPeriod);
  const currentExpenses   = filterByRange(expenses, currentPeriod);
  const previousExpenses  = filterByRange(expenses, previousPeriod);

  const currentExpenseTotal = currentExpenses.reduce((s, e) => s + e.amount, 0);
  const prevExpenseTotal    = previousExpenses.reduce((s, e) => s + e.amount, 0);

  /* ────────────────────── LIVE STATS FROM CONTEXT ────────────────────── */
  const liveStats = useMemo(() => getStats(), [getStats]);
   const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000); // updates every second
    return () => clearInterval(timer);
  }, []);


  const currentConfirmedBookings = currentBookings.filter(b => b.status === STATUS.CONFIRMED);
  const previousConfirmedBookings = previousBookings.filter(b => b.status === STATUS.CONFIRMED);

  const currentStats = useMemo(() => {
    const totalRevenue = currentConfirmedBookings.reduce((s, b) => s + (b.totalRevenue || 0), 0);
    const totalBaseAmount = currentConfirmedBookings.reduce((s, b) => s + (b.basePay || 0), 0);
    const totalNetProfit = currentConfirmedBookings.reduce((s, b) => s + (b.netProfit || 0), 0);
    const count = currentConfirmedBookings.length;
    const avgRevenue = count > 0 ? totalRevenue / count : 0;
    const highestRevenue = currentConfirmedBookings.reduce((m, b) => Math.max(m, b.totalRevenue || 0), 0);
    return { totalRevenue, totalBaseAmount, totalNetProfit, count, avgRevenue: Math.round(avgRevenue), highestRevenue };
  }, [currentConfirmedBookings]);

  const previousStats = useMemo(() => {
    const totalRevenue = previousConfirmedBookings.reduce((s, b) => s + (b.totalRevenue || 0), 0);
    const totalBaseAmount = previousConfirmedBookings.reduce((s, b) => s + (b.basePay || 0), 0);
    const totalNetProfit = previousConfirmedBookings.reduce((s, b) => s + (b.netProfit || 0), 0);
    const count = previousConfirmedBookings.length;
    const avgRevenue = count > 0 ? totalRevenue / count : 0;
    const highestRevenue = previousConfirmedBookings.reduce((m, b) => Math.max(m, b.totalRevenue || 0), 0);
    return { totalRevenue, totalBaseAmount, totalNetProfit, count, avgRevenue: Math.round(avgRevenue), highestRevenue };
  }, [previousConfirmedBookings]);

  const currentNetProfit = currentStats.totalNetProfit - currentExpenseTotal;
  const previousNetProfit = previousStats.totalNetProfit - prevExpenseTotal;

  /* ────────────────────── TREND CALCULATOR ────────────────────── */
  const calcTrend = (cur, prev) => {
    if (prev === 0) return { value: "N/A", change: 0, isPositive: false };
    const change = ((cur - prev) / prev) * 100;
    const isPositive = change >= 0;
    return {
      value: `${isPositive ? "+" : ""}${change.toFixed(1)}%`,
      change: Math.abs(change),
      isPositive,
    };
  };

  const trends = {
    bookings: calcTrend(currentStats.count, previousStats.count),
    revenue: calcTrend(currentStats.totalRevenue, previousStats.totalRevenue),
    avgBooking: calcTrend(currentStats.avgRevenue, previousStats.avgRevenue),
    highest: currentStats.highestRevenue > previousStats.highestRevenue
      ? { value: "New Record", change: 100, isPositive: true }
      : { value: "–", change: 0, isPositive: false },
    expenses: calcTrend(currentExpenseTotal, prevExpenseTotal),
    profit: calcTrend(currentNetProfit, previousNetProfit),
  };

  const stats = [
    { title: "Total Bookings", value: currentStats.count, trend: trends.bookings, icon: Calendar, gradient: "from-violet-500 to-purple-600" },
    { title: "Total Revenue", value: `₹${currentStats.totalRevenue.toLocaleString()}`, trend: trends.revenue, icon: IndianRupee, gradient: "from-emerald-500 to-teal-600" },
    { title: "Base Amount Total", value: `₹${currentStats.totalBaseAmount.toLocaleString()}`, trend: null, icon: IndianRupee, gradient: "from-cyan-500 to-blue-600" },
    { title: "Avg Revenue", value: `₹${currentStats.avgRevenue.toLocaleString()}`, trend: trends.avgBooking, icon: TrendingUp, gradient: "from-cyan-500 to-blue-600" },
    { title: "Highest Revenue", value: `₹${currentStats.highestRevenue.toLocaleString()}`, trend: trends.highest, icon: AlertTriangle, gradient: "from-amber-500 to-orange-600" },
   {
  title: "Total Expenses",
  value: new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(currentExpenseTotal),
  trend: trends.expenses,
  icon: IndianRupee, // ✅ Indian Rupee Icon
  gradient: "from-rose-500 to-red-600",
}
,
    { title: "Net Profit", value: `₹${currentNetProfit.toLocaleString()}`, trend: trends.profit, icon: Activity, gradient: (currentNetProfit >= 0 ? "from-lime-500 to-green-600" : "from-orange-500 to-red-600") },
  ];

  /* ────────────────────── FILTERED BOOKINGS ────────────────────── */
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch =
        b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === "all" || (b.status?.toLowerCase() === filterStatus.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  }, [bookings, searchTerm, filterStatus]);

  const recentBookings = filteredBookings.slice(0, 5);

  /* ────────────────────── TOP SOURCES ────────────────────── */
  const topSources = useMemo(() => {
    const grouped = bookings.reduce((acc, b) => {
      const name = b.customerName || 'Unknown';
      if (!acc[name]) acc[name] = { name, bookings: 0, revenue: 0 };
      acc[name].bookings += 1;
      acc[name].revenue += (b.totalRevenue || 0);
      return acc;
    }, {});
    const sorted = Object.values(grouped)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];
    return sorted.map((s, i) => ({ ...s, fill: colors[i] || '#6366f1' }));
  }, [bookings]);

  /* ────────────────────── CHART DATA (12 MONTHS) ────────────────────── */
  const chartData = useMemo(() => {
    const months = [];
    const now = new Date('2025-11-07');
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      months.push({
        month: format(date, 'MMM yy'),
        revenue: 0,
        netProfit: 0,
        expense: 0
      });
    }

    bookings.forEach(b => {
      if (b.date && b.status === STATUS.CONFIRMED) {
        const d = new Date(b.date);
        const monthKey = format(d, 'MMM yy');
        const idx = months.findIndex(m => m.month === monthKey);
        if (idx !== -1) {
          months[idx].revenue += (b.totalRevenue || 0);
          months[idx].netProfit += (b.netProfit || 0);
        }
      }
    });

    expenses.forEach(e => {
      if (e.date) {
        const d = new Date(e.date);
        const monthKey = format(d, 'MMM yy');
        const idx = months.findIndex(m => m.month === monthKey);
        if (idx !== -1) {
          months[idx].expense += (e.amount || 0);
        }
      }
    });

    return months.map(m => ({
      month: m.month,
      revenue: m.revenue,
      expense: -m.expense,
      profit: m.netProfit - m.expense
    }));
  }, [bookings, expenses]);

  const gridStroke = darkMode ? "#374151" : "#f1f5f9";
  const refStroke = darkMode ? "#6b7280" : "#9ca3af";

  /* ────────────────────── RENDER ────────────────────── */
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
                : "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700"
            }`}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-20 -left-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Activity className="w-10 h-10 text-white/90" />
                  <h1 className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100 animate-gradient-x">
                    Welcome back, {user?.name?.replace("Compass ", "") || "Admin"}
                  </h1>
                </div>
                <p className="text-lg text-white/90">Live financial & booking insights</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full w-fit">
                 <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      <span>Live • {format(time, "h:mm a")}</span>
    </div>
                  <div className="text-white/80">
                    Net Profit: <strong>₹{currentNetProfit.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="group relative inline-flex items-center gap-3 px-6 py-3.5 bg-white text-indigo-600 font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
                  <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-50 transition-opacity"></span>
                  <Download size={22} className="relative z-10" />
                  <span className="relative z-10">Export Report</span>
                </button>

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>
          </motion.header>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-5">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="group relative"
              >
                <div className={`relative overflow-hidden rounded-2xl p-6 shadow-xl border ${
                  darkMode
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-white/80 border-gray-100"
                } hover:shadow-2xl transition-all duration-300`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-md`}>
                      <stat.icon size={22} />
                    </div>
                    {stat.trend && (
                      <div className="flex items-center gap-1 text-xs font-bold">
                        {stat.trend.value === "New Record" ? (
                          <AlertTriangle size={14} className="text-amber-600" />
                        ) : stat.trend.value === "–" || stat.trend.value === "N/A" ? (
                          <span className={darkMode ? "text-gray-400" : "text-gray-500"}>–</span>
                        ) : stat.trend.isPositive ? (
                          <ArrowUpRight size={14} className="text-emerald-600" />
                        ) : (
                          <ArrowDownRight size={14} className="text-rose-600" />
                        )}
                        <span className={
                          stat.trend.value === "New Record" ? "text-amber-600" :
                          stat.trend.value === "–" || stat.trend.value === "N/A"
                            ? darkMode ? "text-gray-400" : "text-gray-500"
                            : stat.trend.isPositive ? "text-emerald-600" : "text-rose-600"
                        }>
                          {stat.trend.value}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{stat.title}</p>
                  <p className={`text-2xl font-bold mt-1 ${darkMode ? "text-white" : "text-gray-900"}`}>{stat.value}</p>

                  {stat.trend && stat.trend.change > 0 && (
                    <div className="mt-4">
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(stat.trend.change, 100)}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className={`h-full rounded-full ${
                            stat.trend.isPositive
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                              : "bg-gradient-to-r from-rose-500 to-red-500"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* CHART + RECENT ACTIVITY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`lg:col-span-2 rounded-2xl shadow-xl overflow-hidden ${
                darkMode ? "bg-gray-800" : "bg-white/80"
              } border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
            >
              <div className={`p-6 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Revenue Trend</h2>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Revenue (+), Expenses (-) & Net Profit Over Time</p>
                  </div>
                  <select className={`px-4 py-2 text-sm rounded-xl border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-200"
                  } focus:ring-2 focus:ring-indigo-500`}>
                    <option>Last 12 months</option>
                    <option>Last 6 months</option>
                    <option>Last 3 months</option>
                  </select>
                </div>
              </div>
              <div className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: darkMode ? "#9ca3af" : "#64748b" }} />
                      <YAxis tick={{ fontSize: 12, fill: darkMode ? "#9ca3af" : "#64748b" }} allowDecimals={false} />
                      <ReferenceLine y={0} stroke={refStroke} strokeDasharray="3 3" />
                      <Tooltip
                        formatter={(value, name) => {
                          const label = name === 'revenue' ? 'Revenue' : name === 'expense' ? 'Expenses' : 'Net Profit';
                          const sign = name === 'revenue' ? '' : name === 'profit' ? '' : '-';
                          return [`₹${Math.abs(value).toLocaleString()}`, `${sign}${label}`];
                        }}
                        contentStyle={{
                          backgroundColor: darkMode ? "#1f2937" : "#f8fafc",
                          border: `1px solid ${darkMode ? "#374151" : "#e2e8f0"}`,
                          borderRadius: "8px"
                        }}
                        labelStyle={{ color: darkMode ? "#ffffff" : "#374151" }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: darkMode ? "#9ca3af" : "#64748b" }} />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Revenue" dot={{ fill: "#10b981", r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} name="Expenses" dot={{ fill: "#ef4444", r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="Net Profit" strokeDasharray="5 5" dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className={`rounded-2xl shadow-xl p-6 ${
                darkMode ? "bg-gray-800" : "bg-white/80"
              } border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
            >
              <h3 className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>Recent Activity</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentBookings.length > 0 ? (
                  recentBookings.map(b => {
                    const isHighValue = b.totalRevenue >= 50000;
                    return (
                      <div key={b.id} className={`flex items-center gap-3 p-3 rounded-xl hover:${darkMode ? "bg-gray-700" : "bg-gray-50"} transition`}>
                        <div className={`p-2 rounded-full ${b.status === STATUS.CONFIRMED ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                          {b.status === STATUS.CONFIRMED ? <UserCheck size={16} /> : <Clock size={16} />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{b.customerName}</p>
                          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>#{b.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isHighValue && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">HIGH</span>
                          )}
                          <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>₹{b.totalRevenue}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className={`text-sm text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No recent bookings</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* BOTTOM ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent Bookings Table */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={`rounded-2xl shadow-xl overflow-hidden ${
                darkMode ? "bg-gray-800" : "bg-white/80"
              } border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
            >
              <div className={`p-6 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Recent Bookings</h3>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                      <input
                        type="text"
                        placeholder="Search bookings..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`pl-10 pr-4 py-2.5 w-full text-sm rounded-xl border ${
                          darkMode
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-200"
                        } focus:ring-2 focus:ring-indigo-500 transition`}
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className={`px-4 py-2.5 text-sm rounded-xl border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <option value="all">All</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      {["ID","Customer","Date","Base Amount","Revenue","Status"].map(h => (
                        <th key={h} className={`px-6 py-3 text-left text-xs font-medium uppercase ${darkMode ? "text-gray-300" : "text-gray-500"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-100"}`}>
                    {bookingsLoading ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i}><td colSpan={6} className="px-6 py-4"><div className={`h-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"} rounded animate-pulse`} /></td></tr>
                      ))
                    ) : recentBookings.length > 0 ? (
                      recentBookings.map(b => (
                        <tr key={b.id} className={`hover:${darkMode ? "bg-gray-700" : "bg-gray-50"} transition`}>
                          <td className="px-6 py-3 text-sm font-medium text-indigo-600">#{b.id}</td>
                          <td className={`px-6 py-3 text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{b.customerName}</td>
                          <td className={`px-6 py-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{format(new Date(b.date), "MMM d, yyyy")}</td>
                          <td className={`px-6 py-3 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>₹{Number(b.basePay || 0).toLocaleString()}</td>
                          <td className={`px-6 py-3 text-sm font-bold ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>₹{Number(b.totalRevenue || 0).toLocaleString()}</td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              b.status === STATUS.CONFIRMED
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {b.status.charAt(0).toUpperCase() + b.status.slice(1).toLowerCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className={`px-6 py-10 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No bookings found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Top Revenue Sources */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-2xl shadow-xl p-6 ${
                darkMode ? "bg-gray-800" : "bg-white/80"
              } border ${darkMode ? "border-gray-700" : "border-gray-100"}`}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Top Revenue Sources</h3>
                <FileText size={22} className={darkMode ? "text-gray-400" : "text-gray-400"} />
              </div>

              <div className="h-64">
                {topSources.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSources} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: darkMode ? "#9ca3af" : "#64748b" }} width={120} />
                      <Tooltip
                        formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']}
                        contentStyle={{
                          backgroundColor: darkMode ? "#1f2937" : "#f8fafc",
                          border: `1px solid ${darkMode ? "#374151" : "#e2e8f0"}`,
                          borderRadius: "8px"
                        }}
                      />
                      <Bar dataKey="revenue" minWidth={100}>
                        {topSources.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={_.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className={`text-sm text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No data available</p>
                  </div>
                )}
              </div>

              {topSources.length > 0 && (
                <div className="mt-4 space-y-2">
                  {topSources.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.fill }}></div>
                        <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{s.name}</span>
                      </div>
                      <span className={darkMode ? "text-gray-400" : "text-gray-500"}>{s.bookings} bookings</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
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

export default Dashboard;