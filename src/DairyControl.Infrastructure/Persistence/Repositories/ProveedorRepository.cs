using DairyControl.Domain.Entities;
using DairyControl.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
namespace DairyControl.Infrastructure.Persistence.Repositories
{
    public class ProveedorRepository : IProveedorRepository
    {
        private readonly AppDbContext _context;
        public ProveedorRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task<Proveedor?> GetByIdAsync(Guid id)
        {
            return await _context.Proveedores.FindAsync(id);
        }
        public async Task<IReadOnlyList<Proveedor>> GetAllAsync()
        {
            return await _context.Proveedores.AsNoTracking().ToListAsync();
        }

        public async Task<bool> ExistsAsync(Guid id)
        {
            return await _context.Proveedores.AsNoTracking().AnyAsync(p => p.Id == id);
        }

        public async Task AddAsync(Proveedor proveedor)
        {
            _context.Proveedores.Add(proveedor);
            await _context.SaveChangesAsync();
        }
    }
}
