public class Notification
{
    public int Id { get; set; }
    public string UserId { get; set; } // foreign key to User
    public string RequestId { get; set; }
    public string Message { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;
}
