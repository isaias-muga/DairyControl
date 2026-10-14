namespace DairyControl.Application.DTOs
{
    public class TotalesResumenDto
    {
        public decimal Litros { get; set; }
        public int CantidadRecepciones { get; set; }
        public decimal LitrosPromedioPorRecepcion { get; set; }
        public decimal TemperaturaPromedio { get; set; }
        public decimal TemperaturaMinima { get; set; }
        public decimal TemperaturaMaxima { get; set; }
        public decimal AcidezPromedio { get; set; }
        public decimal AcidezMinima { get; set; }
        public decimal AcidezMaxima { get; set; }
        public decimal? GrasaPromedio { get; set; }
        public int CantidadConGrasa { get; set; }
        public int CantidadFueraDeRango { get; set; }
        public decimal LitrosPeriodoAnterior { get; set; }
    }
}
