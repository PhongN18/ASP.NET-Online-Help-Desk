namespace OHD_backend.Models.DTOs
{
    public class CreateFacilityDto
    {
        public string Name { get; set; }
        public string? Location { get; set; }
        public string? HeadManager { get; set; }
    }

    public class UpdateFacilityDto
    {
        public string? Name { get; set; }
        public string? Location { get; set; }
        public string? Status { get; set; }
        public string? HeadManager { get; set; }
        public bool ShouldUpdateHeadManager { get; set; }
        public List<string>? Technicians { get; set; }
        public bool ShouldUpdateTechnicians { get; set; }
    }
}
