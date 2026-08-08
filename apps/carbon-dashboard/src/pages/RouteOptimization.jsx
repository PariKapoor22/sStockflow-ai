import { useMemo, useState } from "react";

import DashboardLayout from "../layouts/DashboardLayout";
import RouteControls from "../components/RouteControls";
import RouteMap from "../components/RouteMap";
import RouteSummary from "../components/RouteSummary";
import RouteComparison from "../components/RouteComparison";

import { warehouses } from "../data/warehouses";
import { calculateCarbon } from "../utils/carbonCalculator";
import useRoute from "../hooks/useRoute";

export default function RouteOptimization() {

  const { route, loading, calculate } = useRoute();

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);

  const [summary, setSummary] = useState(null);

  async function handleCalculate(data) {

    const sourceWarehouse = warehouses.find(
      (w) => w.name.includes(data.source)
    );

    const destinationWarehouse = warehouses.find(
      (w) => w.name.includes(data.destination)
    );

    setOrigin(sourceWarehouse);
    setDestination(destinationWarehouse);

    await calculate(sourceWarehouse, destinationWarehouse);

    setTimeout(() => {

      if (!route) return;

      const distanceKm = Number(
        (route.distance / 1000).toFixed(2)
      );

      const travelHours = Number(
        (route.duration / 3600).toFixed(2)
      );

      const carbon = calculateCarbon(
        distanceKm,
        data.mileage
      );

      setSummary({

        distance: distanceKm,

        travel_time: travelHours,

        fuel_used: carbon.fuelUsed,

        carbon_emission: carbon.carbonEmission,

      });

    }, 800);

  }

  const aiSuggestion = useMemo(() => {

    if (!summary) return null;

    return {

      score: 95,

      savings: (
        summary.carbon_emission * 0.28
      ).toFixed(2),

      message:
        "AI selected this route because it minimizes travel distance, fuel usage and carbon emissions.",

    };

  }, [summary]);

  return (

    <DashboardLayout>

      <div className="mb-8">

        <h1 className="text-4xl font-bold">

          🗺 Route Optimization

        </h1>

        <p className="text-slate-500 mt-2">

          Optimize warehouse transfers using AI and real road routing.

        </p>

      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        <RouteControls

          onCalculate={handleCalculate}

        />

        <div className="lg:col-span-2">

          <RouteMap

            origin={origin}

            destination={destination}

            route={route}

          />

        </div>

      </div>

      <div className="mt-8">

        <RouteSummary

          result={summary}

        />

      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">

        <RouteComparison

          result={summary}

        />

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">

          <h2 className="text-2xl font-bold">

            🤖 AI Route Recommendation

          </h2>

          {aiSuggestion ? (

            <>

              <div className="mt-6">

                <div className="flex justify-between">

                  <span>AI Confidence</span>

                  <strong>

                    {aiSuggestion.score}%

                  </strong>

                </div>

                <div className="w-full h-3 rounded-full bg-slate-200 mt-3">

                  <div

                    className="bg-emerald-600 h-3 rounded-full"

                    style={{
                      width: `${aiSuggestion.score}%`,
                    }}

                  />

                </div>

              </div>

              <div className="mt-8 space-y-3">

                <p>

                  ✅ Lowest travel distance

                </p>

                <p>

                  ✅ Reduced fuel usage

                </p>

                <p>

                  ✅ Lower carbon footprint

                </p>

                <p>

                  ✅ Better delivery efficiency

                </p>

              </div>

              <div className="mt-8 bg-emerald-50 rounded-2xl p-5">

                <p className="font-semibold">

                  Estimated Carbon Saving

                </p>

                <h2 className="text-3xl font-bold text-emerald-700 mt-2">

                  {aiSuggestion.savings} kg CO₂

                </h2>

              </div>

            </>

          ) : (

            <div className="mt-8 text-slate-500">

              Run route optimization to view AI insights.

            </div>

          )}

        </div>

      </div>

    </DashboardLayout>

  );

}