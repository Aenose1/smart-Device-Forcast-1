import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import { useAuth } from "./auth";
import Layout from "./components/Layout";
import { Spinner } from "./components/ui";
import Landing from "./pages/Landing";
import { Login, Register } from "./pages/AuthPages";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import DeviceDetails from "./pages/DeviceDetails";
import Predict from "./pages/Predict";
import { PredictionHistory, PredictionView } from "./pages/PredictionHistory";
import AdminHome from "./pages/AdminHome";
import Datasets from "./pages/Datasets";
import Models from "./pages/Models";

function Protected({ children, admin }: { children: ReactElement; admin?: boolean }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (admin && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/devices/:id" element={<DeviceDetails />} />
        <Route path="/predict" element={<Predict />} />
        <Route path="/predictions" element={<PredictionHistory />} />
        <Route path="/predictions/:id" element={<PredictionView />} />
        <Route path="/admin" element={<Protected admin><AdminHome /></Protected>} />
        <Route path="/admin/datasets" element={<Protected admin><Datasets /></Protected>} />
        <Route path="/admin/models" element={<Protected admin><Models /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
