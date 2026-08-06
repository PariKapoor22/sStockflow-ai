export default function RecentActivity({ data }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-3xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">
        Recent Activity
      </h2>

      <div className="space-y-4">
        {data.recent_activity.map((activity, index) => (
          <div
            key={index}
            className="flex items-start gap-3"
          >
            <div className="w-3 h-3 rounded-full bg-emerald-500 mt-2"></div>

            <p className="text-slate-700">
              {activity}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}