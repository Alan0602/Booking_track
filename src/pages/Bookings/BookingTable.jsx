// src/components/BookingTable.jsx
import { useMemo } from "react";
import StatusBadge from "../../components/StatusBadge";
import { format } from "date-fns";
import {
  Plane,
  Bus,          // <-- removed duplicate import
  Train,
  Car,
  Hotel,
  CheckCircle,
  XCircle,
  Phone,
  Globe,
  IndianRupee,
  Package,
  Pencil,
  History,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";

const platformLabels = {
  Alhind: "AlHind",
  Akbar: "Akbar",
  Direct: "Direct",
};

const categoryIcons = {
  flight: Plane,
  bus: Bus,          // <-- Bus is still available from lucide-react
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

const BookingTable = ({
  bookings = [],
  onUpdateStatus,
  onRemove,
  onEdit,
  onHistory,
  darkMode = false,
}) => {
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [bookings]);

  const fmt = (num) => Number(num || 0).toFixed(2);

  // Proper delete with confirmation + toast
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this booking? This cannot be undone.")) {
      onRemove(id);
      toast.success("Booking deleted successfully");
    }
  };

  return (
    <div
      className={`overflow-x-auto rounded-xl border ${
        darkMode ? "border-gray-700" : "border-gray-200"
      } shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}
    >
      <table className="min-w-full">
        <thead
          className={`${
            darkMode ? "bg-gray-900 text-gray-400" : "bg-gray-100 text-gray-700"
          } text-xs uppercase tracking-wider`}
        >
          <tr>
            <th className="py-3 px-4 text-left">#</th>
            <th className="py-3 px-4 text-left">Customer</th>
            <th className="py-3 px-4 text-left">Contact</th>
            <th className="py-3 px-4 text-left">Category</th>
            <th className="py-3 px-4 text-left">Platform</th>
            <th className="py-3 px-4 text-left">Date</th>
            <th className="py-3 px-4 text-left">Base Pay</th>
            <th className="py-3 px-4 text-left">Commission</th>
            <th className="py-3 px-4 text-left">Markup</th>
            <th className="py-3 px-4 text-left">Net Profit</th>
            <th className="py-3 px-4 text-left">Revenue</th>
            <th className="py-3 px-4 text-left">Status</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>

        <tbody
          className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}
        >
          {sortedBookings.length === 0 ? (
            <tr>
              <td
                colSpan={13}
                className={`text-center py-16 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-20 h-20 rounded-full ${
                      darkMode ? "bg-gray-700" : "bg-gray-50"
                    } flex items-center justify-center mb-4`}
                  >
                    <Package
                      size={40}
                      className={darkMode ? "text-gray-500" : "text-gray-400"}
                    />
                  </div>
                  <p className="text-lg font-medium">No bookings available.</p>
                </div>
              </td>
            </tr>
          ) : (
            sortedBookings.map((booking, idx) => {
              const Icon = categoryIcons[booking.category] || Plane;
              const catColor =
                categoryColors[booking.category] ||
                "bg-gray-100 text-gray-700";
              const isConfirmed = booking.status === "confirmed";

              return (
                <tr
                  key={booking.id}
                  className={`hover:${
                    darkMode ? "bg-gray-700" : "bg-gray-50"
                  } transition`}
                >
                  <td
                    className={`py-3 px-4 text-sm font-medium ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {idx + 1}
                  </td>

                  <td
                    className={`py-3 px-4 font-medium ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {booking.customerName || "—"}
                  </td>

                  <td
                    className={`py-3 px-4 text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Phone
                        size={14}
                        className={darkMode ? "text-gray-500" : "text-gray-400"}
                      />
                      <span>{booking.contactNumber || "—"}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${catColor}`}
                    >
                      <Icon size={14} />
                      {booking.category
                        ? booking.category.charAt(0).toUpperCase() +
                          booking.category.slice(1)
                        : "N/A"}
                    </div>
                  </td>

                  <td
                    className={`py-3 px-4 text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Globe
                        size={14}
                        className={darkMode ? "text-gray-500" : "text-gray-400"}
                      />
                      <span>
                        {platformLabels[booking.platform] ||
                          booking.platform ||
                          "—"}
                      </span>
                    </div>
                  </td>

                  <td
                    className={`py-3 px-4 text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {booking.date
                      ? format(new Date(booking.date), "MMM d, yyyy")
                      : "—"}
                  </td>

                  <td
                    className={`py-3 px-4 text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <IndianRupee
                        size={14}
                        className={darkMode ? "text-gray-500" : "text-gray-400"}
                      />
                      ₹{fmt(booking.basePay)}
                    </div>
                  </td>

                  <td
                    className={`py-3 px-4 text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <IndianRupee
                        size={14}
                        className={darkMode ? "text-gray-500" : "text-gray-400"}
                      />
                      ₹{fmt(booking.commissionAmount)}
                    </div>
                  </td>

                  <td
                    className={`py-3 px-4 text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <IndianRupee
                        size={14}
                        className={darkMode ? "text-gray-500" : "text-gray-400"}
                      />
                      ₹{fmt(booking.markupAmount)}
                    </div>
                  </td>

                  <td
                    className={`py-3 px-4 text-sm font-semibold ${
                      darkMode ? "text-emerald-400" : "text-green-700"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <IndianRupee
                        size={14}
                        className={
                          darkMode ? "text-emerald-400" : "text-green-700"
                        }
                      />
                      ₹{fmt(booking.netProfit)}
                    </div>
                  </td>

                  <td
                    className={`py-3 px-4 text-sm font-semibold ${
                      darkMode ? "text-emerald-400" : "text-green-700"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <IndianRupee
                        size={15}
                        className={
                          darkMode ? "text-emerald-400" : "text-green-700"
                        }
                      />
                      ₹{fmt(booking.totalRevenue)}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <StatusBadge
                      status={booking.status || "pending"}
                      darkMode={darkMode}
                    />
                  </td>

                  {/* ---------- ACTIONS ---------- */}
                  <td className="py-3 px-4 text-right space-x-1.5">
                    {/* Confirm / Unconfirm */}
                    <button
                      onClick={() =>
                        onUpdateStatus(booking.id, booking.status)
                      }
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition font-medium ${
                        isConfirmed
                          ? darkMode
                            ? "bg-amber-900/50 text-amber-400 hover:bg-amber-900/70"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          : darkMode
                          ? "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/70"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                      title={isConfirmed ? "Mark as Pending" : "Mark as Confirmed"}
                    >
                      {isConfirmed ? (
                        <>
                          <XCircle size={15} />
                          Unconfirm
                        </>
                      ) : (
                        <>
                          <CheckCircle size={15} />
                          Confirm
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onEdit(booking.id)}
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition font-medium ${
                        darkMode
                          ? "bg-blue-900/50 text-blue-400 hover:bg-blue-900/70"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                      title="Edit booking"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      onClick={() => onHistory(booking.id)}
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition font-medium ${
                        darkMode
                          ? "bg-purple-900/50 text-purple-400 hover:bg-purple-900/70"
                          : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                      }`}
                      title="View history"
                    >
                      <History size={15} />
                      History
                    </button>

                    <button
                      onClick={() => handleDelete(booking.id)}
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition font-medium ${
                        darkMode
                          ? "bg-red-900/50 text-red-400 hover:bg-red-900/70"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                      title="Delete booking permanently"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BookingTable;