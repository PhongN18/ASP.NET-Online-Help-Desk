using Microsoft.AspNetCore.Mvc;
using OHD_backend.Data;
using OHD_backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;


[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hub;

    public NotificationController(ApplicationDbContext context, IHubContext<NotificationHub> hub)
    {
        _context = context;
        _hub = hub;
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendNotification([FromBody] Notification notification)
    {
        notification.Timestamp = DateTime.UtcNow;
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        await _hub.Clients.User(notification.UserId).SendAsync("ReceiveNotification", notification);

        return Ok(notification);
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetNotifications(string userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.Timestamp)
            .ToListAsync();

        return Ok(new
        {
            count = notifications.Count,
            notifications = notifications
        });
    }

    [HttpDelete("clear/{userId}")]
    public async Task<IActionResult> ClearAll(string userId)
    {
        var userNotis = _context.Notifications.Where(n => n.UserId == userId);
        _context.Notifications.RemoveRange(userNotis);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Notifications cleared." });
    }

    // Mark as read
    [HttpPut("{notificationId}/read")]
    public async Task<IActionResult> MarkAsRead(int notificationId)
    {
        var notif = await _context.Notifications.FindAsync(notificationId);
        if (notif == null) return NotFound();

        notif.IsRead = true;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Notification marked as read" });
    }

    [HttpPut("{userId}/read-all")]
    public async Task<IActionResult> MarkAllAsRead(string userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        if (!notifications.Any())
        {
            return Ok(new { message = "All notifications already marked as read." });
        }

        foreach (var notif in notifications)
        {
            notif.IsRead = true;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "All notifications marked as read.", updatedCount = notifications.Count });
    }


    // Delete individual notification
    [HttpDelete("{notificationId}")]
    public async Task<IActionResult> DeleteNotification(int notificationId)
    {
        var notif = await _context.Notifications.FindAsync(notificationId);
        if (notif == null) return NotFound();

        _context.Notifications.Remove(notif);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Notification deleted" });
    }
}
