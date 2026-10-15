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

        [Theory]
        [InlineData(0)]
        [InlineData(2.5)]
        [InlineData(100)]
        public void Create_AguaWithinRange_StoresValue(double agua)
        {
            // Act
            var parametros = ParametrosCalidad.Create(null, 18m, 4m, 1500m, (decimal)agua);

            // Assert
            Assert.Equal((decimal)agua, parametros.AguaPorcentaje);
        }

        [Fact]
        public void Create_AguaOmitted_IsNull()
        {
            // Act
            var parametros = ParametrosCalidad.Create(null, 18m, 4m, 1500m);

            // Assert
            Assert.Null(parametros.AguaPorcentaje);
        }

        [Theory]
        [InlineData(-0.01)]
        [InlineData(100.01)]
        public void Create_AguaOutOfRange_ThrowsArgumentException(double agua)
        {
            // Act
            var ex = Assert.Throws<ArgumentException>(() =>
                ParametrosCalidad.Create(null, 18m, 4m, 1500m, (decimal)agua));

            // Assert
            Assert.Equal("aguaPorcentaje", ex.ParamName);
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
