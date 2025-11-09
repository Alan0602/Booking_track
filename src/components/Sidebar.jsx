import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Book,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  User,
  Loader2,
  PlusCircle,
  Receipt,
  CheckCircle,
  Wallet as WalletIcon,
  ChevronDown,
  IndianRupeeIcon,
} from "lucide-react";
import Logo from "../assets/Logo.png";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loading } = useAuth();
  const [profileImage, setProfileImage] = useState(null);
  const [isAddInvestmentsOpen, setIsAddInvestmentsOpen] = useState(false);

  // ✅ UPDATED LINKS WITH SUBMENU
  const links = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Bookings", path: "/bookings", icon: Book },
    { name: "Customer Profile", path: "/customers", icon: User },
    { name: "Funds", path: "/funds", icon: Wallet },
    { name: "Tasks", path: "/tasks", icon: CheckCircle },

    // ✅ PARENT SECTION
    {
      name: "Capital",
      icon: PlusCircle,
      children: [
        { name: "Manage Partners", path: "/add-revenue" },
         { name: "Manage Wallet", path: "/add-wallet-amount", icon: WalletIcon },
      ],
    },

    { name: "Log Expense", path: "/log-expense", icon: IndianRupeeIcon },
    { name: "Reports", path: "/reports", icon: BarChart3 },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  // Close submenu when navigating to non-child pages
  useEffect(() => {
    const childPaths = ["/add-revenue", "/add-wallet-amount"];
    if (!childPaths.includes(location.pathname)) {
      setIsAddInvestmentsOpen(false);
    }
  }, [location.pathname]);

  // Fetch stored image on mount
  useEffect(() => {
    const stored = localStorage.getItem("profileImage");
    if (stored) setProfileImage(stored);
  }, []);

  const handleProfileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem("profileImage", reader.result);
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <aside className="flex h-full w-full flex-col bg-white border-r border-gray-200">
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </aside>
    );
  }

  if (!user) {
    navigate("/signin", { replace: true });
    return null;
  }

  return (
    <aside className="flex h-full w-full flex-col bg-white">

      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-14 w-60 rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white flex items-center justify-center">
            <img src={Logo} alt="Company Logo" className="h-3/4 object-contain" />
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12">
            <label htmlFor="profile-upload" className="cursor-pointer group">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="User Profile"
                  className="h-12 w-12 rounded-full object-contain border-2 border-blue-500 bg-white p-0.5 shadow-md group-hover:opacity-80 transition"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 p-0.5 shadow-md">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                    <User size={18} className="text-gray-700" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-blue-600 p-1 rounded-full shadow-md group-hover:scale-110 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth={2} stroke="white" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.232 5.232a2.828 2.828 0 114 4L7.5 21H3v-4.5l12.232-11.268z" />
                </svg>
              </div>
            </label>
            <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleProfileUpload} />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800">{user.name}</p>
            <p className="truncate text-xs text-gray-500 max-w-[150px]">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {links.map((item, index) =>
          !item.children ? (
            // ✅ Normal nav link
            <NavLink
              key={index}
              to={item.path}
              end
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all
                ${isActive ? "text-white shadow-lg" : "text-gray-700 hover:text-blue-600"}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarPill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <item.icon size={20} className={`relative z-10 ${isActive ? "text-white" : "group-hover:text-blue-600"}`} />
                  <span className="relative z-10">{item.name}</span>
                </>
              )}
            </NavLink>
          ) : (
            // ✅ Submenu Section
            <div key={index}>
              <button
                onClick={() => setIsAddInvestmentsOpen(!isAddInvestmentsOpen)}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 font-semibold text-sm hover:bg-gray-50 rounded transition"
              >
                <item.icon size={20} className="text-gray-600" />
                <span>{item.name}</span>
                <ChevronDown 
                  size={16} 
                  className={`ml-auto transition-transform duration-200 ${isAddInvestmentsOpen ? 'rotate-0' : '-rotate-180'}`} 
                />
              </button>

              <AnimatePresence>
                {isAddInvestmentsOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: "auto", opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    transition={{ duration: 0.2 }}
                    className="ml-10 space-y-1 overflow-hidden"
                  >
                    {item.children.map((sub, subIndex) => (
                      <NavLink
                        key={subIndex}
                        to={sub.path}
                        onClick={() => setIsAddInvestmentsOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2 text-sm px-2 py-1 rounded-md transition
                          ${isActive ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"}`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {sub.icon && <sub.icon size={16} className={isActive ? "text-blue-600" : "text-gray-600"} />}
                            <span>{sub.name}</span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={20} className="transition-transform group-hover:scale-110" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;