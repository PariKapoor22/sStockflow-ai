import {
  Leaf,
  Fuel,
  Truck,
  TrendingDown,
} from "lucide-react";

export default function CarbonKPICards() {

  const cards = [

    {
      title: "Carbon Saved",
      value: "124 kg",
      icon: <Leaf size={28} />,
      color: "bg-green-100 text-green-700",
    },

    {
      title: "Fuel Saved",
      value: "48 L",
      icon: <Fuel size={28} />,
      color: "bg-yellow-100 text-yellow-700",
    },

    {
      title: "Optimized Routes",
      value: "32",
      icon: <Truck size={28} />,
      color: "bg-blue-100 text-blue-700",
    },

    {
      title: "Emission Reduction",
      value: "21%",
      icon: <TrendingDown size={28} />,
      color: "bg-emerald-100 text-emerald-700",
    },

  ];

  return (

    <div className="grid lg:grid-cols-4 gap-6">

      {cards.map((card,index)=>(

        <div
          key={index}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6"
        >

          <div className="flex justify-between">

            <div>

              <p className="text-slate-500">

                {card.title}

              </p>

              <h2 className="text-3xl font-bold mt-3">

                {card.value}

              </h2>

            </div>

            <div
              className={`w-14 h-14 rounded-2xl flex justify-center items-center ${card.color}`}
            >
              {card.icon}
            </div>

          </div>

        </div>

      ))}

    </div>

  );

}