using Microsoft.EntityFrameworkCore;
using OHD_backend.Models;

namespace OHD_backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Request> Requests { get; set; }
        public DbSet<Facility> Facilities { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Default values
            modelBuilder.Entity<Request>()
                        .Property(r => r.Status)
                        .HasDefaultValue("Unassigned");

            modelBuilder.Entity<Facility>()
                        .Property(f => f.Status)
                        .HasDefaultValue("Operating");

            modelBuilder.Entity<User>()
                        .Property(u => u.Status)
                        .HasDefaultValue("Active");

            // If you're using a list of roles as JSON or not mapped at all, you can ignore:
            modelBuilder.Entity<User>()
                        .Ignore(u => u.Roles); // Only if Roles is not stored directly
        }
    }
}
