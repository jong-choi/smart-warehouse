import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import RootLayout from "@components/layout/RootLayout";
import WarehouseLayout from "@components/warehouse/layout/WarehouseLayout";
import DashboardLayout from "@components/dashboard/layout/DashboardLayout";
import WarehousePage from "@pages/warehouse/WarehousePage";
import DashboardHomePage from "@pages/dashboard/home/DashboardHomePage";
import DashboardLocationWaybillsPage from "@pages/dashboard/location/DashboardLocationWaybillsPage";
import DashboardLocationWaybillDetailPage from "@pages/dashboard/location/DashboardLocationWaybillDetailPage";
import DashboardUnloadingPage from "@pages/dashboard/home/DashboardUnloadingPage";
import { DashboardWorkersPage } from "@pages/dashboard/home/DashboardWorkersPage";
import { DashboardWorkersListPage } from "@pages/dashboard/workers/DashboardWorkersListPage";
import { DashboardWorkerDetailPage } from "@pages/dashboard/workers/detail/DashboardWorkerDetailPage";
import DashboardWaybillsPage from "@pages/dashboard/waybills/DashboardWaybillsPage";
import DashboardWaybillDetailPage from "@pages/dashboard/waybills/DashboardWaybillDetailPage";
import { DashboardMonthlySalesPage } from "@pages/dashboard/sales/DashboardMonthlySalesPage";
import { DashboardDailySalesPage } from "@pages/dashboard/sales/DashboardDailySalesPage";
import { DashboardSalesOverviewPage } from "@pages/dashboard/sales/DashboardSalesOverviewPage";
import SSEChatbot from "@pages/sse-chatbot/SSEChatbot";

function App() {
  return (
    <Router>
      <Routes>
        {/* Root route with redirect */}
        <Route path="/" element={<Navigate to="/warehouse" replace />} />
        <Route path="/sse-chatbot" element={<SSEChatbot />} />

        {/* Root layout with tab switcher */}
        <Route element={<RootLayout />}>
          {/* Warehouse routes */}
          <Route element={<WarehouseLayout />}>
            <Route path="/warehouse" element={<WarehousePage />} />
          </Route>

          {/* Dashboard routes */}
          <Route
            path="/dashboard"
            element={<Navigate to="/dashboard/realtime/overview" replace />}
          />
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard/realtime/overview"
              element={<DashboardHomePage />}
            />
            <Route
              path="/dashboard/realtime/waybill"
              element={<DashboardUnloadingPage />}
            />
            <Route
              path="/dashboard/realtime/workers"
              element={<DashboardWorkersPage />}
            />
            <Route
              path="/dashboard/workers/home"
              element={<DashboardWorkersListPage />}
            />
            <Route
              path="/dashboard/workers/:code"
              element={<DashboardWorkerDetailPage />}
            />

            <Route
              path="/dashboard/location/waybills"
              element={<DashboardLocationWaybillsPage />}
            />
            <Route
              path="/dashboard/location/waybills/:locationId"
              element={<DashboardLocationWaybillDetailPage />}
            />
            <Route
              path="/dashboard/waybills"
              element={<DashboardWaybillsPage />}
            />
            <Route
              path="/dashboard/waybills/:id"
              element={<DashboardWaybillDetailPage />}
            />
            <Route
              path="/dashboard/sales"
              element={<Navigate to="/dashboard/sales/overview" replace />}
            />
            <Route
              path="/dashboard/sales/overview"
              element={<DashboardSalesOverviewPage />}
            />
            <Route
              path="/dashboard/sales/monthly"
              element={<DashboardMonthlySalesPage />}
            />
            <Route
              path="/dashboard/sales/daily"
              element={<DashboardDailySalesPage />}
            />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
