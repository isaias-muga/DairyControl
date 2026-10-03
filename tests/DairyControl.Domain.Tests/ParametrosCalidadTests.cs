using DairyControl.Domain.ValueObjects;

namespace DairyControl.Domain.Tests
{
    public class ParametrosCalidadTests
    {
        [Fact]
        public void Create_ValidValues_ReturnsInstance()
        {
            // Act
            var parametrosCalidad = ParametrosCalidad.Create(12m, 18m, 4m, 1500m);

            // Assert
            Assert.NotNull(parametrosCalidad);

        }

        [Fact]
        public void Create_NegativeAcidez_ThrowsArgumentException()
        {
            // Act & Assert
            Assert.Throws<ArgumentException>(() =>
                ParametrosCalidad.Create(12m, -5m, 4m, 1500m));
        }

        [Fact]
        public void Create_NegativeTemperatura_ThrowsArgumentException()
        {
            // Act & Assert
            Assert.Throws<ArgumentException>(() =>
                ParametrosCalidad.Create(-12m, 18m, 4m, 1500m));
        }

        [Fact]
        public void Create_LitrosBelowMinimum_ThrowsArgumentException()
        {
            // Act & Assert
            Assert.Throws<ArgumentException>(() =>
                ParametrosCalidad.Create(12m, 18m, 4m, 0m));
        }

        [Fact]
        public void Create_GrasaNull_ReturnsInstance()
        {
            // Act
            var parametrosCalidad = ParametrosCalidad.Create(null, 18m, 4m, 1500m);
            // Assert
            Assert.NotNull(parametrosCalidad);
        }
    }
}
