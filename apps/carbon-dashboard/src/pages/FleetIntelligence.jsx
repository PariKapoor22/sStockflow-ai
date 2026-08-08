import DashboardLayout from "../layouts/DashboardLayout";

import FleetKPICards from "../components/FleetKPICards";
import VehicleHealthCard from "../components/VehicleHealthCard";
import FleetEfficiencyChart from "../components/FleetEfficiencyChart";
import MaintenanceAlerts from "../components/MaintenanceAlerts";

import {
  Brain,
  Truck,
  Leaf,
  Fuel,
} from "lucide-react";

export default function FleetIntelligence() {

  return (

    <DashboardLayout>

      <div className="flex justify-between items-center mb-8">

        <div>

          <h1 className="text-4xl font-bold">

            🚚 Fleet Intelligence

          </h1>

          <p className="text-slate-500 mt-2">

            AI-powered fleet monitoring and sustainability insights.

          </p>

        </div>

      </div>

      <FleetKPICards/>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">

        <VehicleHealthCard/>

        <FleetEfficiencyChart/>

      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">

        <MaintenanceAlerts/>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-8 text-white">

          <div className="flex items-center gap-3">

            <Brain/>

            <h2 className="text-2xl font-bold">

              AI Fleet Recommendation

            </h2>

          </div>

          <div className="space-y-5 mt-8">

            <div className="flex justify-between">

              <span>Recommended Vehicle</span>

              <strong>Electric Truck</strong>

            </div>

            <div className="flex justify-between">

              <span>Fuel Saving</span>

              <strong>22%</strong>

            </div>

            <div className="flex justify-between">

              <span>Carbon Reduction</span>

              <strong>31%</strong>

            </div>

            <div className="flex justify-between">

              <span>Vehicle Health</span>

              <strong>98%</strong>

            </div>

          </div>

          <div className="mt-8 bg-white/20 rounded-2xl p-5">

            <p className="font-semibold">

              AI Decision

            </p>

            <p className="mt-3">

              Electric Truck is recommended because it has the highest health score, lowest emissions, and enough capacity for the selected shipment.

            </p>

          </div>

        </div>

      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">

          <Truck
            className="text-blue-600"
            size={40}
          />

          <h2 className="text-xl font-bold mt-4">

            Vehicle Utilization

          </h2>

          <h1 className="text-5xl font-bold mt-6">

            84%

          </h1>

        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">

          <Fuel
            className="text-yellow-600"
            size={40}
          />

          <h2 className="text-xl font-bold mt-4">

            Avg Fuel Economy

          </h2>

          <h1 className="text-5xl font-bold mt-6">

            18.6

          </h1>

          <p className="text-slate-500">

            km/L

          </p>

        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">

          <Leaf
            className="text-green-600"
            size={40}
          />

          <h2 className="text-xl font-bold mt-4">

            Fleet Carbon Score

          </h2>

          <h1 className="text-5xl font-bold mt-6">

            91

          </h1>

          <p className="text-slate-500">

            /100

          </p>

        </div>

      </div>

    </DashboardLayout>

  );

}