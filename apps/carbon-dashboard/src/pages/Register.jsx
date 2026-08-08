import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-lg border border-slate-200 p-10">

        {/* Logo */}

        <div className="flex justify-center mb-6">

          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">

            <Leaf className="text-white" size={30} />

          </div>

        </div>

        {/* Heading */}

        <h1 className="text-3xl font-bold text-center text-slate-800">
          Create Account
        </h1>

        <p className="text-center text-slate-500 mt-2">
          Join Carbon Accountability Platform
        </p>

        {/* Form */}

        <div className="mt-8 space-y-5">

          <input
            type="text"
            placeholder="Company Name"
            className="w-full border border-slate-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="text"
            placeholder="Owner / Manager Name"
            className="w-full border border-slate-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="email"
            placeholder="Business Email"
            className="w-full border border-slate-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-slate-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full border border-slate-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <Link
            to="/dashboard"
            className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 transition text-white font-semibold py-4 rounded-xl"
          >
            Create Account
          </Link>

        </div>

        {/* Footer */}

        <p className="text-center text-slate-500 mt-8">

          Already have an account?{" "}

          <Link
            to="/login"
            className="text-emerald-600 font-semibold hover:underline"
          >
            Login
          </Link>

        </p>

      </div>

    </div>
  );
}