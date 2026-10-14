using DairyControl.Application.DTOs;
using DairyControl.Application.Queries;
using DairyControl.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace DairyControl.Infrastructure.Persistence.Queries
{
    public class RecepcionQueries : IRecepcionQueries
    {
        private readonly AppDbContext _context;

        public RecepcionQueries(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ResumenRecepcionesDto> GetResumenAsync(DateOnly desde, DateOnly hasta)
        {
            var inicio = desde.ToDateTime(TimeOnly.MinValue);
            var fin = hasta.AddDays(1).ToDateTime(TimeOnly.MinValue);

            var recepciones = _context.Proveedores
                .AsNoTracking()
                .SelectMany(p => p.Recepciones
                    .Where(r => r.FechaHora >= inicio && r.FechaHora < fin)
                    .Select(r => new
                    {
                        ProveedorId = p.Id,
                        p.Nombre,
                        r.FechaHora,
                        r.Parametros.Litros,
                        r.Parametros.Acidez,
                        r.Parametros.Temperatura,
                        r.Parametros.Grasa
                    }));

            var totales = await recepciones
                .GroupBy(x => 1)
                .Select(g => new TotalesResumenDto
                {
                    Litros = g.Sum(x => x.Litros),
                    CantidadRecepciones = g.Count(),
                    TemperaturaPromedio = g.Average(x => x.Temperatura),
                    AcidezPromedio = g.Average(x => x.Acidez),
                    GrasaPromedio = g.Average(x => x.Grasa),
                    CantidadAcidezAlta = g.Count(x => x.Acidez > ParametrosCalidad.AcidezAltaUmbral)
                })
                .FirstOrDefaultAsync();

            var proveedores = await recepciones
                .GroupBy(x => new { x.ProveedorId, x.Nombre })
                .Select(g => new ResumenProveedorDto
                {
                    ProveedorId = g.Key.ProveedorId,
                    Nombre = g.Key.Nombre,
                    Litros = g.Sum(x => x.Litros),
                    CantidadRecepciones = g.Count(),
                    AcidezPromedio = g.Average(x => x.Acidez)
                })
                .OrderByDescending(x => x.Litros)
                .ToListAsync();

            var dias = await recepciones
                .GroupBy(x => x.FechaHora.Date)
                .Select(g => new
                {
                    Fecha = g.Key,
                    Litros = g.Sum(x => x.Litros),
                    Cantidad = g.Count()
                })
                .OrderBy(x => x.Fecha)
                .ToListAsync();

            return new ResumenRecepcionesDto
            {
                Desde = desde,
                Hasta = hasta,
                Totales = totales ?? new TotalesResumenDto(),
                Proveedores = proveedores,
                Dias = dias.Select(d => new ResumenDiaDto
                {
                    Fecha = DateOnly.FromDateTime(d.Fecha),
                    Litros = d.Litros,
                    CantidadRecepciones = d.Cantidad
                }).ToList()
            };
        }
    }
}
