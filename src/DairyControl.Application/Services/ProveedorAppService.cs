using DairyControl.Application.Dtos;
using DairyControl.Application.DTOs;
using DairyControl.Domain.Entities;
using DairyControl.Domain.Exceptions;
using DairyControl.Domain.Interfaces;
using DairyControl.Domain.ValueObjects;
using System.Globalization;

namespace DairyControl.Application.Services
{
    public class ProveedorAppService
    {
        private readonly IProveedorRepository _repository;

        public ProveedorAppService(IProveedorRepository repository)
        {
            _repository = repository;
        }

        public async Task<ProveedorDto> CrearAsync(CrearProveedorDto dto)
        {
            var proveedor = Proveedor.Crear(dto.Nombre);
            await _repository.AddAsync(proveedor);

            return new ProveedorDto
            {
                Id = proveedor.Id,
                Nombre = proveedor.Nombre,
                CantidadRecepciones = proveedor.Recepciones.Count
            };
        }

        public async Task<ProveedorDetalleDto?> GetByIdAsync(Guid id)
        {
            var proveedor = await _repository.GetByIdAsync(id);
            if (proveedor is null)
                return null;

            return new ProveedorDetalleDto
            {
                Id = proveedor.Id,
                Nombre = proveedor.Nombre,
                Recepciones = proveedor.Recepciones
                    .OrderByDescending(r => r.FechaHora)
                    .Select(r => new RecepcionDto
                    {
                        Id = r.Id,
                        FechaHora = r.FechaHora,
                        Litros = r.Parametros.Litros,
                        Grasa = r.Parametros.Grasa,
                        Acidez = r.Parametros.Acidez,
                        Temperatura = r.Parametros.Temperatura,
                        Silo = r.Silo,
                        Observaciones = r.Observaciones,
                        AguaPorcentaje = r.Parametros.AguaPorcentaje,
                        Ticket = r.Ticket,
                        LitrosAPagar = r.LitrosAPagar
                    })
                    .ToList()
            };
        }
        public async Task<IReadOnlyList<ProveedorDto>> GetAllAsync()
        {
            var proveedores = await _repository.GetAllAsync();

            return proveedores.Select(proveedor => new ProveedorDto
            {
                Id = proveedor.Id,
                Nombre = proveedor.Nombre,
                CantidadRecepciones = proveedor.Recepciones.Count
            }).ToList();
        }

        public async Task<ProveedorDto?> RegistrarRecepcionAsync(Guid proveedorId, RegistrarRecepcionDto dto)
        {
            var proveedor = await _repository.GetByIdAsync(proveedorId);

            if (proveedor == null)
                return null;

            var parametros = ParametrosCalidad.Create(dto.Grasa, dto.Acidez, dto.Temperatura, dto.Litros, dto.AguaPorcentaje);

            // The ticket is unique across the whole plant. A non-positive ticket is left to the domain (400).
            var ticket = dto.Ticket is > 0 ? dto.Ticket : null;
            if (ticket is int numeroTicket)
            {
                var existente = await _repository.GetTicketRegistradoAsync(numeroTicket);
                if (existente is not null)
                    throw new TicketDuplicadoException(MensajeTicketDuplicado(numeroTicket, existente));
            }

            proveedor.RegistrarRecepcion(parametros, dto.FechaHora, dto.Silo, dto.Observaciones, dto.Ticket);

            try
            {
                await _repository.UpdateAsync(proveedor);
            }
            catch (TicketDuplicadoException) when (ticket is not null)
            {
                // Lost a race with another operator: same 409, now with the details of the winner.
                var existente = await _repository.GetTicketRegistradoAsync(ticket.Value);
                throw new TicketDuplicadoException(MensajeTicketDuplicado(ticket.Value, existente));
            }

            return new ProveedorDto
            {
                Id = proveedor.Id,
                Nombre = proveedor.Nombre,
                CantidadRecepciones = proveedor.Recepciones.Count
            };
        }

        private static string MensajeTicketDuplicado(int ticket, TicketRegistrado? existente) =>
            existente is null
                ? $"El ticket {ticket} ya está registrado"
                : string.Create(CultureInfo.InvariantCulture,
                    $"El ticket {ticket} ya está registrado ({existente.ProveedorNombre}, {existente.FechaHora:dd/MM/yyyy})");
    }
}