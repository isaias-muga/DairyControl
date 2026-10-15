namespace DairyControl.Application.DTOs
{
    public class LimitesCalidadDto
    {
        public decimal AcidezMaxima { get; set; }
        public decimal TemperaturaMaxima { get; set; }
        public decimal AguaMaxima { get; set; }
        public DateTime ActualizadoEn { get; set; }
    }
}
