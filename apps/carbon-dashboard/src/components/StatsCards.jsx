import { useContext } from "react";
import { CarbonContext } from "../context/CarbonContext";
import {
  Leaf,
  Factory,
  Calendar,
  Award,
} from "lucide-react";

export default function StatsCards() {

  const { latestRecord } = useContext(CarbonContext);

  const cards = [

    {
      title: "Total Emissions",
      value: latestRecord
        ? `${latestRecord.total} kg CO₂e`
        : "0 kg CO₂e",
      icon: <Leaf size={28} />,
      color: "bg-emerald-100 text-emerald-600",
    },

    {
      title: "Carbon Score",
      value: latestRecord
        ? `${latestRecord.carbonScore}/100`
        : "--",
      icon: <Award size={28} />,
      color: "bg-blue-100 text-blue-600",
    },

    {
      title: "Company",
      value: latestRecord
        ? latestRecord.company
        : "No Company",
      icon: <Factory size={28} />,
      color: "bg-orange-100 text-orange-600",
    },

    {
      title: "Month",
      value: latestRecord
        ? latestRecord.month
        : "--",
      icon: <Calendar size={28} />,
      color: "bg-purple-100 text-purple-600",
    },

  ];

  return (

    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

      {cards.map((card, index) => (

        <div

          key={index}

          className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6"

        >

          <div className="flex justify-between items-center">

            <div>

              <p className="text-slate-500">

                {card.title}

              </p>

              <h2 className="text-2xl font-bold mt-3">

                {card.value}

              </h2>

            </div>

            <div

              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.color}`}

            >

              {card.icon}

            </div>

          </div>

        </div>

      ))}

    </div>

  );

}