import DashboardLayout from "../layouts/DashboardLayout";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {

  function generatePDF() {

    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);

    doc.text("Carbon Accountability Report", 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(80);

    doc.text("Company : Green Industries Ltd.", 20, 35);
    doc.text("Industry : Manufacturing", 20, 43);
    doc.text("Month : August 2026", 20, 51);

    autoTable(doc, {
      startY: 65,
      head: [["Emission Source", "Value"]],
      body: [
        ["Electricity", "410 kg CO₂e"],
        ["Fuel", "231 kg CO₂e"],
        ["Transport", "36 kg CO₂e"],
        ["Waste", "22.5 kg CO₂e"],
        ["Total", "699.5 kg CO₂e"],
      ],
    });

    doc.setFontSize(16);

    doc.text("Carbon Score : 86 / 100", 20, doc.lastAutoTable.finalY + 20);

    doc.save("Carbon_Report.pdf");

  }

  return (

    <DashboardLayout>

      <div className="mb-8">

        <h1 className="text-4xl font-bold">

          Reports

        </h1>

        <p className="text-slate-500 mt-2">

          Generate and download professional sustainability reports.

        </p>

      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10">

        <h2 className="text-2xl font-bold">

          Carbon Emission Report

        </h2>

        <p className="mt-3 text-slate-500">

          Generate a professional PDF report for your organization.

        </p>

        <button
          onClick={generatePDF}
          className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-semibold"
        >

          Download PDF Report

        </button>

      </div>

    </DashboardLayout>

  );

}