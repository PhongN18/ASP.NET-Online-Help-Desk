using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OHD_backend.Data;
using OHD_backend.Models;
using OHD_backend.Models.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace OHD_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(ApplicationDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is required" });

            if (dto.Roles != null && dto.Roles.Contains("Admin"))
                return Forbid("You cannot register as an Admin");

            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest(new { message = "Email is already registered" });

            var lastUser = await _context.Users.OrderByDescending(u => u.UserId).FirstOrDefaultAsync();
            int nextId = lastUser != null ? int.Parse(lastUser.UserId.Substring(1)) + 1 : 1;
            var newUserId = $"U{nextId.ToString().PadLeft(6, '0')}";

            var user = new User
            {
                UserId = newUserId,
                Name = dto.Name,
                Email = dto.Email,
                Password = dto.Password,
                Roles = dto.Roles ?? new List<string> { "Requester" }
            };

            user.NormalizeRoles();
            user.HashPassword();

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var token = GenerateJwt(user);

            return Ok(new { message = "User registered successfully", token, user });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthLoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null || !user.ComparePassword(dto.Password))
                return Unauthorized(new { message = "Invalid email or password" });

            var accessToken = GenerateJwt(user);
            var refreshToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
            user.RefreshToken = refreshToken;
            await _context.SaveChangesAsync();

            return Ok(new { accessToken, refreshToken });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == dto.RefreshToken);
            if (user == null) return Unauthorized("Invalid refresh token");

            var newToken = GenerateJwt(user);
            return Ok(new { accessToken = newToken });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == dto.RefreshToken);
            if (user == null) return Unauthorized("Invalid refresh token");

            user.RefreshToken = null;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Logged out successfully" });
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null) return NotFound("User not found");

            return Ok(new { user.UserId, user.Name, user.Email, user.Roles });
        }

        private string GenerateJwt(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name)
            };

            foreach (var role in user.Roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
