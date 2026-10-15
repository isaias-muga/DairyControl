namespace DairyControl.Application.DTOs
{
    public class FiltroRecepciones
    {
        public const int TamanoPagina = 100;

        public DateOnly Desde { get; set; }
        public DateOnly Hasta { get; set; }
        public Guid? ProveedorId { get; set; }
        public int? Ticket { get; set; }
        public bool SoloFueraDeRango { get; set; }
        public int Pagina { get; set; } = 1;
    }
}
