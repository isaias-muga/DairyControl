using DairyControl.Application.DTOs;
using DairyControl.Application.Queries;

namespace DairyControl.Application.Services
{
    public class ListadoRecepcionesAppService
    {
        // Keeps the row offset (page * size) far from int overflow; 1,000,000 pages is 100 million recepciones.
        public const int MaxPagina = 1_000_000;

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

            if (filtro.Pagina > MaxPagina)
            {
                throw new ArgumentException($"La página no puede superar {MaxPagina:N0}.", nameof(filtro.Pagina));
            }

            return _queries.GetListadoAsync(filtro);
        }

        // A suggestion only: the unique ticket rule is still enforced when the recepción is registered.
        public Task<int?> GetSiguienteTicketAsync() => _queries.GetSiguienteTicketAsync();
    }
}
