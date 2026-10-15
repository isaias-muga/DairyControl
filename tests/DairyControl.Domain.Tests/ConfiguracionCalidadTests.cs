using DairyControl.Domain.Entities;
using DairyControl.Domain.ValueObjects;

namespace DairyControl.Domain.Tests
{
    public class ConfiguracionCalidadTests
    {
        [Fact]
        public void CambiarLimites_NewLimits_UpdatesLimitsAndTimestamp()
        {
            // Arrange
            var inicial = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
            var configuracion = ConfiguracionCalidad.Crear(LimitesCalidad.Create(19m, 20m, 0m), inicial);
            var nuevos = LimitesCalidad.Create(18m, 8m, 1.5m);
            var ahora = new DateTime(2026, 10, 15, 12, 0, 0, DateTimeKind.Utc);

            // Act
            configuracion.CambiarLimites(nuevos, ahora);

            // Assert
            Assert.Equal(nuevos, configuracion.Limites);
            Assert.Equal(ahora, configuracion.ActualizadoEn);
        }

        [Fact]
        public void CambiarLimites_NullLimits_ThrowsArgumentNullException()
        {
            // Arrange
            var configuracion = ConfiguracionCalidad.Crear(LimitesCalidad.Create(19m, 20m, 0m), DateTime.UtcNow);

            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => configuracion.CambiarLimites(null!, DateTime.UtcNow));
        }
    }
}
