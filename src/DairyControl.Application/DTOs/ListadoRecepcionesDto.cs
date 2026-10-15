namespace DairyControl.Application.DTOs
{
    public class ListadoRecepcionesDto
    {
        public List<RecepcionListadoDto> Items { get; set; } = [];
        public TotalesListadoDto Totales { get; set; } = null!;

        // Subtotals of the whole day (not only the part of it on this page) for the days that appear in Items.
        public List<SubtotalDiaDto> Dias { get; set; } = [];
        public int Pagina { get; set; }
        public int TamanoPagina { get; set; }
        public bool HayMas { get; set; }
    }
}
