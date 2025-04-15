import DashboardNavbar from "@/components/DashboardNavbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserNotifications() {
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [notiCount, setNotiCount] = useState(0)
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const authToken = localStorage.getItem("authToken");
    
        if (!authToken) {
            navigate("/login");
            return;
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
    }, []);
    
    

    const handleDeleteAll = async () => {
        const authToken = localStorage.getItem("authToken");

        await fetch(`http://localhost:5129/api/notification/clear/${user.userId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
        setNotifications([]);
        setNotiCount(0)
    };

    const markAsRead = async (notifId) => {
        const authToken = localStorage.getItem("authToken");
        try {
            const res = await fetch(`http://localhost:5129/api/notification/${notifId}/read`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (res.ok) {
                // Update only that notification in local state
                setNotifications(prev =>
                    prev.map(n => n.id === notifId ? { ...n, isRead: true } : n)
                );
            }
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    }

    const markAllAsRead = async (userId) => {
        const authToken = localStorage.getItem("authToken");
    
        try {
            const res = await fetch(`http://localhost:5129/api/notification/${userId}/read-all`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
    
            if (!res.ok) {
                throw new Error("Failed to mark notifications as read.");
            }
    
            const data = await res.json();
    
            // Optimistically update frontend
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );
    
            console.log(`${data.updatedCount} notifications marked as read.`);
        } catch (err) {
            console.error("Error marking all as read:", err.message);
        }
    };

    const deleteNotif = async (notifId) => {
        const authToken = localStorage.getItem("authToken");
        try {
            const res = await fetch(`http://localhost:5129/api/notification/${notifId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== notifId));
                setNotiCount(prev => prev - 1)
            }
        } catch (err) {
            console.error("Failed to delete notification:", err);
        }
    }

    if (loading) return <p className="p-4 text-center">Loading notifications...</p>;
    
    return (
        <div className="bg-gray-100">
            <DashboardNavbar user={user} />
            <div className="p-6 max-w-4xl min-h-[100vh] mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">Your Notifications ({notiCount})</h2>
                    {notifications.length > 0 && (
                    <div className="flex gap-4">
                        <button
                            onClick={() => markAllAsRead(user.userId)}
                            className="bg-white border-black border-1 px-4 py-2 rounded hover:border-black hover:opacity-75"
                            >
                            Mark All as Read
                        </button>
                        <button
                            onClick={handleDeleteAll}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 outline-none border-red-500 hover:border-red-600"
                            >
                            Delete All
                        </button>
                    </div>
                    )}
                </div>
                <ul className="space-y-4">
                    {notifications.length === 0 ? (
                    <p className="text-gray-500">No notifications available.</p>
                    ) : (
                    notifications
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .map((notif, index) => (
                            <li key={index}>
                                <div
                                    onClick={() => markAsRead(notif.id)}
                                    className={`p-4 mb-3 rounded-md shadow-md cursor-pointer transition hover:bg-gray-50 ${
                                        notif.isRead ? "bg-gray-200 text-gray-50" : "bg-white font-bold"
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-800">{notif.message}</p>
                                            <p className="text-xs text-gray-500">{new Date(notif.timestamp).toLocaleString()}</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}>❌</button>
                                    </div>
                                    {notif.requestId && (
                                        <button
                                            className="mt-2 px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/request-detail/${notif.requestId}`); }}
                                        >
                                            View Details
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
