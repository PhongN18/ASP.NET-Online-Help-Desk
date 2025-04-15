import * as signalR from "@microsoft/signalr";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

// Create context
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [connection, setConnection] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5129/hubs/notifications", {
                accessTokenFactory: () => token,
                withCredentials: true
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, []);

    useEffect(() => {
        if (!connection) return;

        connection
            .start()
            .then(() => {
                console.log("✅ SignalR connected.");
                connection.on("ReceiveNotification", (data) => {
                    toast(data.message); // toast for real-time
                    setNotifications(prev => [data, ...prev]);
                });
            })
            .catch((err) => console.error("❌ SignalR connection failed:", err));

        return () => {
            connection?.stop();
        };
    }, [connection]);

    return (
        <NotificationContext.Provider value={{ notifications, setNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};

// Custom hook
export const useNotifications = () => useContext(NotificationContext);
