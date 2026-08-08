import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [

{month:"Jan",co2:180},

{month:"Feb",co2:172},

{month:"Mar",co2:160},

{month:"Apr",co2:149},

{month:"May",co2:136},

{month:"Jun",co2:128},

];

export default function CarbonTrendChart(){

return(

<div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

<h2 className="text-2xl font-bold mb-6">

Monthly Carbon Trend

</h2>

<div style={{height:350}}>

<ResponsiveContainer>

<LineChart data={data}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="month"/>

<YAxis/>

<Tooltip/>

<Line

type="monotone"

dataKey="co2"

stroke="#16a34a"

strokeWidth={4}

/>

</LineChart>

</ResponsiveContainer>

</div>

</div>

);

}