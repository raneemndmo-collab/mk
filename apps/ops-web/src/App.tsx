import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import OpsLayout from "./components/OpsLayout";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const TicketList = lazy(() => import("./pages/TicketList"));
const TicketDetail = lazy(() => import("./pages/TicketDetail"));
const CreateTicket = lazy(() => import("./pages/CreateTicket"));
const Assignments = lazy(() => import("./pages/Assignments"));
const Reports = lazy(() => import("./pages/Reports"));
const Login = lazy(() => import("./pages/Login"));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-teal border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<OpsLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tickets" element={<TicketList />} />
          <Route path="tickets/new" element={<CreateTicket />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
