using DairyControl.Application.Dtos;
using DairyControl.Application.DTOs;
using DairyControl.Domain.Entities;
using DairyControl.Domain.Interfaces;
using DairyControl.Domain.ValueObjects;

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
                        Observaciones = r.Observaciones
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

            var parametros = ParametrosCalidad.Create(dto.Grasa, dto.Acidez, dto.Temperatura, dto.Litros);

            proveedor.RegistrarRecepcion(parametros, dto.FechaHora, dto.Silo, dto.Observaciones);
            await _repository.UpdateAsync(proveedor);
            return new ProveedorDto
            {
                Id = proveedor.Id,
                Nombre = proveedor.Nombre,
                CantidadRecepciones = proveedor.Recepciones.Count
            };
        }
    }
}