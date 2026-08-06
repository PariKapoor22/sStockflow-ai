import {
  Route,
  Clock3,
  Fuel,
  Leaf,
} from "lucide-react";

export default function RouteSummary({ result }) {

  if (!result) return null;

  const cards = [

    {
      title: "Distance",
      value: `${result.distance} km`,
      icon: <Route size={24} />,
    },

    {
      title: "Travel Time",
      value: `${result.travel_time} hrs`,
      icon: <Clock3 size={24} />,
    },

    {
      title: "Fuel Used",
      value: `${result.fuel_used} L`,
      icon: <Fuel size={24} />,
    },

    {
      title: "CO₂",
      value: `${result.carbon_emission} kg`,
      icon: <Leaf size={24} />,
    },

  ];

  return (

    <div className="grid lg:grid-cols-4 gap-6">

      {cards.map((card,index)=>(

        <div
          key={index}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"
        >

          <div className="flex justify-between items-center">

            <div>

              <p className="text-slate-500">

                {card.title}

              </p>

              <h2 className="text-3xl font-bold mt-3">

                {card.value}

              </h2>

            </div>

            <div className="text-emerald-600">

              {card.icon}

            </div>

          </div>

        </div>

      ))}

    </div>

  );

}