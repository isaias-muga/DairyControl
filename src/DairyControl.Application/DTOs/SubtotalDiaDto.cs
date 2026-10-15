namespace DairyControl.Application.DTOs
{
    public class SubtotalDiaDto
    {
        public DateOnly Fecha { get; set; }
        public int CantidadRecepciones { get; set; }
        public decimal Litros { get; set; }
        public int CantidadFueraDeRango { get; set; }
    }
}
