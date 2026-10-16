using DairyControl.Domain.Exceptions;
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
            mockQueries.Setup(q => q.GetResumenAsync(desde, hasta, null)).ReturnsAsync(esperado);

            var service = new ResumenRecepcionesAppService(mockQueries.Object);

            // Act
            var result = await service.GetResumenAsync(desde, hasta);

            // Assert
            Assert.Same(esperado, result);
            mockQueries.Verify(q => q.GetResumenAsync(desde, hasta, null), Times.Once);
        }

        [Fact]
        public async Task GetResumenAsync_WithProveedorId_PassesItToTheQuery()
        {
            // Arrange
            var desde = new DateOnly(2026, 10, 1);
            var hasta = new DateOnly(2026, 10, 14);
            var proveedorId = Guid.NewGuid();
            var mockQueries = new Mock<IRecepcionQueries>();
            mockQueries.Setup(q => q.GetResumenAsync(desde, hasta, proveedorId))
                .ReturnsAsync(new ResumenRecepcionesDto());

            var service = new ResumenRecepcionesAppService(mockQueries.Object);

            // Act
            var result = await service.GetResumenAsync(desde, hasta, proveedorId);

            // Assert
            Assert.NotNull(result);
            mockQueries.Verify(q => q.GetResumenAsync(desde, hasta, proveedorId), Times.Once);
        }

        [Fact]
        public async Task GetResumenAsync_EmptyProveedorId_ThrowsReglaDeNegocioException()
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var service = new ResumenRecepcionesAppService(mockQueries.Object);

            // Act
            var ex = await Assert.ThrowsAsync<ReglaDeNegocioException>(
                () => service.GetResumenAsync(new DateOnly(2026, 10, 1), new DateOnly(2026, 10, 14), Guid.Empty));

            // Assert
            Assert.Contains("proveedor", ex.Message);
            mockQueries.Verify(
                q => q.GetResumenAsync(It.IsAny<DateOnly>(), It.IsAny<DateOnly>(), It.IsAny<Guid?>()), Times.Never);
        }

        [Fact]
        public async Task GetResumenAsync_DesdeBefore2000_ThrowsReglaDeNegocioException()
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var service = new ResumenRecepcionesAppService(mockQueries.Object);

            // Act
            var ex = await Assert.ThrowsAsync<ReglaDeNegocioException>(
                () => service.GetResumenAsync(new DateOnly(1999, 12, 31), new DateOnly(2000, 1, 5)));

            // Assert
            Assert.Contains("desde", ex.Message);
            mockQueries.Verify(
                q => q.GetResumenAsync(It.IsAny<DateOnly>(), It.IsAny<DateOnly>(), It.IsAny<Guid?>()), Times.Never);
        }

        [Fact]
        public async Task GetResumenAsync_DesdeOn2000_01_01_CallsQueryOnce()
        {
            // Arrange
            var desde = new DateOnly(2000, 1, 1);
            var hasta = new DateOnly(2000, 1, 31);
            var mockQueries = new Mock<IRecepcionQueries>();
            mockQueries.Setup(q => q.GetResumenAsync(desde, hasta, null)).ReturnsAsync(new ResumenRecepcionesDto());
            var service = new ResumenRecepcionesAppService(mockQueries.Object);

            // Act
            var result = await service.GetResumenAsync(desde, hasta);

            // Assert
            Assert.NotNull(result);
            mockQueries.Verify(q => q.GetResumenAsync(desde, hasta, null), Times.Once);
        }

        [Fact]
        public async Task GetResumenAsync_DesdeAfterHasta_ThrowsReglaDeNegocioException()
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var service = new ResumenRecepcionesAppService(mockQueries.Object);

            // Act
            var ex = await Assert.ThrowsAsync<ReglaDeNegocioException>(
                () => service.GetResumenAsync(new DateOnly(2026, 10, 14), new DateOnly(2026, 10, 1)));

            // Assert
            Assert.Contains("desde", ex.Message);
            mockQueries.Verify(
                q => q.GetResumenAsync(It.IsAny<DateOnly>(), It.IsAny<DateOnly>(), It.IsAny<Guid?>()), Times.Never);
        }

        [Fact]
        public async Task GetResumenAsync_RangeOver366Days_ThrowsReglaDeNegocioException()
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var service = new ResumenRecepcionesAppService(mockQueries.Object);
            var desde = new DateOnly(2025, 1, 1);

            // Act
            var ex = await Assert.ThrowsAsync<ReglaDeNegocioException>(
                () => service.GetResumenAsync(desde, desde.AddDays(366)));

            // Assert
            Assert.Contains("366", ex.Message);
            mockQueries.Verify(
                q => q.GetResumenAsync(It.IsAny<DateOnly>(), It.IsAny<DateOnly>(), It.IsAny<Guid?>()), Times.Never);
        }
    }
}
