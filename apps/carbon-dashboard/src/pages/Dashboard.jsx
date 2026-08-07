import { useEffect, useState } from "react";

import DashboardLayout from "../layouts/DashboardLayout";

import PlatformModules from "../components/PlatformModules";
import DashboardKPIs from "../components/DashboardKPIs";
import CarbonTrendChart from "../components/CarbonTrendChart";
import SustainabilityScore from "../components/SustainabilityScore";
import RecentActivity from "../components/RecentActivity";
import QuickInsights from "../components/QuickInsights";
import LiveFleetMap from "../components/LiveFleetMap";

import { getDashboard } from "../services/dashboardService";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <h2 className="text-2xl font-semibold text-slate-500">
            Loading StockFlow AI...
          </h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800">
          StockFlow AI Dashboard
        </h1>

        <p className="text-slate-500 mt-2 text-lg">
          AI-powered Supply Chain Intelligence with Inventory, Carbon and
          Transport Analytics.
        </p>
      </div>

      {/* Platform Modules */}
      <PlatformModules />

      {/* KPI Cards */}
      <DashboardKPIs data={dashboardData} />

      {/* Carbon Chart + Sustainability */}
      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <CarbonTrendChart data={dashboardData} />
        </div>

        <SustainabilityScore data={dashboardData} />
      </div>

      {/* AI Insights + Activity */}
      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <QuickInsights data={dashboardData} />

        <RecentActivity data={dashboardData} />
      </div>

      {/* Fleet */}
      <div className="mt-8">
        <LiveFleetMap />
      </div>
    </DashboardLayout>
  );
}