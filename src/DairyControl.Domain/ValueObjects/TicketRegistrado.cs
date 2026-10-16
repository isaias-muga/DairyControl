namespace DairyControl.Domain.ValueObjects
{
    // Where a ticket number is already in use.
    public sealed record TicketRegistrado
    {
        public TicketRegistrado(string proveedorNombre, DateTime fechaHora)
        {
            ProveedorNombre = proveedorNombre;
            FechaHora = fechaHora;
        }

        public string ProveedorNombre { get; }
        public DateTime FechaHora { get; }
    }
}
