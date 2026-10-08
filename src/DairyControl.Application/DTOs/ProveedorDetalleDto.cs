namespace DairyControl.Application.Dtos;

public class ProveedorDetalleDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public List<RecepcionDto> Recepciones { get; set; } = [];
}