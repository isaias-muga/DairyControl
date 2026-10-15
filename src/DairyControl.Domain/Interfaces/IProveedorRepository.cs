using DairyControl.Domain.Entities;
using DairyControl.Domain.ValueObjects;
namespace DairyControl.Domain.Interfaces
{
    public interface IProveedorRepository
    {
        Task<Proveedor?> GetByIdAsync(Guid id);

        Task<IReadOnlyList<Proveedor>> GetAllAsync();

        Task AddAsync(Proveedor proveedor);

        Task UpdateAsync(Proveedor proveedor);

        Task<TicketRegistrado?> GetTicketRegistradoAsync(int ticket);
    }
}
