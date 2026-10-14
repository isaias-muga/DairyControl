using DairyControl.Application.DTOs;

namespace DairyControl.Application.Queries
{
    public interface IRecepcionQueries
    {
        Task<ResumenRecepcionesDto> GetResumenAsync(DateOnly desde, DateOnly hasta);
    }
}
