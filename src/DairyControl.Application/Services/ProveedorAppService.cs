using DairyControl.Application.DTOs;
using DairyControl.Domain.Entities;
using DairyControl.Domain.Interfaces;

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

        public async Task<ProveedorDto?> GetByIdAsync(Guid id)
        {
            var proveedor = await _repository.GetByIdAsync(id);

            if (proveedor == null)
                return null;

            return new ProveedorDto
            {
                Id = proveedor.Id,
                Nombre = proveedor.Nombre,
                CantidadRecepciones = proveedor.Recepciones.Count
            };
        }
    }
}