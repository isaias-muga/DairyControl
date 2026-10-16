using DairyControl.Domain.Entities;
using DairyControl.Domain.ValueObjects;
namespace DairyControl.Domain.Interfaces
{
    public interface IRecepcionRepository
    {
        Task AddAsync(RecepcionLeche recepcion);

        Task<TicketRegistrado?> GetTicketRegistradoAsync(int ticket);
    }
}
