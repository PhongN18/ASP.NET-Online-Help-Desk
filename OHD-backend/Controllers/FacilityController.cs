using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHD_backend.Data;
using OHD_backend.Models;
using OHD_backend.Models.DTOs;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace OHD_backend.Controllers
{
    [ApiController]
    [Route("api/facilities")]
    public class FacilityController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FacilityController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateFacility([FromBody] CreateFacilityDto dto)
        {
            if (dto == null)
                return BadRequest("Facility data is required.");

            var existingFacility = await _context.Facilities
                .FirstOrDefaultAsync(f => f.Name == dto.Name);

            if (existingFacility != null)
                return BadRequest("Facility already exists.");

            var facility = new Facility
            {
                Name = dto.Name,
                Location = dto.Location ?? "Not specified",
                Status = "Operating",
                HeadManager = dto.HeadManager,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Facilities.Add(facility);
            await _context.SaveChangesAsync(); // This is where Id gets generated

            // Now assign FacilityId based on generated Id
            facility.FacilityId = $"F{facility.Id.ToString().PadLeft(3, '0')}";
            await _context.SaveChangesAsync(); // Save the FacilityId

            return CreatedAtAction(nameof(GetFacility), new { facilityId = facility.FacilityId }, facility);
        }

        [HttpGet]
        public async Task<IActionResult> GetFacilities()
        {
            var facilities = await _context.Facilities.ToListAsync();
            return Ok(facilities);
        }

        [HttpGet("{facilityId}")]
        public async Task<IActionResult> GetFacility(string facilityId)
        {
            var facility = await _context.Facilities.FirstOrDefaultAsync(f => f.FacilityId == facilityId);

            if (facility == null)
            {
                return NotFound(new { message = "Facility not found" });
            }

            return Ok(facility);
        }

        [HttpPut("{facilityId}")]
        public async Task<IActionResult> UpdateFacility(string facilityId, [FromBody] UpdateFacilityDto dto)
        {
            var facility = await _context.Facilities.FirstOrDefaultAsync(f => f.FacilityId == facilityId);

            if (facility == null)
            {
                return NotFound(new { message = "Facility not found" });
            }

            facility.Name = dto.Name;
            facility.Status = dto.Status;
            facility.Location = dto.Location;

            _context.Facilities.Update(facility);
            await _context.SaveChangesAsync();

            return Ok(facility);
        }

        [HttpDelete("{facilityId}")]
        public async Task<IActionResult> DeleteFacility(string facilityId)
        {
            var facility = await _context.Facilities.FirstOrDefaultAsync(f => f.FacilityId == facilityId);

            if (facility == null)
            {
                return NotFound(new { message = "Facility not found" });
            }

            _context.Facilities.Remove(facility);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Facility deleted successfully" });
        }
    }
}
