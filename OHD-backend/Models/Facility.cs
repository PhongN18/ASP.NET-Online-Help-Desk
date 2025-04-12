namespace OHD_backend.Models
{
    public class Facility
    {
        public int Id { get; set; } // Auto-incremented by EF
        public string? FacilityId { get; set; } // Unique ID for the facility
        public string? Name { get; set; }
        public string? HeadManager { get; set; }
        public string? Status { get; set; } // Operating, Under Maintenance, etc.
        public string? Location { get; set; }

        // Timestamp-like fields are handled by EF Core automatically if configured (CreatedAt, UpdatedAt)
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Relationship with technicians (one-to-many or many-to-many)
        public List<string>? Technicians { get; set; }
    }
}
