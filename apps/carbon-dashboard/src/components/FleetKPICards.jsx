import {
  Truck,
  Fuel,
  Wrench,
  Leaf,
} from "lucide-react";

export default function FleetKPICards() {

  const cards = [

    {
      title: "Active Vehicles",
      value: "24",
      icon: <Truck size={28} />,
      color: "bg-blue-100 text-blue-700",
    },

    {
      title: "Fuel Efficiency",
      value: "18.6 km/L",
      icon: <Fuel size={28} />,
      color: "bg-yellow-100 text-yellow-700",
    },

    {
      title: "Maintenance Due",
      value: "3",
      icon: <Wrench size={28} />,
      color: "bg-red-100 text-red-700",
    },

    {
      title: "Fleet Carbon",
      value: "128 kg",
      icon: <Leaf size={28} />,
      color: "bg-green-100 text-green-700",
    },

  ];

  return (

    <div className="grid lg:grid-cols-4 gap-6">

      {cards.map((card,index)=>(

        <div
          key={index}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"
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