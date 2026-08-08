export default function RiskBadge({ risk }) {

  let color = "";

  switch (risk) {
    case "High":
      color = "bg-red-100 text-red-700";
      break;

    case "Medium":
      color = "bg-yellow-100 text-yellow-700";
      break;

    default:
      color = "bg-green-100 text-green-700";
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${color}`}
    >
      {risk}
    </span>
  );
}