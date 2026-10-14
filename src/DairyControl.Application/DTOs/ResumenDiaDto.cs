namespace DairyControl.Application.DTOs
{
    public class ResumenDiaDto
    {
        public DateOnly Fecha { get; set; }
        public decimal Litros { get; set; }
        public int CantidadRecepciones { get; set; }
    }
}
