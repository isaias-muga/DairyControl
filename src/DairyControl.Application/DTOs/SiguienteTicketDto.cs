namespace DairyControl.Application.DTOs
{
    public class SiguienteTicketDto
    {
        // Null when the largest possible ticket is already taken (there is nothing to suggest)
        public int? Ticket { get; set; }
    }
}
