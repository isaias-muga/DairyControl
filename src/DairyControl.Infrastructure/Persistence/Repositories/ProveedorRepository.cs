using DairyControl.Domain.Entities;
using DairyControl.Domain.Exceptions;
using DairyControl.Domain.Interfaces;
using DairyControl.Domain.ValueObjects;
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

        public async Task<TicketRegistrado?> GetTicketRegistradoAsync(int ticket)
        {
            return await _context.Proveedores
                .AsNoTracking()
                .SelectMany(p => p.Recepciones
                    .Where(r => r.Ticket == ticket)
                    .Select(r => new TicketRegistrado(p.Nombre, r.FechaHora)))
                .FirstOrDefaultAsync();
        }

        public async Task AddAsync(Proveedor proveedor)
        {
            _context.Proveedores.Add(proveedor);
            await SaveAsync();
        }

        public async Task UpdateAsync(Proveedor proveedor)
        {
            await SaveAsync();
        }

        // The unique index on Ticket is the last line of defense when two operators save the same ticket at once.
        private async Task SaveAsync()
        {
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (UnicidadSql.EsViolacion(ex))
            {
                throw new TicketDuplicadoException("El ticket ya está registrado.");
            }
        }
    }
}
