using DairyControl.Domain.Entities;
using DairyControl.Domain.ValueObjects;

namespace DairyControl.Domain.Tests
{
    public class RecepcionLecheTests
    {
        private static RecepcionLeche Registrar(decimal litros, decimal? agua, int? ticket = null)
        {
            var parametros = ParametrosCalidad.Create(null, 18m, 4m, litros, agua);
            return RecepcionLeche.Registrar(parametros, new DateTime(2026, 10, 1, 6, 0, 0), 1, null, ticket);
        }

        [Theory]
        [InlineData(1000, 0, 1000)]
        [InlineData(1000, 10, 900)]
        [InlineData(1000, 2.5, 975)]
        [InlineData(1000, 100, 0)]
        public void LitrosAPagar_WaterPercentage_DeductsWater(double litros, double agua, double esperado)
        {
            // Arrange
            var recepcion = Registrar((decimal)litros, (decimal)agua);

            // Act
            var result = recepcion.LitrosAPagar;

            // Assert
            Assert.Equal((decimal)esperado, result);
        }

        [Fact]
        public void LitrosAPagar_WaterNull_TreatsWaterAsZero()
        {
            // Arrange
            var recepcion = Registrar(1000m, null);

            // Act
            var result = recepcion.LitrosAPagar;

            // Assert
            Assert.Equal(1000m, result);
        }

        [Fact]
        public void Registrar_ValidTicket_StoresTicket()
        {
            // Act
            var recepcion = Registrar(1000m, null, 1234);

            // Assert
            Assert.Equal(1234, recepcion.Ticket);
        }

        [Fact]
        public void Registrar_NoTicket_TicketIsNull()
        {
            // Act
            var recepcion = Registrar(1000m, null);

            // Assert
            Assert.Null(recepcion.Ticket);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-3)]
        public void Registrar_NonPositiveTicket_ThrowsArgumentException(int ticket)
        {
            // Act
            var ex = Assert.Throws<ArgumentException>(() => Registrar(1000m, null, ticket));

            // Assert
            Assert.Equal("ticket", ex.ParamName);
        }
    }
}
