
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, type ReactElement } from "react";
import { useAuth } from "./auth";
import Shell from "./components/Shell";
import { Spinner } from "./components/ui";
import About from "./pages/About";
import AdminHome from "./pages/AdminHome";
import { Login, Register } from "./pages/AuthPages";
import Catalog from "./pages/Catalog";
import Compare from "./pages/Compare";
import Dashboard from "./pages/Dashboard";
import Datasets from "./pages/Datasets";
import DeviceDetails from "./pages/DeviceDetails";
import Landing from "./pages/Landing";
import Models from "./pages/Models";
import Predict from "./pages/Predict";
import { PredictionHistory, PredictionView } from "./pages/PredictionHistory";

function Protected({ children, admin }: { children: ReactElement; admin?: boolean }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />;
  }

  if (admin && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function ScrollTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollTop />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<Shell wide />}>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
        </Route>

        <Route element={<Shell />}>
          <Route element={<Protected><Outlet /></Protected>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/smartphones" element={<Catalog category="Smartphone" />} />
            <Route path="/laptops" element={<Catalog category="Laptop" />} />
            <Route path="/devices" element={<Catalog />} />
            <Route path="/devices/:id" element={<DeviceDetails />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/predictions" element={<PredictionHistory />} />
            <Route path="/predictions/:id" element={<PredictionView />} />

            <Route path="/admin" element={<Protected admin><AdminHome /></Protected>} />
            <Route path="/admin/datasets" element={<Protected admin><Datasets /></Protected>} />
            <Route path="/admin/models" element={<Protected admin><Models /></Protected>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
