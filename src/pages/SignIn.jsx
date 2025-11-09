// import { useState } from "react";
// import { Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import { Mail, Lock, Loader2 } from "lucide-react"; // Optional: lucide-react icons

// const SignIn = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const { login } = useAuth();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       await login(email, password);
//     } catch (err) {
//       setError(err.message || "Failed to sign in. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
//       <div className="w-full max-w-md">
//         {/* Card with subtle glassmorphism effect */}
//         <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-white/20 transition-all duration-300 hover:shadow-2xl">
//           {/* Logo / Brand */}
//           <div className="flex justify-center mb-6">
//             <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
//               <Lock className="w-8 h-8 text-white" />
//             </div>
//           </div>

//           <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
//             Welcome Back
//           </h2>
//           <p className="text-center text-gray-600 mb-8">
//             Sign in to continue to your account
//           </p>

//           {/* Error Message */}
//           {error && (
//             <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm animate-pulse">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-5">
//             {/* Email Field */}
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//               <input
//                 type="email"
//                 placeholder="Email address"
//                 className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 disabled={loading}
//               />
//             </div>

//             {/* Password Field */}
//             <div className="relative">
//               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//               <input
//                 type="password"
//                 placeholder="Password"
//                 className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 disabled={loading}
//               />
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transform transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="w-5 h-5 animate-spin" />
//                   Signing in...
//                 </>
//               ) : (
//                 "Sign In"
//               )}
//             </button>
//           </form>

//           {/* Divider */}
//           <div className="flex items-center my-6">
//             <div className="flex-1 h-px bg-gray-300"></div>
//             <span className="px-3 text-xs text-gray-500 font-medium">OR</span>
//             <div className="flex-1 h-px bg-gray-300"></div>
//           </div>

//           {/* Register Link */}
//           <p className="text-center text-sm text-gray-600">
//             Don’t have an account?{" "}
//             <Link
//               to="/register"
//               className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
//             >
//               Register here
//             </Link>
//           </p>

//           {/* Forgot Password */}
//           <div className="mt-4 text-center">
//             <Link
//               to="/forgot-password"
//               className="text-xs text-gray-500 hover:text-gray-700 underline transition"
//             >
//               Forgot your password?
//             </Link>
//           </div>
//         </div>

//         {/* Footer */}
//         <p className="text-center text-xs text-gray-500 mt-8">
//           © 2025 YourApp. All rights reserved.
//         </p>
//       </div>
//     </div>
//   );
// };

// export default SignIn;

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Loader2, Lock } from "lucide-react";
import Logo from "../assets/Logo.png";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/70 backdrop-blur-2xl p-10 rounded-3xl shadow-[0_8px_60px_rgba(0,0,0,0.08)] border border-white/40 transition-all duration-500 hover:shadow-[0_12px_80px_rgba(0,0,0,0.12)]">

          {/* Logo */}
          <div className="flex justify-center mb-10">
            <img src={Logo} alt="Logo" className="h-16 object-contain" />
          </div>

          <h1 className="text-3xl font-semibold text-center text-gray-800">
            Welcome Back
          </h1>
          <p className="text-center text-gray-500 mt-1 mb-8">
            Log in to continue
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-100 text-red-600 border border-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition group-focus-within:text-blue-600" />
              <input
                type="email"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/60 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition group-focus-within:text-blue-600" />
              <input
                type="password"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/60 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
{/* 
          <div className="text-center mt-8">
            <Link to="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700 transition">
              Forgot password?
            </Link>
          </div> */}

          {/* <p className="text-center text-sm text-gray-600 mt-5">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Create one
            </Link>
          </p> */}
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">© 2025 Compass Tours And Travels. All rights reserved.</p>
      </div>
    </div>
  );
};

export default SignIn;
