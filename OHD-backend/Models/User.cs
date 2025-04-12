using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using BCrypt.Net;

namespace OHD_backend.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; } // Auto-incremented by EF
        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        // Store roles as a JSON string if using SQLite or simple List if supported
        [NotMapped]
        public List<string> Roles { get; set; } = new List<string> { "Requester" };

        // Backing field for database
        public string RolesSerialized
        {
            get => string.Join(",", Roles);
            set => Roles = string.IsNullOrEmpty(value) ? new List<string>() : new List<string>(value.Split(','));
        }

        public string? RefreshToken { get; set; }

        [Required]
        public string Status { get; set; } = "Active";

        public void NormalizeRoles()
        {
            if (Roles.Contains("Admin"))
            {
                Roles = new List<string> { "Admin" };
            }
            else if (Roles.Contains("Manager") && !Roles.Contains("Technician"))
            {
                Roles.Add("Technician");
            }
        }

        public void HashPassword()
        {
            if (!string.IsNullOrWhiteSpace(Password))
            {
                Password = BCrypt.Net.BCrypt.HashPassword(Password);
            }
        }

        public bool ComparePassword(string enteredPassword)
        {
            return BCrypt.Net.BCrypt.Verify(enteredPassword, Password);
        }
    }
}
