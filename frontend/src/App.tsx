
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, type ReactElement } from "react";
import Shell from "./components/Shell";
import AdminHome from "./pages/AdminHome";
import Catalog from "./pages/Catalog";
import Compare from "./pages/Compare";
import Dashboard from "./pages/Dashboard";
import Datasets from "./pages/Datasets";
import DeviceDetails from "./pages/DeviceDetails";
import Models from "./pages/Models";
import Predict from "./pages/Predict";
import { PredictionHistory, PredictionView } from "./pages/PredictionHistory";

function Protected({ children }: { children: ReactElement; admin?: boolean }) {
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
        <Route
          path="/login"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/register"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route element={<Shell wide />}>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

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

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </>
  );
}
