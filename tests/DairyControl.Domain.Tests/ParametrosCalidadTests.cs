using DairyControl.Domain.ValueObjects;

namespace DairyControl.Domain.Tests
{
    public class ParametrosCalidadTests
    {
        // Valid baseline; each test overrides only the value under test
        private static ParametrosCalidad Crear(
            decimal? grasa = 3.5m,
            decimal acidez = 17m,
            decimal temperatura = 4m,
            decimal litros = 1500m,
            decimal? agua = null) =>
            ParametrosCalidad.Create(grasa, acidez, temperatura, litros, agua);

        [Fact]
        public void Create_ValidValues_ReturnsInstance()
        {
            // Act
            var parametrosCalidad = Crear();

            // Assert
            Assert.NotNull(parametrosCalidad);
        }

        [Fact]
        public void Create_GrasaNull_ReturnsInstance()
        {
            // Act
            var parametrosCalidad = Crear(grasa: null);

            // Assert
            Assert.NotNull(parametrosCalidad);
            Assert.Null(parametrosCalidad.Grasa);
        }

        // Litros: > 0 and <= 30000

        [Theory]
        [InlineData(0.001)]
        [InlineData(1500)]
        [InlineData(30000)]
        public void Create_LitrosWithinRange_StoresValue(double litros)
        {
            // Act
            var parametros = Crear(litros: (decimal)litros);

            // Assert
            Assert.Equal((decimal)litros, parametros.Litros);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(30000.001)]
        [InlineData(100000)]
        public void Create_LitrosOutOfRange_ThrowsArgumentException(double litros)
        {
            // Act
            var ex = Assert.Throws<ArgumentException>(() => Crear(litros: (decimal)litros));

            // Assert
            Assert.Equal("litros", ex.ParamName);
            Assert.Contains("litros", ex.Message);
        }

        // Grasa: 1 to 10 %

        [Theory]
        [InlineData(1)]
        [InlineData(3.5)]
        [InlineData(10)]
        public void Create_GrasaWithinRange_StoresValue(double grasa)
        {
            // Act
            var parametros = Crear(grasa: (decimal)grasa);

            // Assert
            Assert.Equal((decimal)grasa, parametros.Grasa);
        }

        [Theory]
        [InlineData(0.99)]
        [InlineData(0)]
        [InlineData(-5)]
        [InlineData(10.01)]
        [InlineData(12)]
        public void Create_GrasaOutOfRange_ThrowsArgumentException(double grasa)
        {
            // Act
            var ex = Assert.Throws<ArgumentException>(() => Crear(grasa: (decimal)grasa));

            // Assert
            Assert.Equal("grasa", ex.ParamName);
            Assert.Equal("La grasa debe estar entre 1 y 10 %.", ex.Message.Split(" (Parameter")[0]);
        }

        // Acidez: 10 to 30 °D

        [Theory]
        [InlineData(10)]
        [InlineData(17.5)]
        [InlineData(30)]
        public void Create_AcidezWithinRange_StoresValue(double acidez)
        {
            // Act
            var parametros = Crear(acidez: (decimal)acidez);

            // Assert
            Assert.Equal((decimal)acidez, parametros.Acidez);
        }

        [Theory]
        [InlineData(9.99)]
        [InlineData(0)]
        [InlineData(-5)]
        [InlineData(30.01)]
        public void Create_AcidezOutOfRange_ThrowsArgumentException(double acidez)
        {
            // Act
            var ex = Assert.Throws<ArgumentException>(() => Crear(acidez: (decimal)acidez));

            // Assert
            Assert.Equal("acidez", ex.ParamName);
            Assert.Contains("entre 10 y 30 °D", ex.Message);
        }

        // Temperatura: 0 to 45 °C

        [Theory]
        [InlineData(0)]
        [InlineData(22.4)]
        [InlineData(45)]
        public void Create_TemperaturaWithinRange_StoresValue(double temperatura)
        {
            // Act
            var parametros = Crear(temperatura: (decimal)temperatura);

            // Assert
            Assert.Equal((decimal)temperatura, parametros.Temperatura);
        }

        [Theory]
        [InlineData(-0.01)]
        [InlineData(-12)]
        [InlineData(45.01)]
        [InlineData(100)]
        public void Create_TemperaturaOutOfRange_ThrowsArgumentException(double temperatura)
        {
            // Act
            var ex = Assert.Throws<ArgumentException>(() => Crear(temperatura: (decimal)temperatura));

            // Assert
            Assert.Equal("temperatura", ex.ParamName);
            Assert.Contains("entre 0 y 45 °C", ex.Message);
        }

        // Agua: 0 to 100 %

        [Theory]
        [InlineData(0)]
        [InlineData(2.5)]
        [InlineData(100)]
        public void Create_AguaWithinRange_StoresValue(double agua)
        {
            // Act
            var parametros = Crear(agua: (decimal)agua);

            // Assert
            Assert.Equal((decimal)agua, parametros.AguaPorcentaje);
        }

        [Fact]
        public void Create_AguaOmitted_IsNull()
        {
            // Act
            var parametros = Crear();

            // Assert
            Assert.Null(parametros.AguaPorcentaje);
        }

        [Theory]
        [InlineData(-0.01)]
        [InlineData(100.01)]
        public void Create_AguaOutOfRange_ThrowsArgumentException(double agua)
        {
            // Act
            var ex = Assert.Throws<ArgumentException>(() => Crear(agua: (decimal)agua));

            // Assert
            Assert.Equal("aguaPorcentaje", ex.ParamName);
        }

        // An impossible value is a typing error; a value outside the quality limits is not

        [Fact]
        public void Create_ValuesOutsideQualityLimitsButPlausible_AreAccepted()
        {
            // Arrange: acidity 29 °D, temperature 40 °C and 8 % water are far above the default limits
            // (19 / 20 / 0) but physically plausible, so they are stored (and flagged elsewhere).

            // Act
            var parametros = Crear(acidez: 29m, temperatura: 40m, agua: 8m);

            // Assert
            Assert.NotNull(parametros);
        }
    }
}
