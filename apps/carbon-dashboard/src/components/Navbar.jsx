import { motion } from "framer-motion";
import { Leaf, Menu } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">

        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg">
            <Leaf className="text-white" size={24} />
          </div>

          <div>
            <h1 className="font-bold text-xl text-slate-900">
              Carbon Accountability
            </h1>

            <p className="text-xs text-slate-500">
              Powered by StockFlow AI
            </p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-10">

          <a href="#features" className="hover:text-emerald-600 transition">
            Features
          </a>

          <a href="#platform" className="hover:text-emerald-600 transition">
            Platform
          </a>

          <a href="#resources" className="hover:text-emerald-600 transition">
            Resources
          </a>

          <a href="#pricing" className="hover:text-emerald-600 transition">
            Pricing
          </a>

        </nav>

        <div className="hidden lg:flex items-center gap-4">

          <Link
            to="/login"
            className="text-slate-700 hover:text-emerald-600 transition"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition"
          >
            Get Started →
          </Link>

        </div>

        <button className="lg:hidden">
          <Menu />
        </button>

      </div>
    </motion.header>
  );
}