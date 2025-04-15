using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHD_backend.Data;
using OHD_backend.Models;
using System.Globalization;

namespace OHD_backend.Controllers
{
    [ApiController]
    [Route("api/requests/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public AdminDashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/requests/admin/overview-stats
        [HttpGet("overview-stats")]
        public async Task<IActionResult> GetOverviewStats()
        {
            var totalRequests = await _context.Requests.CountAsync();
            var pendingClosingRequests = await _context.Requests
                .Where(r => r.ClosingReason != null && r.ManagerHandle == null)
                .CountAsync();

            var statusCounts = await _context.Requests
                .GroupBy(r => r.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.Status, g => g.Count);

            return Ok(new
            {
                totalRequests,
                pendingClosingRequests,
                statusCounts
            });
        }

        // GET: api/requests/admin/requests-over-time
        [HttpGet("requests-over-time")]
        public async Task<IActionResult> GetRequestsOverTime()
        {
            var sixMonthsAgo = DateTime.UtcNow.AddMonths(-5);
            var result = _context.Requests
                .Where(r => r.CreatedAt >= sixMonthsAgo)
                .AsEnumerable()
                .GroupBy(r => r.CreatedAt.ToString("yyyy-MM", CultureInfo.InvariantCulture))
                .Select(g => new { _id = g.Key, count = g.Count() })
                .OrderBy(x => x._id)
                .ToList();

            return Ok(result);
        }

        // GET: api/requests/admin/requests-by-facility
        [HttpGet("requests-by-facility")]
        public async Task<IActionResult> GetRequestsByFacility()
        {
            var result = await _context.Requests
                .GroupBy(r => r.Facility)
                .Select(g => new
                {
                    FacilityId = g.Key,
                    Count = g.Count()
                }).ToListAsync();

            var facilities = await _context.Facilities.ToDictionaryAsync(f => f.FacilityId);

            var finalResult = result.Select(r => new
            {
                facilityId = r.FacilityId,
                count = r.Count,
                facilityDetails = facilities.ContainsKey(r.FacilityId)
                    ? new { facilities[r.FacilityId].FacilityId, facilities[r.FacilityId].Name }
                    : null
            });

            return Ok(finalResult);
        }

        // GET: api/requests/admin/severity-distribution
        [HttpGet("severity-distribution")]
        public async Task<IActionResult> GetSeverityDistribution()
        {
            var result = await _context.Requests
                .GroupBy(r => r.Severity)
                .Select(g => new { _id = g.Key, count = g.Count() })
                .ToListAsync();

            return Ok(result);
        }

        // GET: api/requests/admin/average-resolution-time
        [HttpGet("average-resolution-time")]
        public async Task<IActionResult> GetAverageResolutionTime()
        {
            var closedRequests = await _context.Requests
                .Where(r => r.Status == "Closed" && r.UpdatedAt > r.CreatedAt)
                .ToListAsync();

            if (closedRequests.Count == 0)
            {
                return Ok(new { avgResolutionTime = 0 });
            }

            var avgTime = closedRequests
                        .Where(r => r.UpdatedAt != null && r.CreatedAt != null)
                        .Average(r => (r.UpdatedAt - r.CreatedAt).TotalMilliseconds);

            return Ok(new { avgResolutionTime = avgTime });
        }
    }
}