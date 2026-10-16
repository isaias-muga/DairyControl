using DairyControl.Domain.ValueObjects;

namespace DairyControl.Domain.Tests
{
    public class LimitesCalidadTests
    {
        private static LimitesCalidad Limites() => LimitesCalidad.Create(19m, 20m, 2m);

        [Theory]
        [InlineData(19.01, 10, 0, true)]
        [InlineData(19, 10, 0, false)]
        [InlineData(15, 20.01, 0, true)]
        [InlineData(15, 20, 0, false)]
        [InlineData(25, 25, 0, true)]
        [InlineData(15, 4, 0, false)]
        [InlineData(15, 4, 2.01, true)]
        [InlineData(15, 4, 2, false)]
        [InlineData(25, 25, 5, true)]
        public void EstaFueraDeRango_Values_FollowsOrRule(double acidez, double temperatura, double agua, bool esperado)
        {
            // Arrange
            var limites = Limites();

            // Act
            var result = limites.EstaFueraDeRango((decimal)acidez, (decimal)temperatura, (decimal)agua);

            // Assert
            Assert.Equal(esperado, result);
        }

        [Fact]
        public void FueraDeRango_ExpressionOverProjection_MatchesEstaFueraDeRango()
        {
            // Arrange
            var limites = Limites();
            var regla = limites.FueraDeRango<(decimal A, decimal T, decimal W)>(x => x.A, x => x.T, x => x.W).Compile();

            // Act & Assert
            foreach (var (a, t, w) in new[] { (18m, 10m, 0m), (19.5m, 10m, 0m), (15m, 21m, 0m), (30m, 30m, 0m), (19m, 20m, 2m), (15m, 10m, 2.5m) })
            {
                Assert.Equal(limites.EstaFueraDeRango(a, t, w), regla((a, t, w)));
            }
        }

        [Theory]
        [InlineData(10, 0, 0)]
        [InlineData(30, 40, 10)]
        [InlineData(19, 20, 0)]
        public void Create_LimitsOnBoundaries_ReturnsInstance(double acidez, double temperatura, double agua)
        {
            // Act
            var limites = LimitesCalidad.Create((decimal)acidez, (decimal)temperatura, (decimal)agua);

            // Assert
            Assert.NotNull(limites);
        }

        [Theory]
        [InlineData(9.99, 20, 0, "acidezMaxima")]
        [InlineData(30.01, 20, 0, "acidezMaxima")]
        [InlineData(19, -0.01, 0, "temperaturaMaxima")]
        [InlineData(19, 40.01, 0, "temperaturaMaxima")]
        [InlineData(19, 20, -0.01, "aguaMaxima")]
        [InlineData(19, 20, 10.01, "aguaMaxima")]
        public void Create_LimitOutOfRange_ThrowsArgumentException(double acidez, double temperatura, double agua, string parametro)
        {
            // Act
            var ex = Assert.Throws<ArgumentException>(() =>
                LimitesCalidad.Create((decimal)acidez, (decimal)temperatura, (decimal)agua));

            // Assert
            Assert.Equal(parametro, ex.ParamName);
        }

        [Fact]
        public void Predeterminados_DefaultLimits_Are19Dornic20Celsius0Water()
        {
            // Act
            var limites = LimitesCalidad.Predeterminados;

            // Assert
            Assert.Equal(19m, limites.AcidezMaxima);
            Assert.Equal(20m, limites.TemperaturaMaxima);
            Assert.Equal(0m, limites.AguaMaxima);
        }

        [Theory]
        [InlineData(19, false)]
        [InlineData(19.01, true)]
        public void AcidezAlta_ValueAroundMaximum_FlagsOnlyAboveIt(double acidez, bool esperado)
        {
            // Arrange
            var limites = LimitesCalidad.Predeterminados;
            var regla = limites.AcidezAlta<decimal>(x => x).Compile();

            // Act
            var resultado = regla((decimal)acidez);

            // Assert
            Assert.Equal(esperado, resultado);
        }

        [Theory]
        [InlineData(20, false)]
        [InlineData(20.01, true)]
        public void TemperaturaAlta_ValueAroundMaximum_FlagsOnlyAboveIt(double temperatura, bool esperado)
        {
            // Arrange
            var limites = LimitesCalidad.Predeterminados;
            var regla = limites.TemperaturaAlta<decimal>(x => x).Compile();

            // Act
            var resultado = regla((decimal)temperatura);

            // Assert
            Assert.Equal(esperado, resultado);
        }

        [Theory]
        [InlineData(0, false)]
        [InlineData(0.01, true)]
        public void AguaAlta_ValueAroundMaximum_FlagsOnlyAboveIt(double agua, bool esperado)
        {
            // Arrange
            var limites = LimitesCalidad.Predeterminados;
            var regla = limites.AguaAlta<decimal>(x => x).Compile();

            // Act
            var resultado = regla((decimal)agua);

            // Assert
            Assert.Equal(esperado, resultado);
        }

        [Theory]
        [InlineData(19, 20, 0, false)]
        [InlineData(19.5, 20, 0, true)]
        [InlineData(19, 21, 0, true)]
        [InlineData(19, 20, 1.5, true)]
        public void EstaFueraDeRango_AnyReasonAboveLimit_ReturnsTrue(double acidez, double temperatura, double agua, bool esperado)
        {
            // Arrange
            var limites = LimitesCalidad.Predeterminados;

            // Act
            var resultado = limites.EstaFueraDeRango((decimal)acidez, (decimal)temperatura, (decimal)agua);

            // Assert
            Assert.Equal(esperado, resultado);
        }
    }
}
