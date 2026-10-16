using DairyControl.Domain.Entities;
using DairyControl.Domain.Exceptions;
using DairyControl.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
namespace DairyControl.Infrastructure.Persistence.Repositories
{
    public class ConfiguracionCalidadRepository : IConfiguracionCalidadRepository
    {
        // Shadow property (see ConfiguracionCalidadConfiguration): the entity does not know about it
        private const string RowVersion = "RowVersion";

        private readonly AppDbContext _context;
        public ConfiguracionCalidadRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ConfiguracionLeida?> GetAsync()
        {
            var configuracion = await _context.ConfiguracionesCalidad.FirstOrDefaultAsync();
            return configuracion is null ? null : new ConfiguracionLeida(configuracion, VersionActual(configuracion));
        }

        public async Task<byte[]> UpdateAsync(ConfiguracionCalidad configuracion, byte[] versionLeida)
        {
            // The UPDATE only matches the row if it still has the version the caller read
            _context.Entry(configuracion).Property(RowVersion).OriginalValue = versionLeida;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new ConflictoDeConcurrenciaException();
            }
            return VersionActual(configuracion);
        }

        private byte[] VersionActual(ConfiguracionCalidad configuracion) =>
            (byte[])_context.Entry(configuracion).Property(RowVersion).CurrentValue!;
    }
}
