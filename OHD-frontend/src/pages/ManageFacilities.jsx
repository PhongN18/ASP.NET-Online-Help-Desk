import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select"; // Import React-Select
import AdminNavbar from "../components/AdminNavbar";

export default function ManageFacilities() {
    const [facilities, setFacilities] = useState([]);
    const [managers, setManagers] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editFacility, setEditFacility] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [facilityToDelete, setFacilityToDelete] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newFacility, setNewFacility] = useState({ name: '', location: '' });
    const [hoveredUser, setHoveredUser] = useState(null);
    const [conflictMessage, setConflictMessage] = useState("");
    const [technicianConflicts, setTechnicianConflicts] = useState({});
    const [pendingUpdate, setPendingUpdate] = useState(null);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false)
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [facilityNameError, setFacilityNameError] = useState(""); // New state for error message

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

        fetchFacilities(authToken);
        fetchManagers(authToken);
        fetchTechnicians(authToken);
    }, [showDeleteModal, showCreateModal, showEditModal]);

    /** Fetch all facilities */
    const fetchFacilities = async (authToken) => {
        try {
            const res = await fetch("http://localhost:5129/api/facilities", {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
            });

            if (!res.ok) throw new Error("Failed to fetch facilities.");
            const data = await res.json();
            setFacilities(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    /** Fetch all managers (users with "Manager" role) */
    const fetchManagers = async (authToken) => {
        try {
            const res = await fetch("http://localhost:5129/api/users?role=Manager", {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
            });

            if (!res.ok) throw new Error("Failed to fetch managers.");
            const data = await res.json();
            setManagers(data);
        } catch (err) {
            console.error("Error fetching managers:", err);
        }
    };

    /** Fetch all technicians (users with "Technician" role) */
    const fetchTechnicians = async (authToken) => {
        try {
            const res = await fetch("http://localhost:5129/api/users?role=Technician", {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
            });

            if (!res.ok) throw new Error("Failed to fetch technicians.");
            const data = await res.json();
            setTechnicians(data);
        } catch (err) {
            console.error("Error fetching technicians:", err);
        }
    };

    const handleManagerChange = (selected) => {
        setEditFacility(prev => ({
            ...prev,
            headManager: selected ? selected.value : "", // Set manager as single value
            shouldUpdateHeadManager: true
        }));
    };

    const handleTechnicianChange = (selectedTechnicians) => {
        const techIds = selectedTechnicians.map((tech) => tech.value);
        setEditFacility({ ...editFacility, technicians: techIds, shouldUpdateTechnicians: true });
    };

    const handleEdit = (facility) => {
        setEditFacility({ ...facility, shouldUpdateHeadManager: false, shouldUpdateTechnicians: false });
        setShowEditModal(true)
    };

    const checkForConflicts = () => {
        let conflict = [];
        let previousFacility = null;
        const conflictMap = {}; // Temporary dict to track conflicting techs by facility

        // Check if selected manager is already managing another facility
        if (editFacility.headManager) {
            const existingFacility = facilities.find(f => f.headManager === editFacility.headManager && f.facilityId !== editFacility.facilityId);
            if (existingFacility) {
                conflict.push(
                    <div key="manager-conflict">
                        <strong>The selected manager</strong> is currently the head of <strong>{existingFacility.name}</strong>
                    </div>
                );
                previousFacility = existingFacility;
            }
        }

        // Check if any selected technicians are already assigned elsewhere
        const conflictingTechnicians = technicians.filter(tech =>
            editFacility.technicians.includes(tech.userId) &&
            facilities.some(f => f.technicians?.includes(tech.userId) && f.facilityId !== editFacility.facilityId)
        );

        if (conflictingTechnicians.length > 0) {
            conflict.push(
                <div key="technician-conflict">
                    <strong>The following technicians</strong> are already assigned to another facility:
                    <ul className="list-disc pl-8">
                        {conflictingTechnicians.map(t => {
                            const facility = facilities.find(f => f.technicians?.includes(t.userId) && f.facilityId !== editFacility.facilityId);
                            if (facility) {
                                if (!conflictMap[facility.facilityId]) conflictMap[facility.facilityId] = [];
                                conflictMap[facility.facilityId].push(t.userId);
                            }
                            return <li key={t.userId}>{t.name} - ID: {t.userId}</li>;
                        })}
                    </ul>
                </div>
            )
        }

        if (conflict.length > 0) {
            conflict.push(<p key="msg" className="my-4">Changing this will remove them from their previous facility.</p>)
            setConflictMessage(conflict);
            if (previousFacility) {
                setPendingUpdate({ previousFacility });
            } else {
                setPendingUpdate(null); // reset to avoid carrying over old state
            }
            setTechnicianConflicts(conflictMap); // ✅ Save the mapping
            setShowConfirmationModal(true);
        } else {
            handleUpdateFacility();
        }
    };

    const handleUpdateFacility = async () => {
        try {
            const authToken = localStorage.getItem("authToken");

            if (pendingUpdate?.previousFacility) {
                // If the previous facility had this manager, remove the manager
                console.log(pendingUpdate.previousFacility);
                
                await fetch(`http://localhost:5129/api/facilities/${pendingUpdate.previousFacility.facilityId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                    body: JSON.stringify({ headManager: null, shouldUpdateHeadManager: true }),
                });
            }

            // Remove conflicting technicians from their previous facilities
            for (const [facilityId, techIds] of Object.entries(technicianConflicts)) {
                const targetFacility = facilities.find(f => f.facilityId === facilityId);
                const updatedTechnicians = targetFacility.technicians.filter(tid => !techIds.includes(tid));
                
                await fetch(`http://localhost:5129/api/facilities/${facilityId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                    body: JSON.stringify({ technicians: updatedTechnicians, shouldUpdateTechnicians: true }),
                });
            }
            
            console.log(editFacility);
            
            // Update Facility
            const res = await fetch(`http://localhost:5129/api/facilities/${editFacility.facilityId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                body: JSON.stringify(editFacility),
            });

            if (!res.ok) throw new Error("Failed to update facility.");
            alert("Facility updated successfully.");
            setPendingUpdate(null);
            setTechnicianConflicts({});
            setEditFacility(null);
            setShowEditModal(false);
            setShowConfirmationModal(false);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteFacility = async () => {
        try {
            console.log(facilityToDelete)
            const authToken = localStorage.getItem("authToken");
            const res = await fetch(`http://localhost:5129/api/facilities/${facilityToDelete}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
            });

            if (!res.ok) throw new Error("Failed to delete facility.");
            alert("Facility deleted successfully.");
            setShowDeleteModal(false);
        } catch (err) {
            alert(err.message);
        }
    };

    /** Handle Create Facility */
    const handleCreateFacility = async () => {
        // Check if facility name already exists
        const facilityExists = facilities.some(facility => facility.name.toLowerCase() === newFacility.name.toLowerCase());
        if (facilityExists) {
            setFacilityNameError("Facility name already exists. Please choose a different name.");
            return; // Prevent further execution if facility name exists
        } else {
            setFacilityNameError(""); // Clear error message if name is unique
        }

        try {
            const authToken = localStorage.getItem("authToken");

            if (!newFacility.name) {
                setFacilityNameError("Facility name is required");
                return; // Prevent submission if name is missing
            } else if (!newFacility.location) {
                setFacilityNameError("Location is required");
                return; // Prevent submission if name is missing
            }

            const res = await fetch(`http://localhost:5129/api/facilities`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                body: JSON.stringify(newFacility),
            });

            if (!res.ok) throw new Error("Failed to create facility.");
            alert("Facility created successfully.");
            setShowCreateModal(false);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        navigate("/login");
    };

    if (loading) return <p>Loading facilities...</p>;
    if (error) return <p>Error: {error}</p>;

    const managerOptions = managers?.map(manager => ({
        value: manager.userId,
        label: `${manager.name} - ID: ${manager.userId} - ${facilities?.find(f => f.headManager === manager.userId)?.name || 'Unassigned'}`
    }))

    /** Convert Technicians to Select Options */
    const technicianOptions = technicians?.map(tech => ({
        value: tech.userId,
        label: `${tech.name} - ID: ${tech.userId} - ${facilities?.find(f => f.technicians?.includes(tech.userId))?.name || 'Unassigned'}`
    }));
    
    // console.log(facilities)
    // console.log(technicians)

    return (
        <>
            <AdminNavbar onLogout={handleLogout} />
            <div className="p-6 bg-white min-h-[100vh]">
                <h2 className="text-2xl font-semibold mb-4">Manage Facilities</h2>

                {/* Create New Facility Button */}
                <button
                    className="bg-green-500 text-white px-4 py-2 rounded mb-4"
                    onClick={() => setShowCreateModal(true)}
                >
                    Add New Facility
                </button>

                {/* Facilities Table */}
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border">Facility ID</th>
                            <th className="p-2 border">Name</th>
                            <th className="p-2 border">Head Manager</th>
                            <th className="p-2 border">Technicians</th>
                            <th className="p-2 border">Location</th>
                            <th className="p-2 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {facilities.map((facility) => (
                            <tr key={facility.facilityId} className="border">
                                <td className="p-2 border text-center">{facility.facilityId}</td>
                                <td className="p-2 border">{facility.name}</td>
                                <td className="p-2 border relative">
                                    <span
                                        className="cursor-pointer hover:text-white hover:bg-black transition-all rounded-2xl p-2"
                                        onMouseEnter={(e) => {
                                            setHoveredUser({
                                                name: managers.find(m => m.userId === facility.headManager)?.name || "Unnassigned",
                                                id: facility.headManager ? facility.headManager : null
                                            });
                                            setTooltipPosition({ x: e.clientX, y: e.clientY });
                                        }}
                                        onMouseLeave={() => setHoveredUser(null)}
                                    >
                                        {managers?.find(m => m.userId === facility.headManager)?.name || "Unassigned"}
                                    </span>
                                </td>
                                <td className="p-2 border">
                                    {facility.technicians?.map(techId => {
                                        const technician = technicians?.find(t => t.userId === techId);
                                        return (
                                            <span
                                                key={techId}
                                                className="mr-2 text-blue-600 relative cursor-pointer hover:text-white hover:bg-blue-500 transition-all rounded-2xl p-2"
                                                onMouseEnter={(e) => {
                                                    setHoveredUser({ name: technician?.name, id: techId });
                                                    setTooltipPosition({ x: e.clientX, y: e.clientY });
                                                }}
                                                onMouseLeave={() => setHoveredUser(null)}
                                            >
                                                {technician?.name || "Unknown"}
                                            </span>
                                        );
                                    })}
                                </td>
                                <td className="p-2 border">{facility.location}</td>
                                <td className="p-2 border text-center">
                                    <button className="bg-blue-500 text-white px-3 py-1 rounded mr-2" onClick={() => handleEdit(facility)}>Edit</button>
                                    <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => { setShowDeleteModal(true); setFacilityToDelete(facility.facilityId); }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Floating Tooltip */}
                {hoveredUser && (
                    <div
                        className="absolute bg-gray-800 text-white text-sm px-2 py-1 rounded shadow-md"
                        style={{
                            top: tooltipPosition.y - 50 + "px",
                            left: tooltipPosition.x - 50 + "px",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {hoveredUser.name} {hoveredUser.id ? '(ID: ' + hoveredUser.id + ')' : ''}
                    </div>
                )}

                {showCreateModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                        <div className="bg-white p-6 rounded shadow-md w-96">
                            <h3 className="text-xl font-semibold mb-4">Add New Facility</h3>
                            <p className="text-red-500 text-sm">{facilityNameError}</p>
                            <input type="text" className="border p-2 w-full rounded mb-2" placeholder="Facility Name" onChange={(e) => {setNewFacility({ ...newFacility, name: e.target.value })}} />
                            <input type="text" className="border p-2 w-full rounded mb-2" placeholder="Facility Location" onChange={(e) => {setNewFacility({ ...newFacility, location: e.target.value })}} />
                            <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleCreateFacility}>
                                Create
                            </button>
                            <button className="bg-gray-400 px-4 py-2 rounded ml-3" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit Facility Modal */}
                {editFacility && showEditModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                        <div className="bg-white p-6 rounded shadow-md w-96">
                            <h3 className="text-xl font-semibold mb-4">Edit Facility</h3>
                            <input type="text" className="border p-2 w-full rounded mb-2" value={editFacility.name} onChange={(e) => setEditFacility({ ...editFacility, name: e.target.value })} />
                            <label htmlFor="">Head Manager</label>
                            <Select
                                options={managerOptions}
                                placeholder="Select Manager"
                                value={managerOptions.find(opt => editFacility.headManager === opt.value) || null} // Find single selected option
                                className="mb-2"
                                onChange={(selected) => handleManagerChange(selected)} // Handle selection
                            />
                            <label htmlFor="">Facility's Technicians</label>
                            <Select
                                options={technicianOptions}
                                isMulti
                                placeholder="Select Technicians"
                                value={technicianOptions.filter(opt => editFacility.technicians?.includes(opt.value))}
                                className="mb-2"
                                onChange={(selected) => handleTechnicianChange(selected, true)}
                            />
                            <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={checkForConflicts}>
                                Save
                            </button>
                            <button className="bg-gray-400 px-4 py-2 rounded ml-3" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {showConfirmationModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                        <div className="bg-white p-6 rounded shadow-md">
                            <div>{conflictMessage}</div>
                            <button className="text-white bg-blue-500 mr-3" onClick={handleUpdateFacility}>Yes, Continue</button>
                            <button className="bg-gray-400" onClick={() => setShowConfirmationModal(false)}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* Delete Facility Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                        <div className="bg-white p-6 rounded shadow-md w-96">
                            <h3 className="text-xl font-semibold text-red-600 mb-4">Delete Facility</h3>
                            <p className="mb-1">Are you sure you want to delete <strong>{facilities.find(f => f.facilityId === facilityToDelete)?.name}</strong>? This action cannot be undone.</p>
                            <p className="mb-4 text-sm text-red-500"><strong>Head Manager and Technicians</strong> of this Facility will be set to <span className="underline text-gray-400 font-bold">unassigned</span>.</p>
                            <div className="flex justify-end">
                                <button className="bg-gray-500 text-white px-4 py-2 rounded mr-2" onClick={() => setShowDeleteModal(false)}>
                                    Cancel
                                </button>
                                <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleDeleteFacility}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
