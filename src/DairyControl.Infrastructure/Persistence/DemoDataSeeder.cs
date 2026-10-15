using DairyControl.Application;
using DairyControl.Domain.Entities;
using DairyControl.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DairyControl.Infrastructure.Persistence
{
    public class DemoDataSeeder
    {

        private readonly AppDbContext _context;
        private readonly ILogger<DemoDataSeeder>? _logger;

        public DemoDataSeeder(AppDbContext context, ILogger<DemoDataSeeder>? logger = null)
        {
            _context = context;
            _logger = logger;
        }

        // Startup entry point. Reset wins over seed: it wipes everything and reseeds, even if
        // SeedOnStartup is false. Otherwise the seed only runs on an empty database.
        public async Task InitializeAsync(bool resetOnStartup, bool seedOnStartup)
        {
            if (resetOnStartup)
            {
                await ResetAndSeedAsync();
            }
            else if (seedOnStartup)
            {
                await SeedAsync();
            }
        }

        public async Task SeedAsync()
        {
            if (await _context.Proveedores.AnyAsync())
                return;

            await AddDemoDataAsync();
            await _context.SaveChangesAsync();
        }

        // Deletes every recepción and proveedor, restores the default quality limits and reseeds,
        // all in one transaction. The admin user lives in configuration, not in the database.
        public async Task ResetAndSeedAsync()
        {
            var proveedoresBorrados = 0;
            var recepcionesBorradas = 0;

            // EnableRetryOnFailure: explicit transactions must run inside the execution strategy
            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                _context.ChangeTracker.Clear(); // a retried attempt starts from a clean state
                await using var transaccion = await _context.Database.BeginTransactionAsync();

                recepcionesBorradas = await _context.Proveedores.SelectMany(p => p.Recepciones).ExecuteDeleteAsync();
                proveedoresBorrados = await _context.Proveedores.ExecuteDeleteAsync();

                var configuracion = await _context.ConfiguracionesCalidad.FirstOrDefaultAsync();
                if (configuracion is null)
                {
                    _context.ConfiguracionesCalidad.Add(ConfiguracionCalidad.Crear(LimitesCalidad.Predeterminados, DateTime.UtcNow));
                }
                else
                {
                    configuracion.CambiarLimites(LimitesCalidad.Predeterminados, DateTime.UtcNow);
                }

                await AddDemoDataAsync();
                await _context.SaveChangesAsync();
                await transaccion.CommitAsync();
            });

            _logger?.LogWarning(
                "Demo data reset: deleted {Proveedores} proveedores and {Recepciones} recepciones, restored the default quality limits and reseeded.",
                proveedoresBorrados,
                recepcionesBorradas);
        }

        private Task AddDemoDataAsync()
        {
            var ahoraPlanta = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, HoraPlanta.ZonaHoraria);
            var desde = ahoraPlanta.Date.AddDays(-DemoDataGenerator.DiasHistorial);

            _context.Proveedores.AddRange(new DemoDataGenerator().Generar(desde));
            return Task.CompletedTask;
        }
    }
}
