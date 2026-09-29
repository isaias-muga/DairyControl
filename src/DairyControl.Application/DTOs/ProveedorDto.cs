namespace DairyControl.Application.DTOs
{
    public class ProveedorDto
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = null!;
        public int CantidadRecepciones { get; set; }
    }
}