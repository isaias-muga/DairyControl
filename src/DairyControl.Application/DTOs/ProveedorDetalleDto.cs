namespace DairyControl.Application.DTOs;

public class ProveedorDetalleDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public List<RecepcionDto> Recepciones { get; set; } = [];
}