namespace OHD_backend.Models.DTOs
{
    public class CreateRequestDto
    {
        public string CreatedBy { get; set; }
        public string Facility { get; set; }
        public string Title { get; set; }
        public string Severity { get; set; }
        public string Description { get; set; }
        public string? Status { get; set; }
        public string? Remarks { get; set; }
    }

    public class UpdateRequestDto
    {
        public string? UpdateAction { get; set; }
        public string? Status { get; set; }
        public string? Remarks { get; set; }
        public string? AssignedBy { get; set; }
        public string? AssignedTo { get; set; }
        public string? ClosingReason { get; set; }
        public string? ManagerHandle { get; set; }
    }
}
