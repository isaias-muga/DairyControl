using DairyControl.Application.DTOs;
using DairyControl.Application.Queries;
using DairyControl.Domain.Entities;
using DairyControl.Domain.Exceptions;
using DairyControl.Domain.Interfaces;
using DairyControl.Domain.ValueObjects;
using System.Globalization;

namespace DairyControl.Application.Services
{
    public class ProveedorAppService
    {
        private readonly IProveedorRepository _proveedores;
        private readonly IRecepcionRepository _recepciones;
        private readonly IProveedorQueries _queries;
        private readonly TimeProvider _reloj;

        public ProveedorAppService(IProveedorRepository proveedores, IRecepcionRepository recepciones, IProveedorQueries queries, TimeProvider reloj)
        {
            _proveedores = proveedores;
            _recepciones = recepciones;
            _queries = queries;
            _reloj = reloj;
        }

        public async Task<ProveedorDto> CrearAsync(CrearProveedorDto dto)
        {
            var proveedor = Proveedor.Crear(dto.Nombre);
            await _proveedores.AddAsync(proveedor);

            return new ProveedorDto
            {
                Id = proveedor.Id,
                Nombre = proveedor.Nombre,
                CantidadRecepciones = 0
            };
        }

        public Task<ProveedorDto?> GetByIdAsync(Guid id) => _queries.GetByIdAsync(id);

        public Task<IReadOnlyList<ProveedorDto>> GetAllAsync() => _queries.GetAllAsync();

        public async Task<ProveedorDto?> RegistrarRecepcionAsync(Guid proveedorId, RegistrarRecepcionDto dto)
        {
            if (!await _proveedores.ExistsAsync(proveedorId))
                return null;

            var parametros = ParametrosCalidad.Create(dto.Grasa, dto.Acidez, dto.Temperatura, dto.Litros, dto.AguaPorcentaje);

            // The ticket is unique across the whole plant. A non-positive ticket is left to the domain (400).
            var ticket = dto.Ticket is > 0 ? dto.Ticket : null;
            if (ticket is int numeroTicket)
            {
                var existente = await _recepciones.GetTicketRegistradoAsync(numeroTicket);
                if (existente is not null)
                    throw new TicketDuplicadoException(MensajeTicketDuplicado(numeroTicket, existente));
            }

            // A missing date becomes default(DateTime), which the domain rejects.
            var recepcion = RecepcionLeche.Registrar(proveedorId, parametros, HoraPlanta.ALaPlanta(dto.FechaHora.GetValueOrDefault()), HoraPlanta.Ahora(_reloj), dto.Silo, dto.Observaciones, dto.Ticket);

            try
            {
                await _recepciones.AddAsync(recepcion);
            }
            catch (TicketDuplicadoException) when (ticket is not null)
            {
                // Lost a race with another operator: same 409, now with the details of the winner.
                var existente = await _recepciones.GetTicketRegistradoAsync(ticket.Value);
                throw new TicketDuplicadoException(MensajeTicketDuplicado(ticket.Value, existente));
            }

            // The count comes from the database; no recepción is loaded.
            return await _queries.GetByIdAsync(proveedorId);
        }

        private static string MensajeTicketDuplicado(int ticket, TicketRegistrado? existente) =>
            existente is null
                ? $"El ticket {ticket} ya está registrado"
                : string.Create(CultureInfo.InvariantCulture,
                    $"El ticket {ticket} ya está registrado ({existente.ProveedorNombre}, {existente.FechaHora:dd/MM/yyyy})");
    }
}
