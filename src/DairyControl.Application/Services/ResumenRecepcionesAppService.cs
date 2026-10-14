using DairyControl.Application.DTOs;
using DairyControl.Application.Queries;

namespace DairyControl.Application.Services
{
    public class ResumenRecepcionesAppService
    {
        public const int MaxDias = 366;

        private readonly IRecepcionQueries _queries;

        public ResumenRecepcionesAppService(IRecepcionQueries queries)
        {
            _queries = queries;
        }

        public Task<ResumenRecepcionesDto> GetResumenAsync(DateOnly desde, DateOnly hasta)
        {
            if (desde > hasta)
            {
                throw new ArgumentException("La fecha desde no puede ser posterior a la fecha hasta.", nameof(desde));
            }

            if (hasta.DayNumber - desde.DayNumber + 1 > MaxDias)
            {
                throw new ArgumentException($"El período no puede superar los {MaxDias} días.", nameof(hasta));
            }

            return _queries.GetResumenAsync(desde, hasta);
        }
    }
}
