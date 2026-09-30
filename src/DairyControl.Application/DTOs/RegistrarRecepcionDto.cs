namespace DairyControl.Application.DTOs
{
    public class RegistrarRecepcionDto
    {
        public decimal? Grasa { get; set; }
        public decimal Acidez { get; set; }
        public decimal Temperatura { get; set; }
        public decimal Litros { get; set; }
        public DateTime FechaHora { get; set; }
        public int? Silo { get; set; }
        public string? Observaciones { get; set; }
    }
}
