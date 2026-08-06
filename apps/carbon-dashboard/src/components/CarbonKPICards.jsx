export default function CarbonKPICards() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white rounded-xl p-5 shadow">
        <h3 className="text-gray-500">Carbon Saved</h3>
        <p className="text-2xl font-bold text-green-600">124 kg</p>
      </div>

      <div className="bg-white rounded-xl p-5 shadow">
        <h3 className="text-gray-500">Fuel Saved</h3>
        <p className="text-2xl font-bold text-blue-600">48 L</p>
      </div>

      <div className="bg-white rounded-xl p-5 shadow">
        <h3 className="text-gray-500">Routes Optimized</h3>
        <p className="text-2xl font-bold text-purple-600">32</p>
      </div>

      <div className="bg-white rounded-xl p-5 shadow">
        <h3 className="text-gray-500">Fleet Score</h3>
        <p className="text-2xl font-bold text-orange-600">91%</p>
      </div>
    </div>
  );
}