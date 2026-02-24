import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import AircraftDetails from "@/pages/AircraftDetails";
import AircraftSetup from "@/pages/config/AircraftSetup";
import ComponentListSetup from "@/pages/config/ComponentListSetup";
import ServiceListSetup from "@/pages/config/ServiceListSetup";
import AircraftActivity from "@/pages/AircraftActivity";
import OccmPanel from "@/pages/OccmPanel";
import OccmForm from "@/pages/OccmForm";
import JourneyLog from "@/pages/JourneyLog";
import JourneyLogForm from "@/pages/JourneyLogForm";
import ViewJourneyLog from "@/pages/ViewJourneyLog";
import Forecast from "@/pages/Forecast";
import PrintTaskCard from "@/pages/PrintTaskCard";
import Scheduler from "@/pages/Scheduler";
import PowerBi from "@/pages/PowerBi";
import NotFound from "@/pages/NotFound";
import ForgotPassword from "@/pages/ForgotPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/aircraft/:id" element={<AircraftDetails />} />
              <Route path="/aircraft/:id/activity" element={<AircraftActivity />} />
              <Route path="/aircraft/:id/occm" element={<OccmPanel />} />
              <Route path="/aircraft/:id/occm/:componentId/edit" element={<OccmForm />} />
              <Route path="/aircraft/:id/journey" element={<JourneyLog />} />
              <Route path="/aircraft/:id/journey/new" element={<JourneyLogForm />} />
              <Route path="/aircraft/:id/journey/:logId/edit" element={<JourneyLogForm />} />
              <Route path="/aircraft/:id/journey/:logId/view" element={<ViewJourneyLog />} />
              <Route path="/aircraft/:id/forecast" element={<Forecast />} />
              <Route path="/aircraft/:id/forecast/print/:selectedIds" element={<PrintTaskCard />} />
              <Route path="/aircraft/:id/scheduler" element={<Scheduler />} />
              <Route path="/powerbi" element={<PowerBi />} />
              <Route path="/config/aircraft" element={<AircraftSetup />} />
              <Route path="/config/components" element={<ComponentListSetup />} />
              <Route path="/config/services" element={<ServiceListSetup />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
