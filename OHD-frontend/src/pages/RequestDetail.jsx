import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";

export default function RequestDetail() {
    const [user, setUser] = useState(null);
    const { request_id } = useParams();
    const [request, setRequest] = useState(null);
    const [facility, setFacility] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [manager, setManager] = useState();
    const [technicians, setTechnicians] = useState([]);
    const [assignedTechnician, setAssignedTechnician] = useState()
    const [selectedTechnician, setSelectedTechnician] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [closingReason, setClosingReason] = useState("");
    const [showTechnicianDropdown, setShowTechnicianDropdown] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [showCompleteConfirmModal, setShowCompleteConfirmModal] = useState(false);
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
    
        const fetchRequestDetail = async () => {
            try {
                const response = await fetch(`http://localhost:5129/api/requests/${request_id}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });

                if (!response.ok) throw new Error("Failed to fetch request details.");
                const requestData = await response.json();
                setRequest(requestData);
                console.log(requestData)
                setClosingReason(requestData.closing_reason)

                // Fetch facility, manager, and technicians only if request exists
                fetchFacilityDetail(requestData.facility, authToken);

                if (requestData.assigned_to) {
                    fetchAssignedTechnicianDetail(requestData.assigned_to, authToken);
                }
            } catch (err) {
                setError(err.message);
            }
        };
    
        fetchUser();
        fetchRequestDetail();
    }, [request_id]);

    /** Fetch Facility Details */
    const fetchFacilityDetail = async (facilityId, authToken) => {
        try {
            const facilityResponse = await fetch(`http://localhost:5129/api/facilities/${facilityId}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!facilityResponse.ok) throw new Error("Failed to fetch facility details.");
            const facilityData = await facilityResponse.json();
            setFacility(facilityData);

            // Fetch manager and technicians for the facility
            fetchManagerDetail(facilityData.headManager, authToken);
            fetchTechniciansDetail(facilityData.technicians, authToken);
        } catch (err) {
            setError(err.message);
        }
    };

    /** Fetch Manager Details */
    const fetchManagerDetail = async (managerId, authToken) => {
        try {
            const managerResponse = await fetch(`http://localhost:5129/api/users/${managerId}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!managerResponse.ok) throw new Error("Failed to fetch manager details.");
            const managerData = await managerResponse.json();
            setManager(managerData);
        } catch (err) {
            setError(err.message);
        }
    };

    /** Fetch Technicians Details */
    const fetchTechniciansDetail = async (technicianIds, authToken) => {
        try {
            if (technicianIds !== null) {
                const technicianRequests = technicianIds.map((techId) =>
                    fetch(`http://localhost:5129/api/users/${techId}`, {
                        headers: { Authorization: `Bearer ${authToken}` },
                    }).then((res) => res.json())
                );
    
                const techniciansData = await Promise.all(technicianRequests);
                setTechnicians(techniciansData);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchAssignedTechnicianDetail = async (technicianId, authToken) => {
        try {
            const technicianResponse = await fetch(`http://localhost:5129/api/users/${technicianId}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!technicianResponse.ok) throw new Error("Failed to fetch technician details.");
            const technicianData = await technicianResponse.json();
            setAssignedTechnician(technicianData);

        } catch (err) {
            setError(err.message);
        }
    };

    const handleStartWork = async () => {
        try {
            const response = await fetch(`http://localhost:5129/api/requests/${request_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ status: "Work in progress", remarks: "Work is ongoing", update_action: 'start_work' }),
            });

            if (!response.ok) {
                throw new Error("Failed to start work.");
            }

            alert("Work started successfully.");
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleUpdateRemarks = async () => {
        try {
            const response = await fetch(`http://localhost:5129/api/requests/${request_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ remarks, update_action: 'update_remarks' }),
            });

            if (!response.ok) {
                throw new Error("Failed to update remarks.");
            }

            alert("Remarks updated successfully.");
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    }

    const CompleteRequestModal = ({ isOpen, onClose, onConfirm }) => {
        if (!isOpen) return null; // Don't render if modal is closed
    
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                    <h2 className="text-lg font-semibold mb-4">Confirm Completion</h2>
                    <p>Are you sure you want to mark this request as completed?</p>
    
                    <div className="flex justify-end space-x-3 mt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handleCompleteWork = async () => {
        try {
            const response = await fetch(`http://localhost:5129/api/requests/${request_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ status: "Closed", remarks: "Work completed", update_action: 'complete_work' }),
            });

            if (!response.ok) {
                throw new Error("Failed to complete request.");
            }

            alert("Request completed successfully.");
            setShowCompleteConfirmModal(false); // Close the modal after success
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleAssignTechnician = async () => {
        try {
            const response = await fetch(`http://localhost:5129/api/requests/${request_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ assigned_by: user.user_id, assigned_to: selectedTechnician, status: "Assigned", update_action: 'assign_technician' }),
            });

            if (!response.ok) {
                throw new Error("Failed to assign technician.");
            }

            alert("Technician assigned successfully.");
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRejectRequest = async () => {
        try {
            const response = await fetch(`http://localhost:5129/api/requests/${request_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ status: "Rejected", remarks: `Rejected by Manager ${user.name}, reject reason: ${rejectReason}`, update_action: 'manager_reject' }),
            });

            if (!response.ok) {
                throw new Error("Failed to reject request.");
            }

            alert("Request rejected successfully.");
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleClosingReason = async (action) => {
        try {
            const closingUpdate = {}

            if (action === 'approve') {
                closingUpdate.status = 'Closed';
                closingUpdate.closing_reason = `Closed by requester, reason: ${closingReason}`
                closingUpdate.manager_handle = 'approved'
                closingUpdate.remarks = `Approved closing request, reason: ${closingReason}`
                closingUpdate.update_action = 'manager_approve'
            } else {
                closingUpdate.closing_reason = `Closing request declined by manager`
                closingUpdate.manager_handle = 'declined'
                closingUpdate.remarks = `Declined closing request, reason: ${closingReason}`
                closingUpdate.update_action = 'manager_decline'
            }

            const response = await fetch(`http://localhost:5129/api/requests/${request_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify(closingUpdate),
            });

            if (!response.ok) {
                throw new Error("Failed to update closing reason.");
            }

            if (action === "approve") {
                alert("Closing reason approved successfully.");
            } else {
                alert("Closing reason declined successfully.");
            }
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    }

    const handleSubmitClosing = async () => {
        try {
            const response = await fetch(`http://localhost:5129/api/requests/${request_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ closing_reason: closingReason, update_action: 'submit_closing_reason' }),
            });

            if (!response.ok) {
                throw new Error("Failed to close request.");
            }

            alert("Closing request sent to Manager.");
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    }

    if (loading) return <p>Loading request details...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!request) return <p>No request found.</p>;

    const isManagerOfThisFacility = user?.roles.includes("Manager") && user?.user_id === facility?.head_manager;
    // console.log('User', user);
    // console.log('Facility', facility);
    // console.log('Manager', manager);
    // console.log('Technicians', technicians)
    // console.log('assigned', assignedTechnician)
    // console.log('Request', request)
    return (
        <>
            <DashboardNavbar user={user} />
            <div className="p-6 bg-white shadow-md rounded-lg">
                <h2 className="text-2xl font-semibold mb-4">Request Details</h2>
                <p><strong>Request ID:</strong> {request.requestId}</p>
                <p><strong>Facility:</strong> {facility?.name} - {facility?.facilityId}</p>
                <p><strong>Created By:</strong> {request.createdBy}</p>
                <p><strong>Manager:</strong> ID: {manager?.userId} - {manager?.name}</p>
                <p><strong>Technician:</strong> {request.assignedTo ? `ID: ${request.assignedTo} - ` : ''}{assignedTechnician?.name || "Unassigned"}</p>
                <p><strong>Title:</strong> {request.title}</p>
                <p><strong>Severity:</strong> {request.severity}</p>
                <p><strong>Description:</strong> {request.description}</p>
                <p><strong>Remarks:</strong> {request.remarks || "No remarks"}</p>
                {user.userId === request.createdBy && <p><strong>Closing Reason:</strong> {request.closingReason || "No closing reason"}</p>}
                <p><strong>Status:</strong> {request.status}</p>
                <p><strong>Created At:</strong> {Date(request.createdAt).toLocaleString()}</p>
                <p><strong>Updated At:</strong> {Date(request.updatedAt).toLocaleString()}</p>

                {/* Closing Request Handling */}
                {user.user_id === request.created_by && request.status !== 'Rejected' && request.status !== 'Closed' ? (
                    request.closing_reason ? (
                        <div>
                            <h3 className="text-xl font-semibold mt-6">Closing Reason:</h3>
                            <p className="bg-gray-100 p-3 rounded">{request.closing_reason}</p>
                            {request.manager_handle === 'approve' ? (
                                <p className="text-green-600 font-semibold">✅ Closing request approved.</p>
                            ) : request.manager_handle === 'decline' ? (
                                <p className="text-red-600 font-semibold">❌ Closing request declined.</p>
                            ) : (
                                <p className="text-yellow-600 font-semibold">⌛ Waiting for Facility's Head Manager approval...</p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-xl font-semibold mt-6">Close the Request</h3>
                            <p className="text-gray-600">Please provide a reason for closing:</p>
                            <textarea 
                                className="border w-full p-2 rounded" 
                                placeholder="Closing reason" 
                                value={closingReason} 
                                onChange={(e) => setClosingReason(e.target.value)} 
                            />
                            <button 
                                onClick={handleSubmitClosing} 
                                className="px-4 py-2 rounded mt-2 bg-blue-500 text-white"
                            >
                                Send closing request
                            </button>
                        </div>
                    )
                ) : null}


                {/* Technician Actions */}
                {user?.roles.includes("Technician") && user.user_id === request.assigned_to && (
                    <div className="mt-4">
                        {request.status === "Assigned" ? (
                            <button onClick={handleStartWork} className="bg-blue-500 text-white px-4 py-2 rounded">
                                Start Working on Request
                            </button>
                        ) : request.status === "Work in progress" ? (
                            <>
                                <textarea className="border w-full p-2 rounded" placeholder="Update remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                                <button onClick={handleUpdateRemarks} className="px-4 py-2 rounded mt-2 bg-blue-500 text-white" >Update Remarks</button>
                                <br />
                                <button 
                                    onClick={() => setShowCompleteConfirmModal(true)} 
                                    className="bg-green-500 text-white px-4 py-2 rounded mt-2"
                                >
                                    Complete Request
                                </button>

                                {/* Modal for confirming completion */}
                                <CompleteRequestModal
                                    isOpen={showCompleteConfirmModal}
                                    onClose={() => setShowCompleteConfirmModal(false)}
                                    onConfirm={handleCompleteWork}
                                />
                            </>
                        ) : null}
                    </div>
                )}

                {/* Manager Actions */}
                {isManagerOfThisFacility && request.status === "Unassigned" && (
                    <div>
                        <button onClick={() => setShowTechnicianDropdown(!showTechnicianDropdown)} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
                            Assign Technician
                        </button>
                        {showTechnicianDropdown && (
                            <div>
                                <select value={selectedTechnician} onChange={(e) => setSelectedTechnician(e.target.value)} className="border p-2 rounded w-full mt-2">
                                    <option value="">Select Technician</option>
                                    {technicians.map((tech) => (
                                        <option key={tech.user_id} value={tech.user_id}>{tech.name} - ID: {tech.user_id}</option>
                                    ))}
                                </select>
                                {/* Confirm Assignment Button (Disabled if no technician selected) */}
                                <button
                                    onClick={handleAssignTechnician}
                                    className={`px-4 py-2 rounded mt-2 text-white ${selectedTechnician ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 cursor-not-allowed"}`}
                                    disabled={!selectedTechnician} // Disable button if no selection
                                >
                                    Confirm Assignment
                                </button>                            </div>
                            )}
                        <button onClick={() => setShowRejectInput(!showRejectInput)} className="bg-red-500 text-white px-4 py-2 rounded mt-2">
                            Reject Request
                        </button>
                        {showRejectInput && (
                            <>
                                <textarea className="border w-full p-2 rounded mt-2" placeholder="Reason for rejection" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                                <button onClick={handleRejectRequest} className="bg-red-500 text-white px-4 py-2 rounded mt-2">Confirm Rejection</button>
                            </>
                        )}
                    </div>
                )}

                {isManagerOfThisFacility && request.closing_reason && !request.manager_handle && (
                    <div>
                        <h3 className="text-xl font-semibold mt-6 text-red-500"><strong>Closing Reason:</strong> {request.closing_reason}</h3>
                        <button onClick={() => handleClosingReason('approve')} className="px-4 py-2 rounded mt-2 bg-blue-500 text-white" >Approve Closing Reason</button>
                        <button onClick={() => handleClosingReason('decline')} className="px-4 py-2 rounded mt-2 bg-red-500 text-white" >Decline Closing Reason</button>
                    </div>
                )}
            </div>
        </>
    );
}
