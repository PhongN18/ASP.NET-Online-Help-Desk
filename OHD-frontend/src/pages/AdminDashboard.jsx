import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";

// 📌 Register Chart Components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
    const [allData, setAllData] = useState()
    const [overviewStats, setOverviewStats] = useState({});
    const [requestsOverTime, setRequestsOverTime] = useState([]);
    const [requestsByFacility, setRequestsByFacility] = useState([]);
    const [severityDistribution, setSeverityDistribution] = useState([]);
    const [avgResolutionTime, setAvgResolutionTime] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);
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

        const fetchData = async () => {
            try {
                const responses = await Promise.all([
                    fetch("http://localhost:5129/api/requests/admin/overview-stats", {
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` }
                    }),
                    fetch("http://localhost:5129/api/requests/admin/requests-over-time", {
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` }
                    }),
                    fetch("http://localhost:5129/api/requests/admin/requests-by-facility", {
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` }
                    }),
                    fetch("http://localhost:5129/api/requests/admin/severity-distribution", {
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` }
                    }),
                    fetch("http://localhost:5129/api/requests/admin/average-resolution-time", {
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` }
                    })
                ]);

                const data = await Promise.all(responses.map(res => res.json()));
                setAllData(data)
                setOverviewStats(data[0]);
                setRequestsOverTime(data[1]);
                setRequestsByFacility(data[2]);
                setSeverityDistribution(data[3]);
                setAvgResolutionTime(data[4].avgResolutionTime);
            } catch (error) {
                console.error("Error fetching admin dashboard data:", error.message);
            }
        };

        fetchData();
    }, []);

    /** Handle Logout */
    const handleLogout = () => {
        localStorage.removeItem("authToken");
        navigate("/login");
    };

    console.log(allData);
    console.log('1', overviewStats);
    console.log('2', requestsOverTime);
    console.log('3', requestsByFacility);
    console.log('4', severityDistribution)
    console.log('5', avgResolutionTime)

    return (
        <div className="min-h-screen bg-gray-100">
            <AdminNavbar onLogout={handleLogout} />

            {/* 🔹 Dashboard Content */}
            <div className="p-6 bg-white shadow-md rounded-lg mx-4 mt-4">
                {/* Overview Stats */}
                <h2 className="text-2xl font-semibold mb-4">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-6 bg-blue-200 rounded-lg text-center shadow-md">
                        <h3 className="text-lg font-semibold">Total Requests</h3>
                        <p className="text-3xl font-bold">{overviewStats.totalRequests}</p>
                    </div>
                    <div className="p-6 bg-yellow-200 rounded-lg text-center shadow-md">
                        <h3 className="text-lg font-semibold">Pending Closing Requests</h3>
                        <p className="text-3xl font-bold">{overviewStats.pendingClosingRequests}</p>
                    </div>
                    <div className="p-6 bg-gray-300 rounded-lg text-center shadow-md">
                        <h3 className="text-lg font-semibold">Closed Requests</h3>
                        <p className="text-3xl font-bold">{overviewStats.statusCounts?.Closed || 0}</p>
                    </div>
                    <div className="p-6 bg-green-200 rounded-lg text-center shadow-md">
                        <h3 className="text-lg font-semibold">Avg. Resolution Time</h3>
                        <p className="text-3xl font-bold">{(avgResolutionTime / (1000 * 60 * 60 * 24)).toFixed(2)} days</p>
                    </div>
                </div>

                {/* Charts Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {/* Requests Over Time (Line Chart) */}
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-center mb-1">Requests Over Time</h3>
                        <p className="text-center text-sm text-[#888]">from {`${String(new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).getDate()).padStart(2, '0')}/${String(new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).getMonth() + 1).padStart(2, '0')}/${new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).getFullYear()}`} to {`${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`}</p>
                        <div className="w-[90%] mx-auto">
                            <Line
                                data={{
                                    labels: requestsOverTime.map(r => r._id),
                                    datasets: [
                                        {
                                            label: "Requests",
                                            data: requestsOverTime.map(r => r.count),
                                            backgroundColor: "rgba(54, 162, 235, 0.5)",
                                            borderColor: "blue",
                                            borderWidth: 2
                                        }
                                    ]
                                }}
                            />
                        </div>
                    </div>

                    {/* Requests by Facility (Bar Chart) */}
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-center mb-4">Requests by Facility</h3>
                        <div className="w-[90%] mx-auto">
                            <Bar
                                data={{
                                    labels: requestsByFacility.map(f => f.facilityDetails.name),
                                    datasets: [
                                        {
                                            label: "Requests",
                                            data: requestsByFacility.map(f => f.count),
                                            backgroundColor: "green"
                                        }
                                    ]
                                }}
                            />
                        </div>
                    </div>

                    {/* Severity Distribution (Pie Chart) */}
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-center mb-4">Severity Distribution</h3>
                        <div className="w-[70%] mx-auto">
                            <Pie
                                data={{
                                    labels: severityDistribution.map(s => s._id),
                                    datasets: [
                                        {
                                            label: "Severity",
                                            data: severityDistribution.map(s => s.count),
                                            backgroundColor: ["red", "orange", "yellow"]
                                        }
                                    ]
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}