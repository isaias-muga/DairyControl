namespace DairyControl.Application.DTOs
{
    public class ResumenRecepcionesDto
    {
        public DateOnly Desde { get; set; }
        public DateOnly Hasta { get; set; }
        public DateOnly DesdeAnterior { get; set; }
        public DateOnly HastaAnterior { get; set; }
        public TotalesResumenDto Totales { get; set; } = null!;
        public List<ResumenProveedorDto> Proveedores { get; set; } = [];
        public List<ResumenDiaDto> Dias { get; set; } = [];
    }
}
