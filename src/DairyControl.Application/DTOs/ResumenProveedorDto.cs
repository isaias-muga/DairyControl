namespace DairyControl.Application.DTOs
{
    public class ResumenProveedorDto
    {
        public Guid ProveedorId { get; set; }
        public string Nombre { get; set; } = null!;
        public decimal Litros { get; set; }
        public int CantidadRecepciones { get; set; }
        public decimal AcidezPromedio { get; set; }
        public int CantidadFueraDeRango { get; set; }
    }
}
