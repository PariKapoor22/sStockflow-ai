export default function CarbonProgress() {
  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <h2 className="text-xl font-bold mb-4">
        Sustainability Progress
      </h2>

      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-green-500 h-4 rounded-full"
          style={{ width: "72%" }}
        ></div>
      </div>

      <p className="mt-4 text-gray-600">
        72% of this month's carbon reduction target achieved.
      </p>
    </div>
  );
} 