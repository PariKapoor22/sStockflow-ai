import {
  Brain,
  CheckCircle,
  Clock,
  Leaf,
} from "lucide-react";

export default function RecommendationStats({
  recommendations,
}) {

  const pending = recommendations.filter(
    r => r.status === "Pending"
  ).length;

  const approved = recommendations.filter(
    r => r.status === "Approved"
  ).length;

  const carbonSaved = recommendations.reduce(
    (sum, r) => sum + (r.carbon_saved || 0),
    0
  );

  const stats = [

    {
      title: "Pending",
      value: pending,
      icon: <Clock size={28}/>,
      color: "bg-yellow-100 text-yellow-700",
    },

    {
      title: "Approved",
      value: approved,
      icon: <CheckCircle size={28}/>,
      color: "bg-emerald-100 text-emerald-700",
    },

    {
      title: "Carbon Saved",
      value: `${carbonSaved.toFixed(1)} kg`,
      icon: <Leaf size={28}/>,
      color: "bg-green-100 text-green-700",
    },

    {
      title: "AI Decisions",
      value: recommendations.length,
      icon: <Brain size={28}/>,
      color: "bg-blue-100 text-blue-700",
    },

  ];

  return (

    <div className="grid lg:grid-cols-4 gap-6 mb-8">

      {stats.map((item,index)=>(

        <div
          key={index}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-lg transition"
        >

          <div className="flex justify-between">

            <div>

              <p className="text-slate-500">

                {item.title}

              </p>

              <h2 className="text-3xl font-bold mt-3">

                {item.value}

              </h2>

            </div>

            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color}`}
            >
              {item.icon}
            </div>

          </div>

        </div>

      ))}

    </div>

  );

}