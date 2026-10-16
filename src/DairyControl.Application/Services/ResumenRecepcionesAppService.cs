using DairyControl.Application.DTOs;
using DairyControl.Application.Queries;

namespace DairyControl.Application.Services
{
    public class ResumenRecepcionesAppService
    {
        public const int MaxDias = 366;
        public static readonly DateOnly DesdeMinimo = new(2000, 1, 1);

        private readonly IRecepcionQueries _queries;

        public ResumenRecepcionesAppService(IRecepcionQueries queries)
        {
            _queries = queries;
        }

        public Task<ResumenRecepcionesDto> GetResumenAsync(DateOnly desde, DateOnly hasta, Guid? proveedorId = null)
        {
            ValidarFiltro(desde, hasta, proveedorId);

            return _queries.GetResumenAsync(desde, hasta, proveedorId);
        }

        // Shared with the paged list so both screens reject the same ranges with the same messages.
        public static void ValidarFiltro(DateOnly desde, DateOnly hasta, Guid? proveedorId)
        {
            if (desde < DesdeMinimo)
            {
                throw new ArgumentException($"La fecha desde no puede ser anterior al {DesdeMinimo:dd/MM/yyyy}.", nameof(desde));
            }

            if (desde > hasta)
            {
                throw new ArgumentException("La fecha desde no puede ser posterior a la fecha hasta.", nameof(desde));
            }

            if (hasta.DayNumber - desde.DayNumber + 1 > MaxDias)
            {
                throw new ArgumentException($"El período no puede superar los {MaxDias} días.", nameof(hasta));
            }

            if (proveedorId == Guid.Empty)
            {
                throw new ArgumentException("El proveedor indicado no es válido.", nameof(proveedorId));
            }
        }
    }
}
