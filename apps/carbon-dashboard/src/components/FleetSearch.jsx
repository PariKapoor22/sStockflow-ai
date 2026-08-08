export default function FleetSearch({
  value,
  onChange,
}) {
  return (
    <input
      placeholder="Search Vehicle..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded-xl px-5 py-3 w-80"
    />
  );
}