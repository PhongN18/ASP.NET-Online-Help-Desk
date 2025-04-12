import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminNavbar({ onLogout }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <nav className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
            <h1 className="text-2xl font-semibold cursor-pointer" onClick={() => navigate("/admin")}>
                Admin Dashboard
            </h1>

            <div className="relative">
                {/* Dropdown Button */}
                <button
                    className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-700 transition"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                    Manage ⬇
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg text-gray-800 border border-gray-200">
                        <button
                            className="block px-4 py-2 w-full text-left hover:bg-gray-200 transition"
                            onClick={() => { navigate("/admin/manage-facilities"); setDropdownOpen(false); }}
                        >
                            Manage Facilities
                        </button>
                        <button
                            className="block px-4 py-2 w-full text-left hover:bg-gray-200 transition"
                            onClick={() => { navigate("/admin/manage-users"); setDropdownOpen(false); }}
                        >
                            Manage Users
                        </button>
                    </div>
                )}
            </div>

            {/* Logout Button */}
            <button
                onClick={onLogout}
                className="bg-red-500 px-4 py-2 rounded hover:bg-red-700 transition"
            >
                Logout
            </button>
        </nav>
    );
}
