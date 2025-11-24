// src/context/BookingContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import supabase from "../utils/supabase";
import { useAuth } from "./AuthContext";
import { useWallet } from "./WalletContext";

export const CATEGORY = {
  FLIGHT: "flight",
  BUS: "bus",
  TRAIN: "train",
  CAB: "cab",
  HOTEL: "hotel",
};

export const STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
};

const BookingContext = createContext(undefined);

export const BookingProvider = ({ children }) => {
  const { user } = useAuth();
  const { refreshWallets, refreshTransactions } = useWallet();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helpers: map camelCase ↔ snake_case
  const toRow = (raw) => {
    const base = Number(raw.basePay || 0);
    const comm = Number(raw.commissionAmount || 0);
    const mark = Number(raw.markupAmount || 0);
    const totalRevenue = parseFloat((base + comm + mark).toFixed(2));
    return {
      id: raw.id,
      customer_name: raw.customerName?.trim(),
      email: raw.email?.trim()?.toLowerCase(),
      contact_number: raw.contactNumber?.trim(),
      booking_date: raw.date ? new Date(raw.date).toISOString() : new Date().toISOString(),
      category: raw.category,
      platform: raw.platform || "Direct",
      status: raw.status || STATUS.PENDING,
      base_pay: base,
      commission_amount: comm,
      markup_amount: mark,
      total_revenue: totalRevenue,
      user_id: user?.id || null,
    };
  };

  const fromRow = (row) => ({
    id: row.id,
    customerName: row.customer_name,
    email: row.email,
    contactNumber: row.contact_number,
    date: row.booking_date,
    category: row.category,
    platform: row.platform,
    status: row.status,
    basePay: Number(row.base_pay || 0),
    commissionAmount: Number(row.commission_amount || 0),
    markupAmount: Number(row.markup_amount || 0),
    totalRevenue: Number(row.total_revenue || 0),
    netProfit: Number(row.net_profit ?? (row.platform === "Direct"
      ? Number(row.base_pay || 0) + Number(row.markup_amount || 0)
      : Number(row.commission_amount || 0) + Number(row.markup_amount || 0))),
    createdAt: row.created_at,
  });

  // Load all bookings from Supabase view (includes net_profit)
  useEffect(() => {
    const load = async () => {
      if (!user) {
        setBookings([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const { data, error } = await supabase
        .from("bookings_with_profit")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to fetch bookings:", error);
        toast.error("Failed to fetch bookings");
        setBookings([]);
      } else {
        setBookings(Array.isArray(data) ? data.map(fromRow) : []);
      }
      setIsLoading(false);
    };
    load();
    // re-run when user changes
  }, [user]);

  // === ADD BOOKING (RPC: atomic booking + wallet movements) ===
  const addBooking = async (rawBooking) => {
    if (!user) throw new Error("User is not logged in");

    const {
      customerName,
      email,
      contactNumber,
      date,
      basePay = 0,
      commissionAmount = 0,
      markupAmount = 0,
      platform = "",
      status = STATUS.PENDING,
      category = CATEGORY.FLIGHT,
    } = rawBooking;

    // Validation
    if (!customerName?.trim()) throw new Error("Customer name is required");
    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email))
      throw new Error("Valid email is required");
    if (!contactNumber?.trim()) throw new Error("Contact number is required");
    if (!date) throw new Error("Date is required");
    if (!Object.values(CATEGORY).includes(category)) throw new Error("Invalid category");
    if (!Object.values(STATUS).includes(status)) throw new Error("Invalid status");

    // Normalize platform to match wallet names used in SQL (e.g., 'AlHind')
    const normalizePlatform = (p) => {
      if (!p) return "Direct";
      const t = String(p);
      if (t === "Alhind") return "AlHind"; // fix casing mismatch
      return t;
    };
    const platformNormalized = normalizePlatform(platform);

    const id = crypto.randomUUID();
    const payload = {
      p_booking_id: id,
      p_customer_name: customerName.trim(),
      p_email: email.trim().toLowerCase(),
      p_contact_number: contactNumber.trim(),
      p_booking_date: new Date(date).toISOString(),
      p_category: category,
      p_platform: platformNormalized,
      p_base_pay: Number(basePay) || 0,
      p_commission_amount: Number(commissionAmount) || 0,
      p_markup_amount: Number(markupAmount) || 0,
      p_total_revenue: Number((Number(basePay || 0) + Number(commissionAmount || 0) + Number(markupAmount || 0)).toFixed(2)),
      p_status: status,
      p_user_id: user.id,
    };

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("create_booking_transaction", payload);
      if (error) throw error;

      // Refresh list from view to include computed net_profit
      const { data: fresh, error: fetchErr } = await supabase
        .from("bookings_with_profit")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchErr) {
        console.warn("Fetch inserted booking failed:", fetchErr);
      }
      const mapped = fresh
        ? fromRow(fresh)
        : fromRow({
            id,
            customer_name: payload.p_customer_name,
            email: payload.p_email,
            contact_number: payload.p_contact_number,
            booking_date: payload.p_booking_date,
            category: payload.p_category,
            platform: payload.p_platform,
            status: payload.p_status,
            base_pay: payload.p_base_pay,
            commission_amount: payload.p_commission_amount,
            markup_amount: payload.p_markup_amount,
            total_revenue: payload.p_total_revenue,
            user_id: payload.p_user_id,
          });
      setBookings((prev) => [mapped, ...prev]);
      toast.success("Booking added successfully!");
      // Refresh wallet balances and activity after atomic RPC completes
      try {
        await refreshWallets?.();
        await refreshTransactions?.();
      } catch (e) {
        console.warn("Wallet refresh after addBooking failed:", e?.message || e);
      }
      return mapped;
    } catch (err) {
      console.error("Error adding booking and transaction:", err.message);
      throw new Error(err.message || "Failed to add booking");
    } finally {
      setIsLoading(false);
    }
  };

  // === REMOVE BOOKING ===
  const removeBooking = async (id) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) throw new Error("Booking not found");

    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) {
      throw new Error(error.message || "Failed to delete booking");
    }
    setBookings((prev) => prev.filter((b) => b.id !== id));
    toast.success(`Booking #${id} removed`);
  };

  // === UPDATE STATUS ONLY ===
  const updateBookingStatus = async (id, newStatus) => {
    if (!Object.values(STATUS).includes(newStatus))
      throw new Error("Invalid status");
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) throw new Error(error.message || "Failed to update status");

    // Refresh single row from view
    const { data: updated } = await supabase
      .from("bookings_with_profit")
      .select("*")
      .eq("id", id)
      .single();

    setBookings((prev) =>
      prev.map((b) => (b.id === id ? fromRow(updated || { ...b, status: newStatus }) : b))
    );

    const booking = bookings.find(b => b.id === id);
    const name = booking?.customerName?.split(" ")[0] || "Booking";

    const msg = newStatus === STATUS.CONFIRMED
      ? `${name}'s booking confirmed`
      : newStatus === STATUS.CANCELLED
      ? `${name}'s booking cancelled`
      : `${name}'s booking pending`;

    toast.success(msg);
    // Ensure wallet view reflects any DB-side movements
    try {
      await refreshWallets?.();
      await refreshTransactions?.();
    } catch (e) {
      console.warn("Wallet refresh after status update failed:", e?.message || e);
    }
  };

  // === FULL UPDATE (Edit Booking) ===
  const updateBooking = async (updatedBooking) => {
    const {
      id,
      basePay = 0,
      commissionAmount = 0,
      markupAmount = 0,
      platform = "",
      status,
      category,
    } = updatedBooking;
    const payload = toRow({
      ...updatedBooking,
      basePay,
      commissionAmount,
      markupAmount,
      platform,
      status,
      category,
    });
    const { error } = await supabase
      .from("bookings")
      .update(payload)
      .eq("id", id);
    if (error) throw new Error(error.message || "Failed to update booking");

    const { data: fresh } = await supabase
      .from("bookings_with_profit")
      .select("*")
      .eq("id", id)
      .single();

    const mapped = fresh ? fromRow(fresh) : updatedBooking;
    setBookings((prev) => prev.map((b) => (b.id === id ? mapped : b)));
    toast.success("Booking updated successfully!");
    // Refresh wallet balances/activity in case RPCs or triggers adjusted wallets
    try {
      await refreshWallets?.();
      await refreshTransactions?.();
    } catch (e) {
      console.warn("Wallet refresh after updateBooking failed:", e?.message || e);
    }
    return mapped;
  };

  // === GET BY ID ===
  const getBookingById = (id) => bookings.find((b) => b.id === id);

  // === STATS (ONLY CONFIRMED COUNT FOR REVENUE & PROFIT) ===
  const getStats = () => {
    const confirmedBookings = bookings.filter(b => b.status === STATUS.CONFIRMED);

    const total = bookings.length;
    const pending = bookings.filter(b => b.status === STATUS.PENDING).length;
    const confirmed = confirmedBookings.length;
    const cancelled = total - pending - confirmed;

    const revenue = confirmedBookings.reduce((s, b) => s + (b.totalRevenue || 0), 0);
    const netProfitTotal = confirmedBookings.reduce((s, b) => s + (b.netProfit || 0), 0);
    const basePayTotal = confirmedBookings.reduce((s, b) => s + (b.basePay || 0), 0);

    return {
      total,
      pending,
      confirmed,
      cancelled,
      revenue,
      netProfitTotal,
      basePayTotal,
    };
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        addBooking,
        removeBooking,
        updateBookingStatus,
        updateBooking,
        getBookingById,
        getStats,
        isLoading,
        CATEGORY,
        STATUS,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

// Custom Hook
export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking must be used within BookingProvider");
  return context;
};