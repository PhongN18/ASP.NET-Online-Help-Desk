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
    const [notifications, setNotifications] = useState([]);
    const [notiCount, setNotiCount] = useState(0);
    const [unreadNotiCount, setUnreadNotiCount] = useState(0);
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

        const fetchUserAndNotifications = async () => {
            try {
                const response = await fetch("http://localhost:5129/api/auth/me", {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
    
                if (!response.ok) {
                    navigate('/login')
                    throw new Error("Session expired. Please log in again.");
                }
    
                const data = await response.json();
                setUser(data); // store user in state
    
                // ✅ Now fetch notifications using userId
                const res = await fetch(`http://localhost:5129/api/notification/${data.userId}`, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });
    
                const notiData = await res.json();
                
                setNotifications(notiData.notifications);
                setNotiCount(notiData.count)
                setUnreadNotiCount(notiData.unreadCount)
    
            } catch (err) {
                console.error("Error fetching user or notifications:", err);
                setError(err.message);
                localStorage.removeItem("authToken");
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };
    
        fetchUserAndNotifications();
    }, [navigate]);

    if (loading) return <p className="text-center p-6">Loading dashboard...</p>;
    if (error) return <p className="text-center p-6 text-red-500">{error}</p>;

    return (
        <div  style={{minHeight: '100vh'}}>
            <DashboardNavbar user={user} />
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <RequestList user={user} view={view} currentPage={currentPage} setCurrentPage={setCurrentPage}/>
                <div className="flex flex-col gap-2">
                    <button
                        className={`py-3 text-red-500 rounded transition relative border-red-500 border-[3px] hover:border-red-500`}
                        onClick={() => navigate('/notifications')}
                    >
                        Notifications
                        {unreadNotiCount > 0 && (
                            <span className='absolute top-[-15%] right-[-4%] rounded-full inline-flex w-6 h-6'>
                                <span className="bg-red-500 text-white h-full w-full rounded-full">{`${unreadNotiCount}`}</span>
                            </span>
                        )}
                    </button>
                    <RoleBasedActions roles={user.roles} setView={setView} setCurrentPage={setCurrentPage}/>
                </div>
            </div>
        </div>
    );
}
