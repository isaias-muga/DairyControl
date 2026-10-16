using DairyControl.Domain.Entities;
namespace DairyControl.Domain.Interfaces
{
    public interface IProveedorRepository
    {
        Task<Proveedor?> GetByIdAsync(Guid id);

        Task<IReadOnlyList<Proveedor>> GetAllAsync();

        Task<bool> ExistsAsync(Guid id);

        Task AddAsync(Proveedor proveedor);
    }
}
