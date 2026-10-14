namespace DairyControl.Application.DTOs
{
    public class TotalesResumenDto
    {
        public decimal Litros { get; set; }
        public int CantidadRecepciones { get; set; }
        public decimal TemperaturaPromedio { get; set; }
        public decimal AcidezPromedio { get; set; }
        public decimal? GrasaPromedio { get; set; }
        public int CantidadAcidezAlta { get; set; }
    }
}
