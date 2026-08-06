import DashboardLayout from "../layouts/DashboardLayout";

import CarbonKPICards from "../components/CarbonKPICards";
import CarbonTrendChart from "../components/CarbonTrendChart";
import CarbonProgress from "../components/CarbonProgress";

import {
  Download,
  Sparkles,
  Leaf,
} from "lucide-react";

export default function CarbonAnalytics() {

  return (

    <DashboardLayout>

      <div className="flex justify-between items-center mb-8">

        <div>

          <h1 className="text-4xl font-bold">

            🌱 Carbon Analytics

          </h1>

          <p className="text-slate-500 mt-2">

            Track sustainability performance across fleet, routes and inventory transfers.

          </p>

        </div>

        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl flex gap-2 items-center">

          <Download size={20}/>

          Download Report

        </button>

      </div>

      <CarbonKPICards/>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">

        <div className="lg:col-span-2">

          <CarbonTrendChart/>

        </div>

        <CarbonProgress/>

      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">

          <h2 className="text-2xl font-bold">

            Fleet Emissions

          </h2>

          <div className="space-y-5 mt-8">

            <div className="flex justify-between">

              <span>Truck 01</span>

              <strong>42 kg CO₂</strong>

            </div>

            <div className="flex justify-between">

              <span>Truck 02</span>

              <strong>35 kg CO₂</strong>

            </div>

            <div className="flex justify-between">

              <span>Van 01</span>

              <strong>18 kg CO₂</strong>

            </div>

            <div className="flex justify-between">

              <span>EV Truck</span>

              <strong className="text-green-600">

                4 kg CO₂

              </strong>

            </div>

          </div>

        </div>

        <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-8 text-white">

          <div className="flex items-center gap-3">

            <Sparkles/>

            <h2 className="text-2xl font-bold">

              AI Sustainability Insight

            </h2>

          </div>

          <div className="space-y-4 mt-8">

            <p>

              ✅ Switching two diesel trucks to electric will reduce annual emissions by approximately 22%.

            </p>

            <p>

              ✅ Route optimization has already reduced transport emissions by 18%.

            </p>

            <p>

              ✅ Warehouse transfers now consume 12% less fuel compared to last month.

            </p>

            <p>

              ✅ AI predicts another 14% reduction with optimized scheduling.

            </p>

          </div>

          <div className="mt-8 bg-white/20 rounded-2xl p-5">

            <div className="flex items-center gap-2">

              <Leaf/>

              <span className="font-semibold">

                Sustainability Score

              </span>

            </div>

            <h2 className="text-5xl font-bold mt-4">

              91%

            </h2>

          </div>

        </div>

      </div>

    </DashboardLayout>

  );

}