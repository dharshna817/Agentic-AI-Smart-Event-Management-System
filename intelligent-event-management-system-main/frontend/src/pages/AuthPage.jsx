import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";

const initialForm = {
  email: "",
  password: "",
};

export default function AuthPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("/api/auth/login", form);
      const user = response.data.user;
      localStorage.setItem("eventai_user", JSON.stringify(user));
      axios.defaults.headers.common["x-user-role"] = user.role;
      axios.defaults.headers.common["x-user-email"] = user.email;
      toast.success("Welcome back!");
      navigate(user.role === "admin" ? "/admin/dashboard" : "/user/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10 min-h-screen pt-24 pb-16 px-4"
    >
      <Navbar />
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        <div className="glass rounded-3xl p-8 border border-purple-500/20">
          <div className="inline-flex items-center gap-2 text-purple-300 text-xs font-medium mb-6 rounded-full border border-purple-500/30 px-3 py-1">
            <Sparkles size={14} /> EventAI Access
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-white mb-3">
            Access your dashboard
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Admins and users share the same login page. After sign in, the
            system routes each account to the correct dashboard automatically.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl p-4 glass">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <ShieldCheck size={18} className="text-purple-300" />
              </div>
              <div>
                <div className="text-white font-semibold">Admin</div>
                <div className="text-slate-400 text-xs">
                  Venue, speaker, analytics, scheduling
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl p-4 glass">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Users size={18} className="text-cyan-300" />
              </div>
              <div>
                <div className="text-white font-semibold">User</div>
                <div className="text-slate-400 text-xs">
                  QR pass, check-in/out, profile, notifications
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Email</label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-3.5 text-slate-500"
                />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input-glass w-full pl-10 pr-4 py-3 rounded-xl"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-3.5 text-slate-500"
                />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-glass w-full pl-10 pr-4 py-3 rounded-xl"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-white"
            >
              {loading ? "Please wait..." : "Login"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-slate-400 text-sm mt-6 text-center">
            Don’t have an account?{" "}
            <Link to="/register" className="text-purple-300">
              Register
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
