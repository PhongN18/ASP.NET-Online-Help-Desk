import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { NotificationProvider } from "./contexts/NotificationContext";

import Footer from "./components/Footer";
import AdminDashboard from "./pages/AdminDashboard";
import CreateRequestPage from "./pages/CreateRequestPage";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import Login from './pages/Login';
import ManageFacilities from "./pages/ManageFacilities";
import ManageUsers from "./pages/ManageUsers";
import RequestDetail from "./pages/RequestDetail";
import UserNotifications from "./pages/UserNotifications";

import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-request" element={<CreateRequestPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/request-detail/:request_id" element={<RequestDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/manage-users" element={<ManageUsers />} />
          <Route path="/admin/manage-facilities" element={<ManageFacilities />} />
          <Route path="/notifications" element={<UserNotifications />} />
        </Routes>
      </Router>
      <Footer />
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
    </NotificationProvider>
  );
}

export default App;
