using DairyControl.Domain.Entities;
using DairyControl.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
namespace DairyControl.Infrastructure.Persistence.Repositories
{
    public class ConfiguracionCalidadRepository : IConfiguracionCalidadRepository
    {
        private readonly AppDbContext _context;
        public ConfiguracionCalidadRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ConfiguracionCalidad?> GetAsync()
        {
            return await _context.ConfiguracionesCalidad.FirstOrDefaultAsync();
        }

        public async Task UpdateAsync(ConfiguracionCalidad configuracion)
        {
            await _context.SaveChangesAsync();
        }
    }
}
