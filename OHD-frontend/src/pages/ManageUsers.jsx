import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";

export default function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(""); // Changed from array to string
    const [editUser, setEditUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", roles: ["Requester"], status: "Active" });

    // Filters
    const [selectedRoles, setSelectedRoles] = useState(['Admin', 'Manager', 'Technician', 'Requester']);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedFacility, setSelectedFacility] = useState("");

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        const isTokenExpired = (token) => {
            if (!token) return true;
        
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                const expiryTime = payload.exp * 1000;
                return expiryTime < Date.now();
            } catch (error) {
                return true;
            }
        };

        const authToken = localStorage.getItem("authToken");

        if (!authToken || isTokenExpired(authToken)) {
            localStorage.removeItem("authToken");
            navigate("/login");
            return; // Added return to prevent further execution
        }

        const fetchUsers = async (page) => {
            setLoading(true);
            try {
                let url = `http://localhost:5129/api/users?page=${page}&limit=10`;

                if (selectedRoles.length > 0) {
                    url += `&roles=${selectedRoles.join(",")}`;
                }

                if (selectedStatus) {
                    url += `&status=${selectedStatus}`;
                }

                if (selectedFacility) {
                    url += `&facility=${selectedFacility}`;
                }

                const res = await fetch(url, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                });

                if (!res.ok) throw new Error("Failed to fetch users.");
                const data = await res.json();
                
                // Check if data and data.data exist before setting state
                if (data && data.data) {
                    setUsers(data.data);
                    setTotalPages(data.totalPages || 1); // Provide fallback value
                } else {
                    setUsers([]);
                    setTotalPages(1);
                }
            } catch (err) {
                setError(err.message || "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        };

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

        fetchUsers(currentPage);
        fetchFacilities(authToken)
    }, [currentPage, selectedRoles, selectedStatus, selectedFacility, navigate]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleRoleChange = (role) => {
        setSelectedRoles((prevRoles) =>
            prevRoles.includes(role) ? prevRoles.filter((r) => r !== role) : [...prevRoles, role]
        );
        setCurrentPage(1);
    };

    const handleStatusChange = (e) => {
        setSelectedStatus(e.target.value);
        setCurrentPage(1);
    };

    const handleFacilityChange = (e) => {
        setSelectedFacility(e.target.value);
        setCurrentPage(1)
    }

    const handleEdit = (user) => {
        setEditUser({...user});
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        
        if (!editUser) return;

        setLoading(true);
        try {
            const authToken = localStorage.getItem("authToken");
            if (!authToken) {
                throw new Error("Authentication token not found");
            }

            let formatRoles = ['Requester']
            if (editUser.roles.includes('Manager')) {
                formatRoles = ['Manager', 'Technician', 'Requester']
            } else if (editUser.roles.includes('Technician')) {
                formatRoles = ['Technician', 'Requester']
            }
            
            const res = await fetch(`http://localhost:5129/api/users/${editUser.user_id}`, {
                method: 'PUT',
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    name: editUser.name,
                    email: editUser.email,
                    roles: formatRoles,
                    status: editUser.status
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update user");
            }
            
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user.user_id === editUser.user_id ? editUser : user
                )
            );
            
            setShowEditModal(false);
            setError(""); // Clear any previous errors
        } catch (err) {
            setError(err.message || "An error occurred while updating the user");
        } finally {
            setLoading(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditUser(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEditRoleChange = (role) => {
        setEditUser(prev => {
            let updatedRoles = [...prev.roles];
    
            if (role === 'Admin') {
                // If 'Admin' is selected, deselect all other roles
                updatedRoles = ['Admin'];
            } else {
                // If another role is selected, ensure 'Admin' is deselected
                if (updatedRoles.includes('Admin')) {
                    updatedRoles = updatedRoles.filter(r => r !== 'Admin');
                }
    
                // Toggle the selected role
                updatedRoles = updatedRoles.includes(role)
                    ? updatedRoles.filter(r => r !== role)  // Remove the role
                    : [...updatedRoles, role];  // Add the role
            }
    
            return {
                ...prev,
                roles: updatedRoles
            };
        });
    };
    

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        
        try {
            const authToken = localStorage.getItem("authToken");
            if (!authToken) {
                throw new Error("Authentication token not found");
            }
            
            const res = await fetch(`http://localhost:5129/api/users/${userToDelete}`, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${authToken}`
                }
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to delete user");
            }
            
            setUsers(prevUsers => prevUsers.filter(user => user.user_id !== userToDelete));
            setShowDeleteModal(false);
            setError(""); // Clear any previous errors
        } catch (err) {
            setError(err.message || "An error occurred while deleting the user");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        navigate("/login");
    };

    return (
        <>
            <AdminNavbar onLogout={handleLogout} />
            <div className="bg-white p-6 min-h-[100vh]">
                <h2 className="text-2xl font-semibold mb-4">Manage Users</h2>
                
                {/* Display any errors at the top */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p>{error}</p>
                    </div>
                )}
                
                <div className="flex justify-between items-center mb-4">
                    <div className="">
                        {/* Role Filter (Multi-select) */}
                        <div>
                            <label className="font-semibold">Filter by Role:</label>
                            <div className="flex space-x-2 mt-1">
                                {["Admin", "Manager", "Technician", "Requester"].map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => handleRoleChange(role)}
                                        className={`px-3 py-1 border rounded ${
                                            selectedRoles.includes(role) ? "bg-blue-500 text-white" : "bg-gray-200"
                                        }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Facility Filter (Dropdown) */}
                    <div>
                        <label className="font-semibold">Filter by Facility:</label>
                        <select
                            value={selectedFacility}
                            onChange={handleFacilityChange}
                            className="border p-2 rounded ml-2"
                        >
                            <option value="">All</option>
                            {facilities?.map(facility => (
                                <option key={facility.facility_id} value={facility.facility_id}>{facility.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Status Filter (Dropdown) */}
                    <div>
                        <label className="font-semibold">Filter by Status:</label>
                        <select
                            value={selectedStatus}
                            onChange={handleStatusChange}
                            className="border p-2 rounded ml-2"
                        >
                            <option value="">All</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-end items-center">
                        <span className="text-center mr-4 leading-10">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className={`px-4 py-2 rounded ${
                                currentPage === 1 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 text-white"
                            }`}
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                        >
                            &lt; First
                        </button>
                        <button
                            className={`px-4 py-2 rounded ml-2 ${
                                currentPage === 1 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 text-white"
                            }`}
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <button
                            className={`px-4 py-2 rounded ml-2 ${
                                currentPage === totalPages ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 text-white"
                            }`}
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                        <button
                            className={`px-4 py-2 rounded ml-2 ${
                                currentPage === totalPages ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 text-white"
                            }`}
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            Last &gt;
                        </button>
                    </div>
                </div>

                

                {/* Loading Indicator */}
                {loading && (
                    <div className="flex justify-center my-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                )}

                {/* Users Table */}
                <table className="w-full table-auto border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 border">User ID</th>
                            <th className="p-2 border">Name</th>
                            <th className="p-2 border">Email</th>
                            <th className="p-2 border">Role</th>
                            <th className="p-2 border">Facility</th>
                            <th className="p-2 border">Status</th>
                            <th className="p-2 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center p-4">No users found.</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.user_id} className="border">
                                    <td className="p-2 border text-center">{user.user_id}</td>
                                    <td className="p-2 border">{user.name}</td>
                                    <td className="p-2 border">{user.email}</td>
                                    <td className="p-2 border text-center">{user.roles[0]}</td>
                                    {user.roles[0] === 'Manager' ? (
                                        <td className="p-2 border text-center">{facilities?.find(f => f.head_manager === user.user_id).name}</td>
                                    ) : (user.roles[0] === 'Technician' ? (
                                        <td className="p-2 border text-center">{facilities?.find(f => f.technicians.includes(user.user_id)).name}</td>
                                    ) : (
                                        <td className="p-2 border text-center"></td>
                                    ))}
                                    <td className="p-2 border">{user.status}</td>
                                    <td className="p-2 border text-center">
                                        <button
                                            className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                                            onClick={() => handleEdit(user)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="bg-red-500 text-white px-3 py-1 rounded"
                                            onClick={() => {
                                                setShowDeleteModal(true);
                                                setUserToDelete(user.user_id);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Edit User Modal */}
                {showEditModal && editUser && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                            <h3 className="text-xl font-semibold mb-4">Edit User</h3>
                            <form onSubmit={handleUpdateUser}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editUser.name}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={editUser.email}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Roles</label>
                                    <div className="flex flex-wrap gap-2">
                                        {["Admin", "Manager", "Technician", "Requester"].map((role) => (
                                            <button
                                                type="button"
                                                key={role}
                                                onClick={() => handleEditRoleChange(role)}
                                                className={`px-3 py-1 border rounded ${
                                                    editUser.roles.includes(role) ? "bg-blue-500 text-white" : "bg-gray-200"
                                                }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">Status</label>
                                    <select
                                        name="status"
                                        value={editUser.status}
                                        onChange={handleEditChange}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        className="bg-gray-300 px-4 py-2 rounded"
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-500 text-white px-4 py-2 rounded"
                                    >
                                        Update User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete User Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
                            <p className="mb-4">Are you sure you want to delete this user? This action cannot be undone.</p>
                            <div className="flex justify-end gap-2">
                                <button
                                    className="bg-gray-300 px-4 py-2 rounded"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="bg-red-500 text-white px-4 py-2 rounded"
                                    onClick={handleDeleteUser}
                                >
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