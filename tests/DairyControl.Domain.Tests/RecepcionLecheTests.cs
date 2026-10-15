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
        [InlineData("")]
        [InlineData("    ")]
        public void Registrar_BlankObservaciones_StoresNull(string observaciones)
        {
            // Arrange
            var parametros = ParametrosCalidad.Create(null, 18m, 4m, 1000m, null);

            // Act
            var recepcion = RecepcionLeche.Registrar(parametros, new DateTime(2026, 10, 1, 6, 0, 0), 1, observaciones);

            // Assert
            Assert.Null(recepcion.Observaciones);
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

        // Silo: 1 to 20

        [Theory]
        [InlineData(1)]
        [InlineData(7)]
        [InlineData(20)]
        public void Registrar_SiloWithinRange_StoresSilo(int silo)
        {
            // Arrange
            var parametros = ParametrosCalidad.Create(null, 18m, 4m, 1000m);

            // Act
            var recepcion = RecepcionLeche.Registrar(parametros, new DateTime(2026, 10, 1, 6, 0, 0), silo, null);

            // Assert
            Assert.Equal(silo, recepcion.Silo);
        }

        [Fact]
        public void Registrar_NoSilo_SiloIsNull()
        {
            // Arrange
            var parametros = ParametrosCalidad.Create(null, 18m, 4m, 1000m);

            // Act
            var recepcion = RecepcionLeche.Registrar(parametros, new DateTime(2026, 10, 1, 6, 0, 0), null, null);

            // Assert
            Assert.Null(recepcion.Silo);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(21)]
        [InlineData(99)]
        public void Registrar_SiloOutOfRange_ThrowsArgumentException(int silo)
        {
            // Arrange
            var parametros = ParametrosCalidad.Create(null, 18m, 4m, 1000m);

            // Act
            var ex = Assert.Throws<ArgumentException>(() =>
                RecepcionLeche.Registrar(parametros, new DateTime(2026, 10, 1, 6, 0, 0), silo, null));

            // Assert
            Assert.Equal("silo", ex.ParamName);
            Assert.Contains("El silo debe estar entre 1 y 20.", ex.Message);
        }
    }
}
