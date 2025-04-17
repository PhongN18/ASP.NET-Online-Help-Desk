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
            "The air conditioning unit in the conference room is not cooling effectively. It has been making unusual noises, and the airflow is weak even at maximum settings. Requesting maintenance to check and repair it.",
            "There is a system malfunction affecting the main facility’s security access. Employees are unable to scan their badges at certain entrances, causing delays during check-ins.",
            "The server in Lab 3 is experiencing frequent crashes and slow response times. Several researchers have reported difficulties in running simulations and accessing critical files.",
            "One of the power outlets in the office is sparking when plugging in a device. This poses a serious safety hazard and needs immediate attention from the electrical maintenance team.",
            "Multiple Wi-Fi connectivity issues in the staff lounge and meeting rooms. The connection frequently drops, making it difficult for employees to access online resources during work hours.",
            "The projector in the training room is not turning on. It was working fine yesterday, but now it fails to display any output even after checking the connections.",
            "The cafeteria requires urgent cleaning as there has been a spill near the food counter, causing a slipping hazard for staff and visitors. Requesting immediate sanitation services.",
            "The office heating system is not functioning, and employees are experiencing extreme cold in the mornings. The issue has persisted for a few days despite adjusting the thermostat.",
            "Several ceiling lights in the parking area have gone out, making it difficult for employees to navigate safely at night. The area is dimly lit, and it may pose a security risk.",
            "A strange burning smell is coming from one of the copy machines in the printing room. It appears to be overheating and may require immediate inspection before use.",
            "Water leakage detected in the restroom on the second floor. The sink pipes seem to be loose, and water is pooling under the counter. This may cause further damage if left unresolved.",
            "One of the office chairs in the meeting room is broken, making it unsafe for use. The backrest is loose, and the wheels are unstable. Requesting a replacement or repair.",
            "There is a delay in opening the front gate due to a possible issue with the automatic locking mechanism. Employees with morning shifts have been struggling to enter the premises on time.",
            "The fire alarm in the main hallway has been going off intermittently without any apparent cause. This is causing unnecessary panic among staff, and it needs to be checked for malfunctions.",
            "The coffee machine in the break room is not dispensing properly. Several employees have reported that the machine leaks water and the buttons are unresponsive.",
            "The office printer is constantly jamming paper, making it impossible to print important documents. Even after clearing the jam, it continues to malfunction.",
            "Several employees have reported flickering lights in the conference room, which is causing discomfort during long meetings. The bulbs may need to be checked or replaced.",
            "The main entrance door is not closing properly. It remains slightly open after each use, which could lead to security concerns and increased energy costs for air conditioning.",
            "One of the elevators in the building is making a loud screeching noise and occasionally stops between floors. It has caused concerns among employees, and maintenance is urgently needed.",
            "A section of the carpet in the waiting area is torn, creating a tripping hazard for visitors. It needs to be repaired or replaced to prevent accidents.",
            "The water dispenser in the lobby is leaking, leaving puddles on the floor. This could be a slipping hazard, and the maintenance team needs to inspect the issue.",
            "The kitchen sink in the employee lounge is clogged, causing water to back up and making it difficult to wash dishes. It needs to be unclogged as soon as possible.",
            "The air vents in the storage room are dusty and blocked, leading to poor ventilation and an unpleasant odor in the space. A thorough cleaning is required.",
            "The electronic attendance system at the main entrance is failing to register employee check-ins. This is causing discrepancies in work hour records and needs to be fixed immediately.",
            "The backup generator did not activate during the recent power outage. This could be a major issue during emergencies, and an inspection is required to ensure proper functionality.",
            "There has been a pest sighting in the pantry area, with several reports of ants and cockroaches near food storage. Pest control intervention is required to address the issue.",
            "The restroom stall doors on the third floor do not lock properly, leading to complaints from employees about privacy concerns. The locks need to be repaired or replaced.",
            "The sound system in the auditorium is producing static noise and intermittent sound loss during events. This is affecting presentations and needs to be checked by a technician.",
            "The company vehicle assigned for deliveries is making unusual engine noises and seems to struggle when accelerating. A thorough checkup is needed before further use."
        };
        static readonly List<string> ClosingReasons = new() {
            "The issue has been resolved on my end.",
            "I found an alternative solution, no further action needed.",
            "The problem no longer occurs, so I’m closing the request.",
            "I managed to fix it myself, no assistance required.",
            "The request was submitted by mistake.",
            "I have received help from another source, request is no longer needed.",
            "The issue was temporary and has resolved itself.",
            "I misunderstood the problem, no action is necessary.",
            "The situation has changed, and this request is no longer relevant.",
            "I no longer require this service or support.",
            "Another department has already handled the issue.",
            "The equipment started working again, no repair needed.",
            "After a restart, the issue disappeared.",
            "A colleague assisted me in fixing the problem.",
            "I was able to resolve it following online instructions.",
            "The request is no longer urgent, and I will submit a new one later if needed.",
            "The issue was minor and does not require intervention.",
            "The power/internet/connection was restored, so no further help is needed.",
            "A workaround has been found, so I’m closing this request.",
            "I was able to reset the system and fix the issue myself."
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
            var notifications = new List<Notification>();
            var statusOptions = new[] { "Unassigned", "Assigned", "Work in progress", "Closed", "Rejected" };
            var severityOptions = new[] { "Low", "Medium", "High" };
            var managerHandleOptions = new[] { "approve", "decline", null };

            var start = new DateTime(2024, 8, 1);
            var end = new DateTime(2025, 4, 15);
            var totalDurationTicks = (end - start).Ticks;
            var intervalTicks = totalDurationTicks / 500;

            for (int i = 0; i < 500; i++)
            {
                var facilityRandom = Random.Shared.Next(1, FacilityNames.Count);
                var facility = $"F{facilityRandom.ToString().PadLeft(3, '0')}";
                var status = statusOptions[Random.Shared.Next(statusOptions.Length)];
                var severity = severityOptions[Random.Shared.Next(severityOptions.Length)];
                var createdBy = $"U{Random.Shared.Next(2, (FacilityNames.Count + 6 + 100)).ToString().PadLeft(6, '0')}";
                var title = RequestTitles[Random.Shared.Next(RequestTitles.Count)];

                string? assignedTo = null;
                string? assignedBy = null;
                var slotStart = start.Ticks + (i * intervalTicks);
                var slotEnd = slotStart + intervalTicks;
                var randomTicks = slotStart + (long)(Random.Shared.NextDouble() * (slotEnd - slotStart));
                var createdAt = new DateTime(randomTicks);
                var updatedAt = createdAt;

                if (status == "Work in progress" || status == "Closed" || status == "Assigned")
                {
                    assignedTo = (status != "Unassigned" && status != "Rejected") ? $"U{Random.Shared.Next(facilityRandom * 5 + 2, facilityRandom * 5 + 6).ToString().PadLeft(6, '0')}" : null;
                    assignedBy = (assignedTo != null) ? $"U{(facilityRandom + 1).ToString().PadLeft(6, '0')}" : null;
                    updatedAt = createdAt.AddMinutes(Random.Shared.Next(10, 600));
                }

                if (status == "Rejected")
                {
                    updatedAt = createdAt.AddMinutes(Random.Shared.Next(10, 600));
                }

                var request = new Request
                {
                    RequestId = $"Req{createdAt.Ticks}",
                    CreatedBy = createdBy,
                    AssignedTo = assignedTo,
                    Facility = facility,
                    Title = title,
                    Severity = severity,
                    Description = RequestDescriptions[Random.Shared.Next(RequestDescriptions.Count)],
                    Status = status,
                    Remarks = status == "Assigned" ? "Assigned to technician" : status == "Closed" ? "Request closed" : null,
                    AssignedBy = assignedBy,
                    CreatedAt = createdAt,
                    UpdatedAt = updatedAt
                };

                var reasonSubmitted = Random.Shared.Next(2) == 1 ? true : false;
                string? closingReason = null;
                string? managerHandle = null;

                if (reasonSubmitted && status != "Rejected")
                {
                    closingReason = ClosingReasons[Random.Shared.Next(ClosingReasons.Count)];
                    request.ClosingReason = closingReason;

                    if (status == "Closed")
                    {
                        var closedByUser = Random.Shared.Next(2) == 1 ? true : false;
                        if (closedByUser)
                        {
                            managerHandle = "approve";
                        }
                        else
                        {
                            managerHandle = "decline";
                        }
                    }
                    else
                    {
                        managerHandle = managerHandleOptions[Random.Shared.Next(managerHandleOptions.Length)];
                    }


                    if (managerHandle != null) request.ManagerHandle = managerHandle;
                }

                requests.Add(request);

                notifications.Add(new Notification
                {
                    UserId = createdBy,
                    Message = $"Your request \"{title}\" was created.",
                    IsRead = false,
                    Timestamp = createdAt,
                    RequestId = request.RequestId
                });
                notifications.Add(new Notification
                {
                    UserId = $"U{(facilityRandom + 1).ToString().PadLeft(6, '0')}",
                    Message = $"There is a new request submitted to your facility.",
                    IsRead = false,
                    Timestamp = createdAt,
                    RequestId = request.RequestId
                });

                if (status == "Rejected")
                {
                    notifications.Add(new Notification
                    {
                        UserId = $"U{(facilityRandom + 1).ToString().PadLeft(6, '0')}",
                        Message = $"You have rejected request \"{title}\".",
                        IsRead = false,
                        Timestamp = updatedAt,
                        RequestId = request.RequestId
                    });

                    notifications.Add(new Notification
                    {
                        UserId = createdBy,
                        Message = $"Your request \"{title}\" has been rejected by facility manager.",
                        IsRead = false,
                        Timestamp = updatedAt,
                        RequestId = request.RequestId
                    });
                }

                if (assignedTo != null)
                {
                    notifications.Add(new Notification
                    {
                        UserId = assignedBy,
                        Message = $"You have assigned a request to technician {assignedTo}.",
                        IsRead = false,
                        Timestamp = updatedAt,
                        RequestId = request.RequestId
                    });

                    notifications.Add(new Notification
                    {
                        UserId = assignedTo,
                        Message = $"There is a new request assigned to you.",
                        IsRead = false,
                        Timestamp = updatedAt,
                        RequestId = request.RequestId
                    });

                    notifications.Add(new Notification
                    {
                        UserId = createdBy,
                        Message = $"Your request \"{title}\" has been assigned to technician.",
                        IsRead = false,
                        Timestamp = updatedAt,
                        RequestId = request.RequestId
                    });

                    if (status == "Closed")
                    {
                        notifications.Add(new Notification
                        {
                            UserId = assignedTo,
                            Message = $"A request assigned to you has been closed.",
                            IsRead = false,
                            Timestamp = updatedAt,
                            RequestId = request.RequestId
                        });
                        notifications.Add(new Notification
                        {
                            UserId = createdBy,
                            Message = $"Your request \"{title}\" has been closed.",
                            IsRead = false,
                            Timestamp = updatedAt,
                            RequestId = request.RequestId
                        });
                    }
                }

                if (reasonSubmitted)
                {
                    notifications.Add(new Notification
                    {
                        UserId = createdBy,
                        Message = $"You have submitted a closing reason for your request \"{title}\".",
                        IsRead = false,
                        Timestamp = updatedAt,
                        RequestId = request.RequestId
                    });

                    notifications.Add(new Notification
                    {
                        UserId = $"U{(facilityRandom + 1).ToString().PadLeft(6, '0')}",
                        Message = $"There is a new request that needs handling.",
                        IsRead = false,
                        Timestamp = createdAt,
                        RequestId = request.RequestId
                    });

                    if (managerHandle != null)
                    {
                        notifications.Add(new Notification
                        {
                            UserId = $"U{(facilityRandom + 1).ToString().PadLeft(6, '0')}",
                            Message = $"You have {managerHandle}d the closing request for \"{title}\".",
                            IsRead = false,
                            Timestamp = updatedAt,
                            RequestId = request.RequestId
                        });

                        notifications.Add(new Notification
                        {
                            UserId = createdBy,
                            Message = $"Your closing request for \"{title}\" has been {managerHandle}d.",
                            IsRead = false,
                            Timestamp = updatedAt,
                            RequestId = request.RequestId
                        });
                    }
                }
            }

            await context.Requests.AddRangeAsync(requests);
            await context.Notifications.AddRangeAsync(notifications);
            await context.SaveChangesAsync();
        }
    }
}
