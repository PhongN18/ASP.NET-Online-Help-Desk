import DashboardNavbar from "@/components/DashboardNavbar";
import RequestForm from "@/components/RequestForm";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateRequestPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const authToken = localStorage.getItem("authToken");

        if (!authToken) {
            navigate("/login");
            return;
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

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!user) return <p>User not found</p>; // Check if the user is null or not available

    return (
        <div className="bg-[#ddd]">
            <DashboardNavbar user={user} />
            <RequestForm user={user} />
        </div>
    );
}
