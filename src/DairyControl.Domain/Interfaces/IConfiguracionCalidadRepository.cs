using DairyControl.Domain.Entities;

namespace DairyControl.Domain.Interfaces
{
    public interface IConfiguracionCalidadRepository
    {
        Task<ConfiguracionCalidad?> GetAsync();
        Task UpdateAsync(ConfiguracionCalidad configuracion);
    }
}
