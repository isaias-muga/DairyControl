namespace DairyControl.Application.DTOs
{
    public class RecepcionListadoDto
    {
        public Guid Id { get; set; }
        public int? Ticket { get; set; }
        public DateTime FechaHora { get; set; }
        public Guid ProveedorId { get; set; }
        public string ProveedorNombre { get; set; } = null!;
        public decimal Litros { get; set; }
        public decimal? AguaPorcentaje { get; set; }
        public decimal LitrosReales { get; set; }
        public decimal? Grasa { get; set; }
        public decimal Acidez { get; set; }
        public decimal Temperatura { get; set; }
        public int? Silo { get; set; }
        public string? Observaciones { get; set; }

        // Why the recepción is out of range (see MotivosFueraDeRango); empty when it is within the limits.
        public List<string> Motivos { get; set; } = [];
    }
}
