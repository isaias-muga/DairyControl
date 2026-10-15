namespace DairyControl.Domain.ValueObjects
{
    // Where a ticket number is already in use.
    public record TicketRegistrado(string ProveedorNombre, DateTime FechaHora);
}
