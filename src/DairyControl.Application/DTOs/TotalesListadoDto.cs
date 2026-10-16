namespace DairyControl.Application.DTOs
{
    // Totals for the whole filter, not just the page. A recepción can have several reasons,
    // so the per-reason counts can add up to more than CantidadFueraDeRango.
    public class TotalesListadoDto
    {
        public decimal Litros { get; set; }
        public decimal LitrosReales { get; set; }
        public int CantidadRecepciones { get; set; }
        public int? TicketMinimo { get; set; }
        public int? TicketMaximo { get; set; }
        public int CantidadFueraDeRango { get; set; }
        public int FueraPorAcidez { get; set; }
        public int FueraPorTemperatura { get; set; }
        public int FueraPorAgua { get; set; }
    }
}
