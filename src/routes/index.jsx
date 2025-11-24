// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import AllBookings from "../pages/Bookings/AllBookings";
import TrackBooking from "../pages/Bookings/TrackBooking";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
import SignIn from "../pages/SignIn";
import Register from "../pages/Register";
import NotFound from "../pages/NotFound";
import AddBooking from "../pages/Bookings/AddBooking";
import FundsDashboard from "../pages/FundsDashboard";
import AddRevenue from "../pages/InvestmentPage";
import LogExpense from "../pages/LogExpense";
import ViewExpense from "../pages/ViewExpense";
import CustomerDetails from "../pages/CustomerDetails";
import ViewBooking from "../pages/ViewBooking";
import Task from "../pages/Task";
import Notification from "../pages/Notification";
import AddWalletAmount from "../pages/AddWalletAmount";
import EditBooking from "../pages/EditBooking";
import EditHistory from "../pages/EditHistory";
// Contexts
import { BookingProvider } from "../context/BookingContext";
import { FundsProvider } from "../context/FundsContext";
import { ExpenseProvider } from "../context/ExpenseContext";
import { NotificationProvider } from "../context/NotificationContext";
import { TaskProvider } from "../context/TaskContext";
import { WalletProvider } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // or a loader component
  return user ? children : <Navigate to="/signin" replace />;
};
const AppRoutes = () => {
  return (
    <WalletProvider>
      <BookingProvider>
        <FundsProvider>
          <ExpenseProvider>
            <NotificationProvider>
              <TaskProvider>
          <Routes>
            {/* Auth */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/register" element={<Register />} />

            {/* Dashboard */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

            {/* Bookings */}
            <Route path="/bookings" element={<PrivateRoute><AllBookings /></PrivateRoute>} />
            <Route path="/bookings/track" element={<PrivateRoute><TrackBooking /></PrivateRoute>} />
            <Route path="/bookings/add" element={<PrivateRoute><AddBooking /></PrivateRoute>} />
            <Route path="/bookings/edit/:id" element={<PrivateRoute><EditBooking /></PrivateRoute>} />
            <Route path="/bookings/history/:id" element={<PrivateRoute><EditHistory /></PrivateRoute>} />  // ← ADD THIS
            <Route path="/customers" element={<PrivateRoute><CustomerDetails /></PrivateRoute>} /> {/* Fixed */}
            <Route path="/bookings/view/:id" element={<PrivateRoute><ViewBooking /></PrivateRoute>} />

            {/* Funds + Expenses */}
            <Route path="/funds" element={<PrivateRoute><FundsDashboard /></PrivateRoute>} />
            <Route path="/add-wallet-amount" element={<PrivateRoute><AddWalletAmount /></PrivateRoute>} />
            <Route path="/add-revenue" element={<PrivateRoute><AddRevenue /></PrivateRoute>} />
            <Route path="/log-expense" element={<PrivateRoute><LogExpense /></PrivateRoute>} />
            <Route path="/view/:id" element={<PrivateRoute><ViewExpense /></PrivateRoute>} />

            <Route path="/tasks" element={<PrivateRoute><Task /></PrivateRoute>} /> {/* <-- Added */}
            <Route path="/notifications" element={<PrivateRoute><Notification /></PrivateRoute>} /> {/* <-- Added */}
            {/* Reports & Settings */}
            <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
              </TaskProvider>
            </NotificationProvider>
          </ExpenseProvider>
        </FundsProvider>
      </BookingProvider>
    </WalletProvider>
  );
};

export default AppRoutes;