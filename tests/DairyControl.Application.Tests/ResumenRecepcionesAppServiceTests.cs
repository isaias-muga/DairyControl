using DairyControl.Application.DTOs;
using DairyControl.Application.Queries;
using DairyControl.Application.Services;
using Moq;

namespace DairyControl.Application.Tests
{
    public class ResumenRecepcionesAppServiceTests
    {
        [Fact]
        public async Task GetResumenAsync_ValidRange_CallsQueryOnce()
        {
            // Arrange
            var desde = new DateOnly(2026, 10, 1);
            var hasta = new DateOnly(2026, 10, 14);
            var esperado = new ResumenRecepcionesDto { Desde = desde, Hasta = hasta };
            var mockQueries = new Mock<IRecepcionQueries>();
            mockQueries.Setup(q => q.GetResumenAsync(desde, hasta)).ReturnsAsync(esperado);

            var service = new ResumenRecepcionesAppService(mockQueries.Object);

            // Act
            var result = await service.GetResumenAsync(desde, hasta);

            // Assert
            Assert.Same(esperado, result);
            mockQueries.Verify(q => q.GetResumenAsync(desde, hasta), Times.Once);
        }

        [Fact]
        public async Task GetResumenAsync_DesdeAfterHasta_ThrowsArgumentException()
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var service = new ResumenRecepcionesAppService(mockQueries.Object);

            // Act
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => service.GetResumenAsync(new DateOnly(2026, 10, 14), new DateOnly(2026, 10, 1)));

            // Assert
            Assert.Contains("desde", ex.Message);
            mockQueries.Verify(q => q.GetResumenAsync(It.IsAny<DateOnly>(), It.IsAny<DateOnly>()), Times.Never);
        }

        [Fact]
        public async Task GetResumenAsync_RangeOver366Days_ThrowsArgumentException()
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var service = new ResumenRecepcionesAppService(mockQueries.Object);
            var desde = new DateOnly(2025, 1, 1);

            // Act
            var ex = await Assert.ThrowsAsync<ArgumentException>(
                () => service.GetResumenAsync(desde, desde.AddDays(366)));

            // Assert
            Assert.Contains("366", ex.Message);
            mockQueries.Verify(q => q.GetResumenAsync(It.IsAny<DateOnly>(), It.IsAny<DateOnly>()), Times.Never);
        }
    }
}
