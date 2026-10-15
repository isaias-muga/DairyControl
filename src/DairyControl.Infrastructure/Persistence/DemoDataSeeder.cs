using Microsoft.EntityFrameworkCore;

namespace DairyControl.Infrastructure.Persistence
{
    public class DemoDataSeeder
    {
        private const string ZonaHorariaPlanta = "America/Argentina/Buenos_Aires";

        private readonly AppDbContext _context;

        public DemoDataSeeder(AppDbContext context)
        {
            _context = context;
        }

        public async Task SeedAsync()
        {
            if (await _context.Proveedores.AnyAsync())
                return;

            var ahoraPlanta = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, ZonaHorariaPlanta);
            var desde = ahoraPlanta.Date.AddDays(-DemoDataGenerator.DiasHistorial);

            var proveedores = new DemoDataGenerator().Generar(desde);

            _context.Proveedores.AddRange(proveedores);
            await _context.SaveChangesAsync();
        }
    }
}
