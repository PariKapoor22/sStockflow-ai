import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50 pt-36 pb-24">

      {/* Background Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-cyan-200 rounded-full blur-3xl opacity-25"></div>

      <div className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center">

        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >

          <span className="inline-flex items-center bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-medium">
            🌱 AI Powered Sustainability Platform
          </span>

          <h1 className="mt-8 text-6xl font-extrabold leading-tight text-slate-900">
            Smarter Supply Chains.
            <br />
            Lower Carbon.
          </h1>

          <p className="mt-6 text-lg text-slate-600 leading-8 max-w-xl">
            Combine AI-powered inventory optimization, intelligent routing,
            fleet analytics, and carbon accounting in one enterprise platform.
          </p>

          <div className="mt-10 flex gap-5">

            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition">

              Get Started

              <ArrowRight size={20} />

            </button>

            <button className="border border-slate-300 hover:border-emerald-500 px-8 py-4 rounded-xl font-semibold flex items-center gap-2 transition">

              <PlayCircle size={22} />

              Watch Demo

            </button>

          </div>

          <div className="grid grid-cols-3 gap-8 mt-14">

            <div>
              <h2 className="text-4xl font-bold text-emerald-600">98%</h2>
              <p className="text-slate-500 mt-2">AI Accuracy</p>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-blue-600">35%</h2>
              <p className="text-slate-500 mt-2">Carbon Reduced</p>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-orange-500">10K+</h2>
              <p className="text-slate-500 mt-2">Businesses</p>
            </div>

          </div>

        </motion.div>

        {/* Right Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >

          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8">

            <div className="flex justify-between items-center">

              <h2 className="text-2xl font-bold">
                Live Dashboard
              </h2>

              <span className="text-green-500 font-semibold">
                ● Live
              </span>

            </div>

            <div className="grid grid-cols-2 gap-6 mt-8">

              <div className="bg-slate-100 rounded-2xl p-5">

                <p className="text-slate-500">
                  Carbon Score
                </p>

                <h1 className="text-5xl font-bold mt-2">
                  92
                </h1>

              </div>

              <div className="bg-slate-100 rounded-2xl p-5">

                <p className="text-slate-500">
                  CO₂ Saved
                </p>

                <h1 className="text-5xl font-bold mt-2 text-emerald-600">
                  124kg
                </h1>

              </div>

            </div>

            <div className="mt-8 bg-emerald-500 rounded-2xl p-6 text-white">

              <h3 className="font-bold text-lg">
                AI Recommendation
              </h3>

              <p className="mt-3">
                Switch Delivery Truck 03 to EV Fleet.
              </p>

              <p className="mt-3 font-semibold">
                Estimated Saving:
                ₹420 &nbsp; | &nbsp; 18kg CO₂
              </p>

            </div>

          </div>

        </motion.div>

      </div>

    </section>
  );
}