using DairyControl.Domain.Entities;
using DairyControl.Domain.Exceptions;
using DairyControl.Domain.Interfaces;
using DairyControl.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
namespace DairyControl.Infrastructure.Persistence.Repositories
{
    public class RecepcionRepository : IRecepcionRepository
    {
        private readonly AppDbContext _context;
        public RecepcionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<TicketRegistrado?> GetTicketRegistradoAsync(int ticket)
        {
            return await _context.Recepciones
                .AsNoTracking()
                .Where(r => r.Ticket == ticket)
                .Join(_context.Proveedores, r => r.ProveedorId, p => p.Id, (r, p) => new TicketRegistrado(p.Nombre, r.FechaHora))
                .FirstOrDefaultAsync();
        }

        // The unique index on Ticket is the last line of defense when two operators save the same ticket at once.
        public async Task AddAsync(RecepcionLeche recepcion)
        {
            _context.Recepciones.Add(recepcion);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (UnicidadSql.EsViolacion(ex))
            {
                // The rejected recepción must not stay tracked as Added in the scoped context.
                _context.Entry(recepcion).State = EntityState.Detached;
                throw new TicketDuplicadoException("El ticket ya está registrado.");
            }
        }
    }
}
