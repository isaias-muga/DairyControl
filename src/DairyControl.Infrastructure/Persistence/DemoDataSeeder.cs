using DairyControl.Domain.Entities;
using DairyControl.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace DairyControl.Infrastructure.Persistence
{
    public class DemoDataSeeder
    {
        private const int Semilla = 2026;
        private const int DiasHistorial = 182;
        private const string ZonaHorariaPlanta = "America/Argentina/Buenos_Aires";

        // Ranges taken from aggregated real reception logs
        private record PerfilTambo(string Nombre, int LitrosMin, int LitrosMax, int CadaDias, int HoraRetiro, bool RetiroTarde);

        private static readonly PerfilTambo[] Perfiles =
        [
            new("Tambo La Esperanza", 1400, 5000, 1, 6, true),
            new("Tambo El Ombú", 1400, 5000, 1, 6, true),
            new("Tambo San José", 800, 3500, 1, 6, false),
            new("Tambo Los Álamos", 800, 3500, 1, 7, false),
            new("Tambo La Aurora", 800, 3500, 1, 7, false),
            new("Tambo Don Ernesto", 300, 1300, 2, 11, false),
            new("Tambo El Trébol", 300, 1300, 2, 11, false),
            new("Tambo Las Acacias", 300, 1300, 2, 11, false)
        ];

        private readonly AppDbContext _context;
        private readonly Random _random = new(Semilla);

        public DemoDataSeeder(AppDbContext context)
        {
            _context = context;
        }

        public async Task SeedAsync()
        {
            if (await _context.Proveedores.AnyAsync())
                return;

            var ahoraPlanta = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, ZonaHorariaPlanta);
            var desde = ahoraPlanta.Date.AddDays(-DiasHistorial);

            foreach (var perfil in Perfiles)
            {
                var proveedor = Proveedor.Crear(perfil.Nombre);

                for (var i = 0; i < DiasHistorial; i += perfil.CadaDias)
                {
                    var dia = desde.AddDays(i);
                    RegistrarRecepcion(proveedor, perfil, dia.AddHours(perfil.HoraRetiro).AddMinutes(_random.Next(0, 180)));

                    if (perfil.RetiroTarde && _random.NextDouble() < 0.7)
                    {
                        RegistrarRecepcion(proveedor, perfil, dia.AddHours(18).AddMinutes(_random.Next(0, 120)));
                    }
                }

                _context.Proveedores.Add(proveedor);
            }

            await _context.SaveChangesAsync();
        }

        private void RegistrarRecepcion(Proveedor proveedor, PerfilTambo perfil, DateTime fechaHora)
        {
            var litros = (decimal)_random.Next(perfil.LitrosMin, perfil.LitrosMax + 1);

            // ~70% of deliveries arrive cooled, the rest warm (no rejection threshold)
            var temperatura = _random.NextDouble() < 0.7
                ? EntreDecimales(3, 12, 1)
                : EntreDecimales(12, 25, 1);

            decimal? grasa = _random.NextDouble() < 0.33 ? EntreDecimales(3.2, 3.8, 2) : null;

            var acidezAlta = _random.NextDouble() < 0.05;
            var acidez = acidezAlta ? _random.Next(20, 24) : _random.Next(15, 20);
            var observaciones = acidezAlta ? "Acidez alta" : null;

            var parametros = ParametrosCalidad.Create(grasa, acidez, temperatura, litros);
            proveedor.RegistrarRecepcion(parametros, fechaHora, _random.Next(1, 4), observaciones);
        }

        private decimal EntreDecimales(double min, double max, int decimales)
        {
            return Math.Round((decimal)(min + _random.NextDouble() * (max - min)), decimales);
        }
    }
}