export default function RecentReports(){

const reports=[
"July Sustainability Report",
"June Sustainability Report",
"May Sustainability Report"
];

return(

<div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

<h2 className="text-xl font-bold mb-6">

Recent Reports

</h2>

<div className="space-y-4">

{reports.map((item,index)=>(

<div
key={index}
className="border rounded-xl p-4 hover:bg-slate-50"
>

{item}

</div>

))}

</div>

</div>

);

}