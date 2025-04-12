using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHD_backend.Data;
using OHD_backend.Models;
using OHD_backend.Models.DTOs;
using System.Threading.Tasks;
using System.Security.Claims;
using System.Linq;
using System;

namespace OHD_backend.Controllers
{
    [ApiController]
    [Route("api/requests")]
    public class RequestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RequestController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetRequests(
            [FromQuery] string? status,
            [FromQuery] string? facility,
            [FromQuery] string? severity,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 10,
            [FromQuery] bool createdByMe = false,
            [FromQuery] bool managing = false,
            [FromQuery] string? assignedTo = null,
            [FromQuery] bool needHandle = false)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRoles = User.FindAll(ClaimTypes.Role).Select(r => r.Value).ToList();

            var query = _context.Requests.AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(r => r.Status == status);

            if (!string.IsNullOrEmpty(facility))
                query = query.Where(r => r.Facility == facility);

            if (!string.IsNullOrEmpty(severity))
                query = query.Where(r => r.Severity == severity);

            // Role-based logic
            if (userRoles.Contains("Admin"))
            {
                // Admin sees all
            }
            else if (userRoles.Contains("Manager"))
            {
                if (createdByMe)
                {
                    query = query.Where(r => r.CreatedBy == userId);
                }
                else if (!string.IsNullOrEmpty(assignedTo))
                {
                    query = query.Where(r => r.AssignedTo == assignedTo);
                }
                else
                {
                    var managedFacility = await _context.Facilities.FirstOrDefaultAsync(f => f.HeadManager == userId);
                    if (managedFacility == null)
                        return StatusCode(403, new { message = "You are not responsible for any facility." });

                    if (managing)
                    {
                        query = query.Where(r => r.Facility == managedFacility.FacilityId);
                    }

                    if (needHandle)
                    {
                        query = query.Where(r => r.ClosingReason != null && r.ManagerHandle == null);
                    }
                }
            }
            else if (userRoles.Contains("Technician"))
            {
                if (createdByMe)
                {
                    query = query.Where(r => r.CreatedBy == userId);
                }
                else if (!string.IsNullOrEmpty(assignedTo))
                {
                    query = query.Where(r => r.AssignedTo == assignedTo);
                }
            }
            else
            {
                query = query.Where(r => r.CreatedBy == userId);
            }

            // Pagination
            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)limit);

            var requests = await query
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return Ok(new
            {
                TotalItems = totalItems,
                TotalPages = totalPages,
                CurrentPage = page,
                Data = requests
            });
        }


        [HttpGet("{requestId}")]
        public async Task<IActionResult> GetRequest(string requestId)
        {
            var request = await _context.Requests.FirstOrDefaultAsync(m => m.RequestId == requestId);
            if (request == null)
            {
                return NotFound();
            }
            return Ok(request);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] CreateRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var request = new Request
            {
                CreatedBy = dto.CreatedBy,
                Facility = dto.Facility,
                Title = dto.Title,
                Severity = dto.Severity,
                Description = dto.Description,
                Status = dto.Status ?? "Unassigned",
                Remarks = dto.Remarks ?? "",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                RequestId = $"Req{DateTime.UtcNow.Ticks}"
            };

            _context.Add(request);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetRequest), new { requestId = request.RequestId }, request);
        }

        [HttpPut("{requestId}")]
        public async Task<IActionResult> UpdateRequest(string requestId, [FromBody] UpdateRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var request = await _context.Requests.FirstOrDefaultAsync(r => r.RequestId == requestId);
                if (request == null)
                    return NotFound(new { message = "Request not found" });

                // Update properties conditionally
                if (!string.IsNullOrEmpty(dto.AssignedBy)) request.AssignedBy = dto.AssignedBy;
                if (!string.IsNullOrEmpty(dto.AssignedTo)) request.AssignedTo = dto.AssignedTo;
                if (!string.IsNullOrEmpty(dto.Status)) request.Status = dto.Status;
                if (!string.IsNullOrEmpty(dto.Remarks)) request.Remarks = dto.Remarks;
                if (!string.IsNullOrEmpty(dto.ClosingReason)) request.ClosingReason = dto.ClosingReason;
                if (!string.IsNullOrEmpty(dto.ManagerHandle)) request.ManagerHandle = dto.ManagerHandle;

                request.UpdatedAt = DateTime.UtcNow;

                // Fetch related users
                var requestUser = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.CreatedBy);
                var assignedTechnician = !string.IsNullOrEmpty(dto.AssignedTo)
                    ? await _context.Users.FirstOrDefaultAsync(u => u.UserId == dto.AssignedTo)
                    : null;
                var facilityManager = !string.IsNullOrEmpty(dto.AssignedBy)
                    ? await _context.Users.FirstOrDefaultAsync(u => u.UserId == dto.AssignedBy)
                    : null;

                // Handle update action (placeholder logic)
                switch (dto.UpdateAction)
                {
                    case "assign_technician":
                        // TODO: Add email to technician and requester
                        break;

                    case "start_work":
                        // TODO: Notify technician and requester
                        break;

                    case "complete_work":
                        // TODO: Notify requester
                        break;

                    case "submit_closing_reason":
                        // TODO: Notify facility manager
                        break;

                    case "manager_approve":
                        // TODO: Notify requester
                        break;

                    case "manager_decline":
                        // TODO: Notify requester
                        break;

                    case "update_remarks":
                        // TODO: Notify technician
                        break;

                    case "manager_reject":
                        // TODO: Notify requester
                        break;

                    default:
                        Console.WriteLine("No email action required.");
                        break;
                }

                await _context.SaveChangesAsync();
                return Ok(request);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("Error updating request: " + ex.Message);
                return BadRequest(new { error = ex.Message });
            }
        }


        [HttpDelete("{requestId}")]
        public async Task<IActionResult> DeleteRequest(string requestId)
        {
            var request = await _context.Requests.FirstOrDefaultAsync(r => r.RequestId == requestId);
            if (request == null)
            {
                return NotFound();
            }

            _context.Requests.Remove(request);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
