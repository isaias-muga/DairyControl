using DairyControl.Application.DTOs;
using DairyControl.Application.Queries;

namespace DairyControl.Application.Services
{
    public class ListadoRecepcionesAppService
    {
        private readonly IRecepcionQueries _queries;

        public ListadoRecepcionesAppService(IRecepcionQueries queries)
        {
            _queries = queries;
        }

        public Task<ListadoRecepcionesDto> GetListadoAsync(FiltroRecepciones filtro)
        {
            ResumenRecepcionesAppService.ValidarFiltro(filtro.Desde, filtro.Hasta, filtro.ProveedorId);

            if (filtro.Ticket < 1)
            {
                throw new ArgumentException("El número de ticket debe ser mayor a cero.", nameof(filtro.Ticket));
            }

            if (filtro.Pagina < 1)
            {
                throw new ArgumentException("La página debe ser mayor a cero.", nameof(filtro.Pagina));
            }

            return _queries.GetListadoAsync(filtro);
        }

        // A suggestion only: the unique ticket rule is still enforced when the recepción is registered.
        public Task<int> GetSiguienteTicketAsync() => _queries.GetSiguienteTicketAsync();
    }
}
