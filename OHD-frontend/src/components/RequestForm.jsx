import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RequestForm({ user }) {
    // Define form configuration based on request structure
    const formConfig = [
        {
            name: "title",
            label: "Request Title",
            type: "text",
            options: [],
        },
        {
            name: "severity",
            label: "Severity Level",
            type: "select",
            options: ["Low", "Medium", "High"],
        },
        {
            name: "description",
            label: "Issue Description",
            type: "textarea",
        },
    ];

    const initialState = {};
    formConfig.forEach((field) => {
        initialState[field.name] = "";
    });

    const [formData, setFormData] = useState(initialState);
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    // Fetch user data and facilities on component mount
    useEffect(() => {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
            navigate("/login");
            return;
        }

        const fetchFacilities = async () => {
            try {
                const response = await fetch("http://localhost:5129/api/facilities", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    },
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch facilities.");
                }
                const data = await response.json();
                setFacilities(data);
            } catch (err) {
                setMessage({ type: "error", text: "Failed to fetch facilities." });
            }
        };

        fetchFacilities();
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Get auth token from localStorage (already stored when user logged in)
        const authToken = localStorage.getItem("authToken");

        // Construct request data (use "Unassigned" with U in uppercase)
        const requestData = {
            RequestId: `Req${new Date().getTime()}`,
            CreatedBy: user.userId,
            Facility: formData.facility,
            Title: formData.title,
            Severity: formData.severity,
            Description: formData.description,
            Status: "Unassigned",
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
            UserEmail: user.email
        };

        console.log(requestData)

        try {
            const response = await fetch("http://localhost:5129/api/requests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(requestData),
            });
            const result = await response.json();
            if (response.ok) {
                setMessage({ type: "success", text: "Request submitted successfully!" });
                setFormData(initialState); // Reset form after successful submission
                
                // Redirect to dashboard after 1 second
                setTimeout(() => {
                    navigate("/dashboard");
                }, 1000);
            } else {
                setMessage({ type: "error", text: result.error || "Failed to submit request." });
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setMessage({ type: "error", text: "Network error. Try again later." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="custom-container py-8 flex justify-center">
            <Card className="p-6 w-1/2 bg-white shadow-md ">
                <CardContent>
                    <h2 className="text-xl font-semibold mb-4 text-center">Create New Request</h2>
                    {message && (
                        <div className={`p-3 mb-3 text-white rounded ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
                            {message.text}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2">Select Facility</label>
                            <select
                                name="facility"
                                value={formData.facility}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Facility</option>
                                {facilities.map((facility) => (
                                    <option key={facility.facilityId} value={facility.facilityId}>
                                        {facility.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {formConfig.map((field) => (
                            <div key={field.name} className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">{field.label}</label>
                                {field.type === "select" ? (
                                    <select
                                        name={field.name}
                                        value={formData[field.name]}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">{`Select ${field.label}`}</option>
                                        {field.options.map((option) => (
                                            <option key={option.facility_id} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                ) : field.type === "textarea" ? (
                                    <Textarea
                                        name={field.name}
                                        placeholder={field.label}
                                        value={formData[field.name]}
                                        onChange={handleChange}
                                        required
                                        className="w-full h-24 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        name={field.name}
                                        placeholder={field.label}
                                        value={formData[field.name]}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                )}
                            </div>
                        ))}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Submitting..." : "Submit Request"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
