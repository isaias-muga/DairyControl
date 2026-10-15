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

        public async Task<ResumenRecepcionesDto> GetResumenAsync(DateOnly desde, DateOnly hasta, Guid? proveedorId)
        {
            var dias = hasta.DayNumber - desde.DayNumber + 1;
            var desdeAnterior = desde.AddDays(-dias);
            var hastaAnterior = desde.AddDays(-1);

            var recepciones = Recepciones(desde, hasta, proveedorId);
            // The limits are editable at runtime, so they are read from the database on every request.
            var limites = await _context.ConfiguracionesCalidad
                .AsNoTracking()
                .Select(c => c.Limites)
                .SingleAsync();
            var fueraDeRango = limites.FueraDeRango<FilaRecepcion>(x => x.Acidez, x => x.Temperatura, x => x.Agua);

            var totales = await recepciones
                .GroupBy(x => 1)
                .Select(g => new TotalesResumenDto
                {
                    Litros = g.Sum(x => x.Litros),
                    CantidadRecepciones = g.Count(),
                    LitrosPromedioPorRecepcion = g.Average(x => x.Litros),
                    TemperaturaPromedio = g.Average(x => x.Temperatura),
                    TemperaturaMinima = g.Min(x => x.Temperatura),
                    TemperaturaMaxima = g.Max(x => x.Temperatura),
                    AcidezPromedio = g.Average(x => x.Acidez),
                    AcidezMinima = g.Min(x => x.Acidez),
                    AcidezMaxima = g.Max(x => x.Acidez),
                    GrasaPromedio = g.Average(x => x.Grasa),
                    CantidadConGrasa = g.Count(x => x.Grasa != null)
                })
                .FirstOrDefaultAsync() ?? new TotalesResumenDto();

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

            // The out-of-range rule lives in the domain as an expression, so it is applied with Where
            // (it cannot be inlined inside a grouping aggregate).
            var fueraPorProveedor = await recepciones
                .Where(fueraDeRango)
                .GroupBy(x => x.ProveedorId)
                .Select(g => new { ProveedorId = g.Key, Cantidad = g.Count() })
                .ToDictionaryAsync(x => x.ProveedorId, x => x.Cantidad);

            foreach (var proveedor in proveedores)
            {
                proveedor.CantidadFueraDeRango = fueraPorProveedor.GetValueOrDefault(proveedor.ProveedorId);
            }
            totales.CantidadFueraDeRango = fueraPorProveedor.Values.Sum();

            var porDia = await recepciones
                .GroupBy(x => x.FechaHora.Date)
                .Select(g => new
                {
                    Fecha = g.Key,
                    Litros = g.Sum(x => x.Litros),
                    Cantidad = g.Count()
                })
                .OrderBy(x => x.Fecha)
                .ToListAsync();

            totales.LitrosPeriodoAnterior = await Recepciones(desdeAnterior, hastaAnterior, proveedorId)
                .SumAsync(x => x.Litros);

            return new ResumenRecepcionesDto
            {
                Desde = desde,
                Hasta = hasta,
                DesdeAnterior = desdeAnterior,
                HastaAnterior = hastaAnterior,
                Totales = totales,
                Proveedores = proveedores,
                Dias = porDia.Select(d => new ResumenDiaDto
                {
                    Fecha = DateOnly.FromDateTime(d.Fecha),
                    Litros = d.Litros,
                    CantidadRecepciones = d.Cantidad
                }).ToList()
            };
        }

        // Flat projection of the owned recepciones (projecting the owned Parametros object does not translate).
        private IQueryable<FilaRecepcion> Recepciones(DateOnly desde, DateOnly hasta, Guid? proveedorId)
        {
            var inicio = desde.ToDateTime(TimeOnly.MinValue);
            var fin = hasta.AddDays(1).ToDateTime(TimeOnly.MinValue);

            var proveedores = _context.Proveedores.AsNoTracking();
            if (proveedorId is Guid id)
            {
                proveedores = proveedores.Where(p => p.Id == id);
            }

            return proveedores.SelectMany(p => p.Recepciones
                .Where(r => r.FechaHora >= inicio && r.FechaHora < fin)
                .Select(r => new FilaRecepcion
                {
                    ProveedorId = p.Id,
                    Nombre = p.Nombre,
                    FechaHora = r.FechaHora,
                    Litros = r.Parametros.Litros,
                    Acidez = r.Parametros.Acidez,
                    Temperatura = r.Parametros.Temperatura,
                    Grasa = r.Parametros.Grasa,
                    Agua = r.Parametros.AguaPorcentaje ?? 0
                }));
        }

        private sealed class FilaRecepcion
        {
            public Guid ProveedorId { get; set; }
            public string Nombre { get; set; } = null!;
            public DateTime FechaHora { get; set; }
            public decimal Litros { get; set; }
            public decimal Acidez { get; set; }
            public decimal Temperatura { get; set; }
            public decimal? Grasa { get; set; }
            public decimal Agua { get; set; }
        }
    }
}
