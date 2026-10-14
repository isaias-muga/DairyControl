using DairyControl.Domain.ValueObjects;

namespace DairyControl.Domain.Tests
{
    public class LimitesCalidadTests
    {
        private static LimitesCalidad Limites() => LimitesCalidad.Create(19m, 20m);

        [Theory]
        [InlineData(19.01, 10, true)]
        [InlineData(19, 10, false)]
        [InlineData(15, 20.01, true)]
        [InlineData(15, 20, false)]
        [InlineData(25, 25, true)]
        [InlineData(15, 4, false)]
        public void EstaFueraDeRango_Values_FollowsOrRule(double acidez, double temperatura, bool esperado)
        {
            // Arrange
            var limites = Limites();

            // Act
            var result = limites.EstaFueraDeRango((decimal)acidez, (decimal)temperatura);

            // Assert
            Assert.Equal(esperado, result);
        }

        [Fact]
        public void FueraDeRango_ExpressionOverProjection_MatchesEstaFueraDeRango()
        {
            // Arrange
            var limites = Limites();
            var regla = limites.FueraDeRango<(decimal A, decimal T)>(x => x.A, x => x.T).Compile();

            // Act & Assert
            foreach (var (a, t) in new[] { (18m, 10m), (19.5m, 10m), (15m, 21m), (30m, 30m), (19m, 20m) })
            {
                Assert.Equal(limites.EstaFueraDeRango(a, t), regla((a, t)));
            }
        }

        [Theory]
        [InlineData(0, 20)]
        [InlineData(-1, 20)]
        [InlineData(19, 0)]
        [InlineData(19, -5)]
        public void Create_NonPositiveLimit_ThrowsArgumentException(double acidez, double temperatura)
        {
            // Act & Assert
            Assert.Throws<ArgumentException>(() => LimitesCalidad.Create((decimal)acidez, (decimal)temperatura));
        }
    }
}
