import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 flex">

      <Sidebar />

      <main className="flex-1 p-8">

        <Topbar />

        <div className="mt-8">

          {children}

        </div>

      </main>

    </div>
  );
}