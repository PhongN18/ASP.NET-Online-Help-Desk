using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHD_backend.Data;
using OHD_backend.Models;
using OHD_backend.Models.DTOs;
using BCrypt.Net;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace OHD_backend.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateUser([FromBody] UserDto userDto)
        {
            if (userDto == null)
                return BadRequest("User data is required.");

            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == userDto.Email);
            if (existingUser != null)
                return BadRequest("Email already in use.");

            var newUserId = $"U{(await _context.Users.CountAsync() + 1).ToString().PadLeft(6, '0')}";

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(userDto.Password);

            var user = new User
            {
                UserId = newUserId,
                Email = userDto.Email,
                Name = userDto.Name,
                Password = hashedPassword,
                Roles = userDto.Roles?.Count > 0 ? new List<string>(userDto.Roles) : new List<string> { "Requester" },
                Status = "Active"
            };

            if (user.Roles.Contains("Manager") && !user.Roles.Contains("Technician"))
                user.Roles.Add("Technician");

            if (user.Roles.Contains("Admin"))
                user.Roles = new List<string> { "Admin" };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { userId = user.UserId }, user);
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers([FromQuery] string role = null, [FromQuery] string status = null)
        {
            var filter = _context.Users.AsQueryable();

            if (!string.IsNullOrEmpty(role))
                filter = filter.Where(u => u.Roles.Contains(role));

            if (!string.IsNullOrEmpty(status))
                filter = filter.Where(u => u.Status == status);

            var users = await filter.ToListAsync();
            return Ok(users);
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUser(string userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(user);
        }

        [HttpPut("{userId}")]
        public async Task<IActionResult> UpdateUser(string userId, [FromBody] UserDto userDto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                return NotFound(new { message = "User not found" });

            user.Name = userDto.Name ?? user.Name;
            user.Email = userDto.Email ?? user.Email;

            if (!string.IsNullOrEmpty(userDto.Password))
                user.Password = BCrypt.Net.BCrypt.HashPassword(userDto.Password);

            if (userDto.Roles?.Count > 0)
            {
                user.Roles = userDto.Roles;

                if (user.Roles.Contains("Manager") && !user.Roles.Contains("Technician"))
                    user.Roles.Add("Technician");

                if (user.Roles.Contains("Admin"))
                    user.Roles = new List<string> { "Admin" };
            }

            await _context.SaveChangesAsync();
            return Ok(user);
        }

        [HttpDelete("{userId}")]
        public async Task<IActionResult> DeleteUser(string userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                return NotFound(new { message = "User not found" });

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully" });
        }
    }
}
