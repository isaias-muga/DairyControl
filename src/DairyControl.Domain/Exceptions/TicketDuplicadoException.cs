namespace DairyControl.Domain.Exceptions
{
    // The plant ticket number is already used by another recepción (unique across all proveedores).
    public class TicketDuplicadoException : ExcepcionDeDominio
    {
        public TicketDuplicadoException(string message) : base(message) { }
    }
}
