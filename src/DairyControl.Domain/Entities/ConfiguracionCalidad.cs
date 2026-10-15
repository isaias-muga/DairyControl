using DairyControl.Domain.ValueObjects;

namespace DairyControl.Domain.Entities
{
    // Single-row configuration: the quality limits currently in force for the plant.
    public class ConfiguracionCalidad
    {
        public static readonly Guid IdUnico = new("5b0c6f0e-3f6a-4f7e-9a53-0d1c2b7a4e11");

        public Guid Id { get; private set; }
        public LimitesCalidad Limites { get; private set; } = null!;
        public DateTime ActualizadoEn { get; private set; }

        private ConfiguracionCalidad() { }

        public static ConfiguracionCalidad Crear(LimitesCalidad limites, DateTime actualizadoEnUtc)
        {
            ArgumentNullException.ThrowIfNull(limites);
            return new ConfiguracionCalidad
            {
                Id = IdUnico,
                Limites = limites,
                ActualizadoEn = actualizadoEnUtc
            };
        }

        public void CambiarLimites(LimitesCalidad limites, DateTime actualizadoEnUtc)
        {
            ArgumentNullException.ThrowIfNull(limites);
            Limites = limites;
            ActualizadoEn = actualizadoEnUtc;
        }
    }
}
