using DairyControl.Application.DTOs;
using DairyControl.Domain.Entities;
using DairyControl.Domain.Interfaces;
using DairyControl.Domain.ValueObjects;

namespace DairyControl.Application.Services
{
    public class ConfiguracionCalidadAppService
    {
        private readonly IConfiguracionCalidadRepository _repository;
        private readonly TimeProvider _reloj;

        public ConfiguracionCalidadAppService(IConfiguracionCalidadRepository repository, TimeProvider reloj)
        {
            _repository = repository;
            _reloj = reloj;
        }

        public async Task<LimitesCalidadDto?> GetAsync()
        {
            var configuracion = await _repository.GetAsync();
            return configuracion is null ? null : ToDto(configuracion);
        }

        public async Task<LimitesCalidadDto?> ActualizarAsync(ActualizarLimitesCalidadDto dto)
        {
            var limites = LimitesCalidad.Create(dto.AcidezMaxima, dto.TemperaturaMaxima, dto.AguaMaxima);

            var configuracion = await _repository.GetAsync();
            if (configuracion is null)
                return null;

            configuracion.CambiarLimites(limites, _reloj.GetUtcNow().UtcDateTime);
            await _repository.UpdateAsync(configuracion);
            return ToDto(configuracion);
        }

        private static LimitesCalidadDto ToDto(ConfiguracionCalidad configuracion) => new()
        {
            AcidezMaxima = configuracion.Limites.AcidezMaxima,
            TemperaturaMaxima = configuracion.Limites.TemperaturaMaxima,
            AguaMaxima = configuracion.Limites.AguaMaxima,
            ActualizadoEn = configuracion.ActualizadoEn
        };
    }
}
