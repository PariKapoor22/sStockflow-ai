import { BrowserRouter, Routes, Route } from "react-router-dom";

// Authentication
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Dashboard
import Dashboard from "./pages/Dashboard";

// Sustainability
import Calculator from "./pages/Calculator";
import CarbonAnalytics from "./pages/CarbonAnalytics";
import Recommendations from "./pages/Recommendations";
import RouteOptimization from "./pages/RouteOptimization";
import FleetIntelligence from "./pages/FleetIntelligence";

// Logistics
import Shipments from "./pages/Shipments";

// Reports
import Reports from "./pages/Reports";
import Verification from "./pages/Verification";

// Settings
import Settings from "./pages/Settings";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Landing */}
        <Route path="/" element={<Home />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Sustainability */}
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/analytics" element={<CarbonAnalytics />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/route-optimization" element={<RouteOptimization />} />
        <Route path="/fleet" element={<FleetIntelligence />} />

        {/* Logistics */}
        <Route path="/shipments" element={<Shipments />} />

        {/* Reports */}
        <Route path="/reports" element={<Reports />} />
        <Route path="/verification" element={<Verification />} />

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />

      </Routes>
    </BrowserRouter>
  );
}