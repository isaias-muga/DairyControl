using DairyControl.Domain.Entities;

namespace DairyControl.Domain.Interfaces
{
    public interface IConfiguracionCalidadRepository
    {
        /// <summary>The configuration with the version it had when it was read (opaque bytes, used to detect a stale update).</summary>
        Task<ConfiguracionLeida?> GetAsync();

        /// <summary>
        /// Saves the changes if the stored version is still <paramref name="versionLeida"/>; otherwise throws
        /// <see cref="Exceptions.ConflictoDeConcurrenciaException"/>. Returns the new version.
        /// </summary>
        Task<byte[]> UpdateAsync(ConfiguracionCalidad configuracion, byte[] versionLeida);
    }

    /// <summary>The quality limits row and its concurrency version, which is kept out of the entity.</summary>
    public sealed class ConfiguracionLeida
    {
        public ConfiguracionLeida(ConfiguracionCalidad configuracion, byte[] version)
        {
            Configuracion = configuracion;
            Version = version;
        }

        public ConfiguracionCalidad Configuracion { get; }
        public byte[] Version { get; }
    }
}
