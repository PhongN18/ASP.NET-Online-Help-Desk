namespace OHD_backend.Models
{
    public class Request
    {
        public int Id { get; set; } // Auto-incremented by EF
        public string? RequestId { get; set; } // Custom Request ID
        public string? CreatedBy { get; set; } // User ID
        public string? AssignedTo { get; set; } // User ID
        public string? AssignedBy { get; set; } // User ID
        public string? Facility { get; set; }
        public string? Title { get; set; }
        public string? Severity { get; set; }
        public string? Description { get; set; }
        public string? ClosingReason { get; set; }
        public string? ManagerHandle { get; set; }
        public string? Status { get; set; } // Unassigned, Assigned, Work in progress, Closed, Rejected
        public string? Remarks { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigational properties (optional, for relationship with users and facilities)
        public User? CreatedByUser { get; set; }
        public User? AssignedToUser { get; set; }
        public Facility? FacilityDetails { get; set; }
    }
}
