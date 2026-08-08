import { useState, useContext } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { CarbonContext } from "../context/CarbonContext";
import api from "../services/api";

export default function Calculator() {

  const { addRecord } = useContext(CarbonContext);

  const [form, setForm] = useState({
    company: "",
    industry: "",
    month: "",
    electricity: "",
    fuel: "",
    transport: "",
    waste: "",
  });

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };

  const handleCalculate = async () => {

    try {

      setLoading(true);

      const response = await api.post("/calculate", {

        electricity: Number(form.electricity),
        fuel: Number(form.fuel),
        transport: Number(form.transport),
        waste: Number(form.waste),

      });

      console.log("API Response:", response.data);

      setResult(response.data);

      addRecord({

        ...form,

        ...response.data,

      });

    } catch (error) {

      console.error(error);

      alert("Unable to connect to backend.");

    } finally {

      setLoading(false);

    }

  };

  return (

    <DashboardLayout>

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-slate-800">

          Carbon Calculator

        </h1>

        <p className="text-slate-500 mt-2">

          Calculate your organization's carbon emissions.

        </p>

      </div>

      <div className="grid lg:grid-cols-2 gap-8">

        {/* Left */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">

          <div className="space-y-5">

            <input
              type="text"
              name="company"
              placeholder="Company Name"
              value={form.company}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
              type="text"
              name="industry"
              placeholder="Industry"
              value={form.industry}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
              type="text"
              name="month"
              placeholder="Reporting Month"
              value={form.month}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
              type="number"
              name="electricity"
              placeholder="Electricity (kWh)"
              value={form.electricity}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
              type="number"
              name="fuel"
              placeholder="Fuel (Litres)"
              value={form.fuel}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
              type="number"
              name="transport"
              placeholder="Transport (km)"
              value={form.transport}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <input
              type="number"
              name="waste"
              placeholder="Waste (kg)"
              value={form.waste}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <button
              onClick={handleCalculate}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-semibold transition"
            >

              {loading ? "Calculating..." : "Calculate Emissions"}

            </button>

          </div>

        </div>

        {/* Right */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">

          <h2 className="text-2xl font-bold mb-6">

            Results

          </h2>

          {!result ? (

            <p className="text-slate-500">

              Enter values and click Calculate Emissions.

            </p>

          ) : (

            <div className="space-y-5">

              <div className="flex justify-between">

                <span>Electricity</span>

                <span>{result.electricityEmission} kg CO₂e</span>

              </div>

              <div className="flex justify-between">

                <span>Fuel</span>

                <span>{result.fuelEmission} kg CO₂e</span>

              </div>

              <div className="flex justify-between">

                <span>Transport</span>

                <span>{result.transportEmission} kg CO₂e</span>

              </div>

              <div className="flex justify-between">

                <span>Waste</span>

                <span>{result.wasteEmission} kg CO₂e</span>

              </div>

              <hr />

              <div className="flex justify-between text-2xl font-bold text-emerald-600">

                <span>Total Emissions</span>

                <span>{result.total} kg CO₂e</span>

              </div>

              <hr />

              <div className="flex justify-between text-xl font-bold">

                <span>Carbon Score</span>

                <span className="text-emerald-600">

                  {result.carbonScore}/100

                </span>

              </div>

            </div>

          )}

        </div>

      </div>

    </DashboardLayout>

  );

}