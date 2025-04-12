import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RoleBasedActions({ roles, setView, setCurrentPage }) {
    const navigate = useNavigate();
    const [closingRequestCount, setClosingRequestCount] = useState(0);

    useEffect(() => {
        const fetchClosingRequestCount = async () => {
            try {
                const response = await fetch("http://localhost:5129/api/requests?needHandle=true", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
                });

                if (!response.ok) throw new Error("Failed to fetch closing requests.");

                const data = await response.json();
                
                setClosingRequestCount(data.requests?.length || 0); // Ensure it gets the count
            } catch (err) {
                console.error(err.message);
            }
        };

        fetchClosingRequestCount();

        // Optionally, refresh the count every 30 seconds
        const interval = setInterval(fetchClosingRequestCount, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white shadow-md p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Available Actions</h2>
            <div className="flex flex-col gap-3">
                <button
                    className="p-3 bg-white text-blue-500 rounded border-[3px] border-blue-500"
                    onClick={() => navigate('/create-request')}
                >
                    Create New Request
                </button>
                <button
                    className="p-3 bg-blue-500 text-white rounded border-none"
                    onClick={() => { setView("my_requests"); setCurrentPage(1); }}
                >
                    View My Requests
                </button>

                {roles.includes("Manager") && (
                    <>
                        <button
                            className="p-3 bg-green-500 text-white rounded border-none"
                            onClick={() => { setView("facility_requests"); setCurrentPage(1); }}
                        >
                            View Facility Requests and Assign
                        </button>
                        <button
                            className={`p-3 text-red-500 rounded transition relative border-red-500 border-[3px] hover:border-red-500`}
                            onClick={() => { setView("need_handle"); setCurrentPage(1); }}
                        >
                            View Closing Requests from Users
                            {closingRequestCount > 0 && (
                                <span className='absolute top-[-15%] right-[-4%] rounded-full inline-flex w-6 h-6'>
                                    <span className="animate-ping absolute bg-red-500 h-full w-full rounded-full"></span>
                                    <span className="bg-red-500 text-white h-full w-full rounded-full">{closingRequestCount > 0 && `${closingRequestCount}`}</span>
                                </span>
                            )}
                        </button>
                    </>
                )}

                {roles.includes("Technician") && (
                    <button
                        className="p-3 bg-yellow-500 text-white rounded border-none"
                        onClick={() => { setView("assigned_requests"); setCurrentPage(1); }}
                    >
                        View Assigned Requests
                    </button>
                )}
            </div>
        </div>
    );
}
