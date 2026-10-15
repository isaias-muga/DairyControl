using DairyControl.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace DairyControl.Infrastructure.Persistence.Configurations
{
    internal class ConfiguracionCalidadConfiguration : IEntityTypeConfiguration<ConfiguracionCalidad>
    {
        // Initial limits (acidity °D, temperature °C, water %) and a fixed timestamp so the seed is deterministic.
        private const decimal AcidezInicial = 19m;
        private const decimal TemperaturaInicial = 20m;
        private const decimal AguaInicial = 0m;
        private static readonly DateTime ActualizadoEnInicial = new(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);

        public void Configure(EntityTypeBuilder<ConfiguracionCalidad> builder)
        {
            builder.HasKey(c => c.Id);
            builder.Property(c => c.Id).ValueGeneratedNever();
            builder.Property(c => c.ActualizadoEn).IsRequired();
            builder.OwnsOne(c => c.Limites, l =>
            {
                l.Property(x => x.AcidezMaxima).IsRequired().HasPrecision(5, 2);
                l.Property(x => x.TemperaturaMaxima).IsRequired().HasPrecision(5, 2);
                l.Property(x => x.AguaMaxima).IsRequired().HasPrecision(5, 2);
                l.HasData(new
                {
                    ConfiguracionCalidadId = ConfiguracionCalidad.IdUnico,
                    AcidezMaxima = AcidezInicial,
                    TemperaturaMaxima = TemperaturaInicial,
                    AguaMaxima = AguaInicial
                });
            });
            builder.HasData(new
            {
                Id = ConfiguracionCalidad.IdUnico,
                ActualizadoEn = ActualizadoEnInicial
            });
        }
    }
}
