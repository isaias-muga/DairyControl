using DairyControl.Application.DTOs;

namespace DairyControl.Application.Queries
{
    // Read side of the proveedores: the recepción counts are computed by the database, never from loaded recepciones.
    public interface IProveedorQueries
    {
        Task<IReadOnlyList<ProveedorDto>> GetAllAsync();

        Task<ProveedorDto?> GetByIdAsync(Guid id);
    }
}
