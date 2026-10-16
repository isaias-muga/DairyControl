using DairyControl.Domain.Exceptions;
using DairyControl.Application.DTOs;
using DairyControl.Application.Queries;
using DairyControl.Application.Services;
using Moq;

namespace DairyControl.Application.Tests
{
    public class ListadoRecepcionesAppServiceTests
    {
        private static FiltroRecepciones Filtro() => new()
        {
            Desde = new DateOnly(2026, 10, 1),
            Hasta = new DateOnly(2026, 10, 31)
        };

        [Fact]
        public async Task GetListadoAsync_ValidFilter_CallsQueryOnceAndReturnsItsResult()
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var esperado = new ListadoRecepcionesDto { Pagina = 1 };
            var filtro = Filtro();
            mockQueries.Setup(q => q.GetListadoAsync(filtro)).ReturnsAsync(esperado);
            var service = new ListadoRecepcionesAppService(mockQueries.Object);

            // Act
            var resultado = await service.GetListadoAsync(filtro);

            // Assert
            Assert.Same(esperado, resultado);
            mockQueries.Verify(q => q.GetListadoAsync(filtro), Times.Once);
        }

        [Fact]
        public async Task GetListadoAsync_DesdeAfterHasta_ThrowsAndDoesNotQuery()
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var service = new ListadoRecepcionesAppService(mockQueries.Object);
            var filtro = Filtro();
            filtro.Desde = new DateOnly(2026, 11, 1);

            // Act
            var ex = await Assert.ThrowsAsync<ReglaDeNegocioException>(() => service.GetListadoAsync(filtro));

            // Assert
            Assert.Equal("desde", ex.Campo);
            mockQueries.Verify(q => q.GetListadoAsync(It.IsAny<FiltroRecepciones>()), Times.Never);
        }

        [Fact]
        public async Task GetListadoAsync_RangeLongerThanMaximum_ThrowsAndDoesNotQuery()
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var service = new ListadoRecepcionesAppService(mockQueries.Object);
            var filtro = Filtro();
            filtro.Desde = new DateOnly(2025, 1, 1);

            // Act
            var ex = await Assert.ThrowsAsync<ReglaDeNegocioException>(() => service.GetListadoAsync(filtro));

            // Assert
            Assert.Equal("hasta", ex.Campo);
            mockQueries.Verify(q => q.GetListadoAsync(It.IsAny<FiltroRecepciones>()), Times.Never);
        }

        [Fact]
        public async Task GetListadoAsync_DesdeBeforeMinimum_ThrowsAndDoesNotQuery()
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var service = new ListadoRecepcionesAppService(mockQueries.Object);
            var filtro = Filtro();
            filtro.Desde = new DateOnly(1999, 12, 31);

            // Act
            var ex = await Assert.ThrowsAsync<ReglaDeNegocioException>(() => service.GetListadoAsync(filtro));

            // Assert
            Assert.Equal("desde", ex.Campo);
            mockQueries.Verify(q => q.GetListadoAsync(It.IsAny<FiltroRecepciones>()), Times.Never);
        }

        [Fact]
        public async Task GetListadoAsync_EmptyProveedorId_ThrowsAndDoesNotQuery()
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var service = new ListadoRecepcionesAppService(mockQueries.Object);
            var filtro = Filtro();
            filtro.ProveedorId = Guid.Empty;

            // Act
            var ex = await Assert.ThrowsAsync<ReglaDeNegocioException>(() => service.GetListadoAsync(filtro));

            // Assert
            Assert.Equal("proveedorId", ex.Campo);
            mockQueries.Verify(q => q.GetListadoAsync(It.IsAny<FiltroRecepciones>()), Times.Never);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-5)]
        public async Task GetListadoAsync_TicketBelowOne_ThrowsAndDoesNotQuery(int ticket)
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var service = new ListadoRecepcionesAppService(mockQueries.Object);
            var filtro = Filtro();
            filtro.Ticket = ticket;

            // Act
            var ex = await Assert.ThrowsAsync<ReglaDeNegocioException>(() => service.GetListadoAsync(filtro));

            // Assert
            Assert.Equal("ticket", ex.Campo);
            mockQueries.Verify(q => q.GetListadoAsync(It.IsAny<FiltroRecepciones>()), Times.Never);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public async Task GetListadoAsync_PageBelowOne_ThrowsAndDoesNotQuery(int pagina)
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var service = new ListadoRecepcionesAppService(mockQueries.Object);
            var filtro = Filtro();
            filtro.Pagina = pagina;

            // Act
            var ex = await Assert.ThrowsAsync<ReglaDeNegocioException>(() => service.GetListadoAsync(filtro));

            // Assert
            Assert.Equal("pagina", ex.Campo);
            mockQueries.Verify(q => q.GetListadoAsync(It.IsAny<FiltroRecepciones>()), Times.Never);
        }

        [Fact]
        public async Task GetListadoAsync_PageAboveMaximum_ThrowsAndDoesNotQuery()
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var service = new ListadoRecepcionesAppService(mockQueries.Object);
            var filtro = Filtro();
            filtro.Pagina = ListadoRecepcionesAppService.MaxPagina + 1;

            // Act
            var ex = await Assert.ThrowsAsync<ReglaDeNegocioException>(() => service.GetListadoAsync(filtro));

            // Assert
            Assert.Equal("pagina", ex.Campo);
            mockQueries.Verify(q => q.GetListadoAsync(It.IsAny<FiltroRecepciones>()), Times.Never);
        }

        [Fact]
        public async Task GetListadoAsync_MaximumPage_CallsQueryOnce()
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            var filtro = Filtro();
            filtro.Pagina = ListadoRecepcionesAppService.MaxPagina;
            mockQueries.Setup(q => q.GetListadoAsync(filtro)).ReturnsAsync(new ListadoRecepcionesDto());
            var service = new ListadoRecepcionesAppService(mockQueries.Object);

            // Act
            await service.GetListadoAsync(filtro);

            // Assert
            mockQueries.Verify(q => q.GetListadoAsync(filtro), Times.Once);
        }

        [Fact]
        public async Task GetSiguienteTicketAsync_Called_ReturnsTheQueryValue()
        {
            // Arrange
            var mockQueries = new Mock<IRecepcionQueries>();
            mockQueries.Setup(q => q.GetSiguienteTicketAsync()).ReturnsAsync((int?)4981);
            var service = new ListadoRecepcionesAppService(mockQueries.Object);

            // Act
            var ticket = await service.GetSiguienteTicketAsync();

            // Assert
            Assert.Equal(4981, ticket);
            mockQueries.Verify(q => q.GetSiguienteTicketAsync(), Times.Once);
        }
    }
}
