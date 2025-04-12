import DashboardNavbar from "@/components/DashboardNavbar";
import RequestList from "@/components/RequestList";
import RoleBasedActions from "@/components/RoleBasedActions";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [view, setView] = useState("my_requests"); // Default view
    const navigate = useNavigate();

    useEffect(() => {
        const isTokenExpired = (token) => {
            if (!token) return true; // If there's no token, consider it expired
        
            try {
                const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
                const expiryTime = payload.exp * 1000; // Convert to milliseconds
                return expiryTime < Date.now(); // Check if expired
            } catch (error) {
                return true; // If decoding fails, treat token as expired
            }
        };

        const authToken = localStorage.getItem("authToken");

        if (!authToken || isTokenExpired(authToken)) {
            localStorage.removeItem("authToken"); // Remove expired token
            navigate("/login"); // Redirect to login page
        }

        const fetchUser = async () => {
            try {
                const response = await fetch("http://localhost:5129/api/auth/me", {
                    headers: { Authorization: `Bearer ${authToken}` },
                });

                if (!response.ok) {
                    throw new Error("Session expired. Please log in again.");
                }

                const data = await response.json();
                setUser(data);
            } catch (err) {
                setError(err.message);
                localStorage.removeItem("authToken");
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [navigate]);

    if (loading) return <p className="text-center p-6">Loading dashboard...</p>;
    if (error) return <p className="text-center p-6 text-red-500">{error}</p>;

    return (
        <div  style={{minHeight: '100vh'}}>
            <DashboardNavbar user={user} />
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <RequestList user={user} view={view} currentPage={currentPage} setCurrentPage={setCurrentPage}/>
                <RoleBasedActions roles={user.roles} setView={setView} setCurrentPage={setCurrentPage}/>
            </div>
        </div>
    );
}
