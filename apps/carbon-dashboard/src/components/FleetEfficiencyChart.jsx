import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [

{vehicle:"T1",efficiency:19},

{vehicle:"T2",efficiency:17},

{vehicle:"T3",efficiency:15},

{vehicle:"EV",efficiency:24},

];

export default function FleetEfficiencyChart(){

return(

<div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

<h2 className="text-2xl font-bold mb-6">

Fuel Efficiency

</h2>

<div style={{height:320}}>

<ResponsiveContainer>

<BarChart data={data}>

<XAxis dataKey="vehicle"/>

<YAxis/>

<Tooltip/>

<Bar dataKey="efficiency" fill="#16a34a"/>

</BarChart>

</ResponsiveContainer>

</div>

</div>

);

}