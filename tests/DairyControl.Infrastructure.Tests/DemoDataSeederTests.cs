using DairyControl.Domain.Entities;
using DairyControl.Domain.ValueObjects;
using DairyControl.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DairyControl.Infrastructure.Tests
{
    // In-memory SQLite, schema from EnsureCreated (the migrations are SQL Server-specific).
    // These tests only cover the reset/seed logic: they do not prove SQL Server behavior
    // (migrations, unique-violation error codes, query translation).
    public class DemoDataSeederTests : IDisposable
    {
        private readonly SqliteConnection _connection;

        public DemoDataSeederTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();
            using var context = NuevoContexto();
            context.Database.EnsureCreated();
        }

        public void Dispose() => _connection.Dispose();

        private AppDbContext NuevoContexto() =>
            new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options);

        private sealed class LoggerEnMemoria : ILogger<DemoDataSeeder>
        {
            public List<(LogLevel Nivel, string Mensaje)> Entradas { get; } = [];

            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

            public bool IsEnabled(LogLevel logLevel) => true;

            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) =>
                Entradas.Add((logLevel, formatter(state, exception)));
        }

        // Existing data that a reset must wipe: an old proveedor with one recepción, and custom limits
        private void CargarDatosViejos()
        {
            using var context = NuevoContexto();
            var viejo = Proveedor.Crear("Tambo Viejo");
            viejo.RegistrarRecepcion(ParametrosCalidad.Create(null, 17m, 5m, 1000m), new DateTime(2026, 1, 1, 6, 0, 0), 1, null, 1);
            context.Proveedores.Add(viejo);
            context.ConfiguracionesCalidad.Single().CambiarLimites(LimitesCalidad.Create(25m, 30m, 5m), DateTime.UtcNow);
            context.SaveChanges();
        }

        private (int Proveedores, int Recepciones, string[] Nombres, List<int> Tickets, LimitesCalidad Limites) Leer()
        {
            using var context = NuevoContexto();
            var proveedores = context.Proveedores.AsNoTracking().ToList();
            var recepciones = proveedores.SelectMany(p => p.Recepciones).ToList();
            return (
                proveedores.Count,
                recepciones.Count,
                proveedores.Select(p => p.Nombre).ToArray(),
                recepciones.Select(r => r.Ticket!.Value).OrderBy(t => t).ToList(),
                context.ConfiguracionesCalidad.AsNoTracking().Single().Limites);
        }

        [Fact]
        public async Task InitializeAsync_ResetOn_LeavesOnlyTheSeededData()
        {
            // Arrange
            CargarDatosViejos();
            var logger = new LoggerEnMemoria();
            using var context = NuevoContexto();
            var seeder = new DemoDataSeeder(context, logger);

            // Act
            await seeder.InitializeAsync(resetOnStartup: true, seedOnStartup: false);

            // Assert
            var datos = Leer();
            Assert.Equal(8, datos.Proveedores);
            Assert.DoesNotContain("Tambo Viejo", datos.Nombres);
            Assert.NotEmpty(datos.Tickets);
            Assert.Equal(Enumerable.Range(4900, datos.Recepciones), datos.Tickets); // unique and consecutive
            Assert.Equal(LimitesCalidad.Predeterminados, datos.Limites);
        }

        [Fact]
        public async Task InitializeAsync_ResetOn_LogsAWarningWithTheDeletedCounts()
        {
            // Arrange
            CargarDatosViejos();
            var logger = new LoggerEnMemoria();
            using var context = NuevoContexto();
            var seeder = new DemoDataSeeder(context, logger);

            // Act
            await seeder.InitializeAsync(resetOnStartup: true, seedOnStartup: false);

            // Assert
            var advertencia = Assert.Single(logger.Entradas, e => e.Nivel == LogLevel.Warning);
            Assert.Contains("deleted 1 proveedores and 1 recepciones", advertencia.Mensaje);
        }

        [Fact]
        public async Task InitializeAsync_ResetOnAnEmptyDatabase_SeedsAndLogsZeroDeleted()
        {
            // Arrange
            var logger = new LoggerEnMemoria();
            using var context = NuevoContexto();
            var seeder = new DemoDataSeeder(context, logger);

            // Act
            await seeder.InitializeAsync(resetOnStartup: true, seedOnStartup: false);

            // Assert
            Assert.Equal(8, Leer().Proveedores);
            var advertencia = Assert.Single(logger.Entradas, e => e.Nivel == LogLevel.Warning);
            Assert.Contains("deleted 0 proveedores and 0 recepciones", advertencia.Mensaje);
        }

        [Fact]
        public async Task InitializeAsync_FlagsOff_LeavesExistingDataUntouched()
        {
            // Arrange
            CargarDatosViejos();
            var logger = new LoggerEnMemoria();
            using var context = NuevoContexto();
            var seeder = new DemoDataSeeder(context, logger);

            // Act
            await seeder.InitializeAsync(resetOnStartup: false, seedOnStartup: false);

            // Assert
            var datos = Leer();
            Assert.Equal(1, datos.Proveedores);
            Assert.Equal(["Tambo Viejo"], datos.Nombres);
            Assert.Equal([1], datos.Tickets);
            Assert.Equal(LimitesCalidad.Create(25m, 30m, 5m), datos.Limites);
            Assert.Empty(logger.Entradas);
        }

        [Fact]
        public async Task InitializeAsync_SeedOnNonEmptyDatabase_LeavesExistingDataUntouched()
        {
            // Arrange
            CargarDatosViejos();
            using var context = NuevoContexto();
            var seeder = new DemoDataSeeder(context);

            // Act
            await seeder.InitializeAsync(resetOnStartup: false, seedOnStartup: true);

            // Assert
            var datos = Leer();
            Assert.Equal(["Tambo Viejo"], datos.Nombres);
            Assert.Equal(LimitesCalidad.Create(25m, 30m, 5m), datos.Limites);
        }

        [Fact]
        public async Task InitializeAsync_SeedOnEmptyDatabase_SeedsTheDemoData()
        {
            // Arrange
            using var context = NuevoContexto();
            var seeder = new DemoDataSeeder(context);

            // Act
            await seeder.InitializeAsync(resetOnStartup: false, seedOnStartup: true);

            // Assert
            var datos = Leer();
            Assert.Equal(8, datos.Proveedores);
            Assert.Equal(Enumerable.Range(4900, datos.Recepciones), datos.Tickets);
            Assert.Equal(LimitesCalidad.Predeterminados, datos.Limites);
        }
    }
}
