using DairyControl.Application.DTOs;
using DairyControl.Application.Queries;
using Microsoft.EntityFrameworkCore;

namespace DairyControl.Infrastructure.Persistence.Queries
{
    public class ProveedorQueries : IProveedorQueries
    {
        private readonly AppDbContext _context;

        public ProveedorQueries(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<ProveedorDto>> GetAllAsync()
        {
            return await Proveedores().ToListAsync();
        }

        public async Task<ProveedorDto?> GetByIdAsync(Guid id)
        {
            return await Proveedores().Where(p => p.Id == id).FirstOrDefaultAsync();
        }

        // The counts are computed by the database; no recepción is materialized.
        private IQueryable<ProveedorDto> Proveedores()
        {
            return _context.Proveedores
                .AsNoTracking()
                .Select(p => new ProveedorDto
                {
                    Id = p.Id,
                    Nombre = p.Nombre,
                    CantidadRecepciones = _context.Recepciones.Count(r => r.ProveedorId == p.Id)
                });
        }
    }
}
