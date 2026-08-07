export default function CarbonProgress(){

return(

<div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">

<h2 className="text-2xl font-bold">

Annual Carbon Goal

</h2>

<div className="mt-8">

<div className="flex justify-between">

<span>Progress</span>

<strong>72%</strong>

</div>

<div className="w-full bg-slate-200 rounded-full h-5 mt-4">

<div

className="bg-emerald-600 h-5 rounded-full"

style={{

width:"72%"

}}

></div>

</div>

<p className="mt-6 text-slate-500">

128 kg CO₂ remaining to achieve this year's sustainability target.

</p>

</div>

</div>

);

}