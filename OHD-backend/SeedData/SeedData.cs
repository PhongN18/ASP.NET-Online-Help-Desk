using Microsoft.EntityFrameworkCore;
using OHD_backend.Models;
using OHD_backend.Data;

namespace OHD_backend.SeedData
{
    public static class SeedData
    {
        static readonly List<string> FacilityNames = new() { "Lab", "Library", "Gym", "Cafeteria", "Computer Center", "Pool" };
        static readonly List<string> RequestTitles = new() { "System Error", "Facility Maintenance", "Equipment Repair", "Server Issue", "Cleaning Required", "Power Outage", "Temperature Issue", "Network Issue", "Security Problem" };
        static readonly List<string> RequestDescriptions = new()
        {
            "WiFi is unstable across the 2nd floor.",
            "AC not working in Lab 1.",
            "Server slow during simulations.",
            "Power outage last night in Cafeteria.",
            "Projector not displaying in training room.",
            "Flickering lights in the hallway.",
            "Broken window in library.",
            "Cleaning required in restroom.",
            "Fire alarm false triggering.",
            "Coffee machine leaking."
        };

        public static async Task Initialize(ApplicationDbContext context)
        {
            await SeedUsers(context);
            await SeedFacilities(context);
            await SeedRequests(context);
        }

        public static async Task SeedUsers(ApplicationDbContext context)
        {
            if (await context.Users.AnyAsync()) return;

            var users = new List<User>();

            // Admin
            users.Add(new User
            {
                UserId = "U000001",
                Name = "Admin User",
                Email = "admin@ohd.com",
                Password = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                Roles = new List<string> { "Admin" },
                Status = "Active"
            });

            // Managers
            for (int i = 0; i < FacilityNames.Count; i++)
            {
                users.Add(new User
                {
                    UserId = $"U{(i + 2).ToString().PadLeft(6, '0')}",
                    Name = $"Manager {i + 1}",
                    Email = $"manager{i + 1}@ohd.com",
                    Password = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                    Roles = new List<string> { "Manager", "Technician", "Requester" },
                    Status = "Active"
                });
            }

            // Technicians (5 per facility)
            for (int i = 0; i < FacilityNames.Count * 5; i++)
            {
                users.Add(new User
                {
                    UserId = $"U{(i + FacilityNames.Count + 2).ToString().PadLeft(6, '0')}",
                    Name = $"Technician {i + 1}",
                    Email = $"technician{i + 1}@ohd.com",
                    Password = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                    Roles = new List<string> { "Technician", "Requester" },
                    Status = Random.Shared.Next(10) > 0 ? "Active" : "Inactive"
                });
            }

            // Requesters (100)
            for (int i = 0; i < 100; i++)
            {
                users.Add(new User
                {
                    UserId = $"U{(i + FacilityNames.Count * 6 + 2).ToString().PadLeft(6, '0')}",
                    Name = $"Requester {i + 1}",
                    Email = $"requester{i + 1}@ohd.com",
                    Password = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                    Roles = new List<string> { "Requester" },
                    Status = Random.Shared.Next(5) > 0 ? "Active" : "Inactive"
                });
            }

            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();
        }

        public static async Task SeedFacilities(ApplicationDbContext context)
        {
            if (await context.Facilities.AnyAsync()) return;

            for (int i = 0; i < FacilityNames.Count; i++)
            {
                var technicians = new List<string>
                    {
                        $"U{(i * 5 + FacilityNames.Count + 2).ToString().PadLeft(6, '0')}",
                        $"U{(i * 5 + FacilityNames.Count + 2 + 1).ToString().PadLeft(6, '0')}",
                        $"U{(i * 5 + FacilityNames.Count + 2 + 2).ToString().PadLeft(6, '0')}",
                        $"U{(i * 5 + FacilityNames.Count + 2 + 3).ToString().PadLeft(6, '0')}",
                        $"U{(i * 5 + FacilityNames.Count + 2 + 4).ToString().PadLeft(6, '0')}"
                    };

                var facility = new Facility
                {
                    FacilityId = $"F{(i + 1).ToString().PadLeft(3, '0')}",
                    Name = FacilityNames[i],
                    Location = $"{FacilityNames[i]} Location",
                    Status = "Operating",
                    HeadManager = $"U{(i + 2).ToString().PadLeft(6, '0')}",
                    Technicians = technicians,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await context.Facilities.AddAsync(facility);
            }
            await context.SaveChangesAsync();
        }

        public static async Task SeedRequests(ApplicationDbContext context)
        {
            if (await context.Requests.AnyAsync()) return;

            var requests = new List<Request>();
            var statusOptions = new[] { "Unassigned", "Assigned", "Work in progress", "Closed", "Rejected" };
            var severityOptions = new[] { "Low", "Medium", "High" };

            var start = new DateTime(2024, 8, 1);
            var end = new DateTime(2025, 2, 15);

            for (int i = 0; i < 500; i++)
            {
                var facilityRandom = Random.Shared.Next(1, FacilityNames.Count);
                var facility = $"F{facilityRandom.ToString().PadLeft(3, '0')}";
                var status = statusOptions[Random.Shared.Next(statusOptions.Length)];
                var severity = severityOptions[Random.Shared.Next(severityOptions.Length)];
                var createdBy = $"U{Random.Shared.Next(2, (FacilityNames.Count + 6 + 100)).ToString().PadLeft(6, '0')}";

                string? assignedTo = null;
                string? assignedBy = null;
                var createdAt = start.AddDays(Random.Shared.Next((end - start).Days));
                var updatedAt = createdAt;

                if (status == "Work in progress" || status == "Closed" || status == "Assigned")
                {
                    assignedTo = (status != "Unassigned" && status != "Rejected") ? $"U{Random.Shared.Next(facilityRandom * 5 + 2, facilityRandom * 5 + 6).ToString().PadLeft(6, '0')}" : null;
                    assignedBy = (assignedTo != null) ? $"U{(facilityRandom + 1).ToString().PadLeft(6, '0')}" : null;
                    updatedAt = createdAt.AddDays(Random.Shared.Next(1, 10));
                }

                if (status == "Rejected")
                {
                    updatedAt = createdAt.AddDays(Random.Shared.Next(1, 10));
                }

                var request = new Request
                {
                    RequestId = $"Req{createdAt.Ticks}",
                    CreatedBy = createdBy,
                    AssignedTo = assignedTo,
                    Facility = facility,
                    Title = RequestTitles[Random.Shared.Next(RequestTitles.Count)],
                    Severity = severity,
                    Description = RequestDescriptions[Random.Shared.Next(RequestDescriptions.Count)],
                    Status = status,
                    Remarks = status == "Assigned" ? "Assigned to technician" : status == "Closed" ? "Request closed" : null,
                    AssignedBy = assignedBy,
                    CreatedAt = createdAt,
                    UpdatedAt = updatedAt
                };

                requests.Add(request);
            }

            await context.Requests.AddRangeAsync(requests);
            await context.SaveChangesAsync();
        }
    }
}
