using DairyControl.Application.DTOs;
using DairyControl.Application.Services;
using DairyControl.Domain.Entities;
using DairyControl.Domain.Exceptions;
using DairyControl.Domain.Interfaces;
using DairyControl.Domain.ValueObjects;
using Moq;

namespace DairyControl.Application.Tests
{
    public class ProveedorAppServiceTests
    {
        [Fact]
        public async Task GetByIdAsync_ProveedorDoesNotExist_ReturnsNull()
        {
            // Arrange
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Proveedor?)null);

            var service = new ProveedorAppService(mockRepo.Object);

            // Act
            var result = await service.GetByIdAsync(Guid.NewGuid());
            // Assert
            Assert.Null(result);
        }

        [Fact]

        public async Task GetByIdAsync_ProveedorExists_ReturnsDetalleDto()
        {
            // Arrange
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(Proveedor.Crear("Proveedor Test"));

            var service = new ProveedorAppService(mockRepo.Object);

            // Act
            var result = await service.GetByIdAsync(Guid.NewGuid());

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Proveedor Test", result.Nombre);
            Assert.Empty(result.Recepciones);

        }

        [Fact]
        public async Task GetAllAsync_NoProveedores_ReturnsEmptyList()
        {
            // Arrange
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Proveedor>());

            var service = new ProveedorAppService(mockRepo.Object);

            // Act
            var result = await service.GetAllAsync();

            // Assert
            Assert.Empty(result);
            mockRepo.Verify(r => r.GetAllAsync(), Times.Once);
            mockRepo.Verify(r => r.AddAsync(It.IsAny<Proveedor>()), Times.Never);
            mockRepo.Verify(r => r.UpdateAsync(It.IsAny<Proveedor>()), Times.Never);
        }

        [Fact]
        public async Task GetAllAsync_ProveedoresExist_ReturnsMappedDtos()
        {
            // Arrange
            var proveedorA = Proveedor.Crear("Proveedor A");
            var proveedorB = Proveedor.Crear("Proveedor B");
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Proveedor> { proveedorA, proveedorB });

            var service = new ProveedorAppService(mockRepo.Object);

            // Act
            var result = await service.GetAllAsync();

            // Assert
            Assert.Equal(2, result.Count);
            Assert.Equal(proveedorA.Id, result[0].Id);
            Assert.Equal("Proveedor A", result[0].Nombre);
            Assert.Equal(proveedorB.Id, result[1].Id);
            Assert.Equal("Proveedor B", result[1].Nombre);
            mockRepo.Verify(r => r.GetAllAsync(), Times.Once);
        }

        [Fact]
        public async Task GetAllAsync_ProveedorWithRecepciones_MapsCantidadRecepciones()
        {
            // Arrange
            var proveedor = Proveedor.Crear("Proveedor Test");
            proveedor.RegistrarRecepcion(ParametrosCalidad.Create(3.5m, 17m, 4.0m, 1000m), DateTime.Now, 1, null);
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Proveedor> { proveedor });

            var service = new ProveedorAppService(mockRepo.Object);

            // Act
            var result = await service.GetAllAsync();

            // Assert
            var dto = Assert.Single(result);
            Assert.Equal(1, dto.CantidadRecepciones);
        }
        [Fact]
        public async Task GetByIdAsync_ProveedorWithRecepciones_ReturnsRecepcionesNewestFirst()
        {
            // Arrange
            var mockRepo = new Mock<IProveedorRepository>();
            var service = new ProveedorAppService(mockRepo.Object);

            var proveedor = Proveedor.Crear("Tambo La Esperanza");
            var parametros = ParametrosCalidad.Create(3.5m, 17m, 4.0m, 1500m);
            var anterior = new DateTime(2026, 10, 1, 6, 0, 0);
            var reciente = new DateTime(2026, 10, 2, 6, 0, 0);
            proveedor.RegistrarRecepcion(parametros, anterior, 1, null);
            proveedor.RegistrarRecepcion(parametros, reciente, 2, "Sin novedades");
            mockRepo.Setup(r => r.GetByIdAsync(proveedor.Id)).ReturnsAsync(proveedor);

            // Act
            var result = await service.GetByIdAsync(proveedor.Id);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Recepciones.Count);
            Assert.Equal(reciente, result.Recepciones[0].FechaHora);
            Assert.Equal(1500m, result.Recepciones[0].Litros);
            Assert.Equal("Sin novedades", result.Recepciones[0].Observaciones);
        }

        [Fact]
        public async Task CrearAsync_ValidDto_CallsAddAsyncAndReturnsDto()
        {
            // Arrange
            var mockRepo = new Mock<IProveedorRepository>();
            var service = new ProveedorAppService(mockRepo.Object);

            var dto = new CrearProveedorDto { Nombre = "Proveedor Test" };

            // Act
            var result = await service.CrearAsync(dto);

            // Assert
            Assert.Equal("Proveedor Test", result.Nombre);
            mockRepo.Verify(r => r.AddAsync(It.IsAny<Proveedor>()), Times.Once);

        }

        [Fact]
        public async Task RegistrarRecepcionAsync_ProveedorDoesNotExist_ReturnsNullAndNeverCallsUpdate()
        {
            // Arrange
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Proveedor?)null);

            var service = new ProveedorAppService(mockRepo.Object);

            // Act
            var result = await service.RegistrarRecepcionAsync(Guid.NewGuid(), new RegistrarRecepcionDto());

            // Assert
            Assert.Null(result);
            mockRepo.Verify(r => r.UpdateAsync(It.IsAny<Proveedor>()), Times.Never);
        }

        [Fact]
        public async Task RegistrarRecepcionAsync_ProveedorExists_CallsUpdateAsyncAndReturnsUpdatedDto()
        {
            // Arrange
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(Proveedor.Crear("Proveedor Test"));
            var service = new ProveedorAppService(mockRepo.Object);

            var RegistrarRecepcionDto = new RegistrarRecepcionDto
            {
                Grasa = 3.5m,
                Acidez = 17m,
                Temperatura = 4.0m,
                Litros = 1000m,
                FechaHora = DateTime.Now,
                Silo = 1,
                Observaciones = "Observación de prueba"
            };

            // Act
            var result = await service.RegistrarRecepcionAsync(Guid.NewGuid(), RegistrarRecepcionDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.CantidadRecepciones);
            mockRepo.Verify(r => r.UpdateAsync(It.IsAny<Proveedor>()), Times.Once);
        }

        [Fact]
        public async Task RegistrarRecepcionAsync_WithAguaAndTicket_StoresThemInTheRecepcion()
        {
            // Arrange
            var proveedor = Proveedor.Crear("Proveedor Test");
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(proveedor.Id)).ReturnsAsync(proveedor);
            var service = new ProveedorAppService(mockRepo.Object);

            var dto = new RegistrarRecepcionDto
            {
                Acidez = 17m,
                Temperatura = 5m,
                Litros = 1000m,
                FechaHora = DateTime.Now,
                AguaPorcentaje = 2m,
                Ticket = 4501
            };

            // Act
            await service.RegistrarRecepcionAsync(proveedor.Id, dto);

            // Assert
            var recepcion = Assert.Single(proveedor.Recepciones);
            Assert.Equal(2m, recepcion.Parametros.AguaPorcentaje);
            Assert.Equal(4501, recepcion.Ticket);
            mockRepo.Verify(r => r.UpdateAsync(proveedor), Times.Once);
        }

        [Fact]
        public async Task RegistrarRecepcionAsync_InvalidAgua_ThrowsAndNeverCallsUpdate()
        {
            // Arrange
            var proveedor = Proveedor.Crear("Proveedor Test");
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(proveedor.Id)).ReturnsAsync(proveedor);
            var service = new ProveedorAppService(mockRepo.Object);

            var dto = new RegistrarRecepcionDto { Acidez = 17m, Temperatura = 5m, Litros = 1000m, AguaPorcentaje = 120m };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => service.RegistrarRecepcionAsync(proveedor.Id, dto));
            mockRepo.Verify(r => r.UpdateAsync(It.IsAny<Proveedor>()), Times.Never);
        }

        [Fact]
        public async Task RegistrarRecepcionAsync_InvalidTicket_ThrowsAndNeverCallsUpdate()
        {
            // Arrange
            var proveedor = Proveedor.Crear("Proveedor Test");
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(proveedor.Id)).ReturnsAsync(proveedor);
            var service = new ProveedorAppService(mockRepo.Object);

            var dto = new RegistrarRecepcionDto { Acidez = 17m, Temperatura = 5m, Litros = 1000m, Ticket = 0 };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => service.RegistrarRecepcionAsync(proveedor.Id, dto));
            mockRepo.Verify(r => r.UpdateAsync(It.IsAny<Proveedor>()), Times.Never);
        }

        [Theory]
        [InlineData("grasa")]
        [InlineData("acidez")]
        [InlineData("temperatura")]
        [InlineData("litros")]
        [InlineData("silo")]
        public async Task RegistrarRecepcionAsync_ImpossibleValue_ThrowsAndNeverCallsUpdate(string campo)
        {
            // Arrange
            var proveedor = Proveedor.Crear("Proveedor Test");
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(proveedor.Id)).ReturnsAsync(proveedor);
            var service = new ProveedorAppService(mockRepo.Object);

            var dto = new RegistrarRecepcionDto { Grasa = 3.5m, Acidez = 17m, Temperatura = 5m, Litros = 1000m, FechaHora = DateTime.Now, Silo = 2 };
            switch (campo)
            {
                case "grasa": dto.Grasa = 12m; break;
                case "acidez": dto.Acidez = 5m; break;
                case "temperatura": dto.Temperatura = 60m; break;
                case "litros": dto.Litros = 45000m; break;
                case "silo": dto.Silo = 99; break;
            }

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => service.RegistrarRecepcionAsync(proveedor.Id, dto));
            Assert.Empty(proveedor.Recepciones);
            mockRepo.Verify(r => r.UpdateAsync(It.IsAny<Proveedor>()), Times.Never);
        }

        [Fact]
        public async Task RegistrarRecepcionAsync_ValueOutsideQualityLimitsButPlausible_IsAccepted()
        {
            // Arrange: acidity 28 °D and 35 °C are far above the default quality limits but plausible
            var proveedor = Proveedor.Crear("Proveedor Test");
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(proveedor.Id)).ReturnsAsync(proveedor);
            var service = new ProveedorAppService(mockRepo.Object);
            var dto = new RegistrarRecepcionDto { Acidez = 28m, Temperatura = 35m, Litros = 1000m, FechaHora = DateTime.Now };

            // Act
            var result = await service.RegistrarRecepcionAsync(proveedor.Id, dto);

            // Assert
            Assert.NotNull(result);
            mockRepo.Verify(r => r.UpdateAsync(proveedor), Times.Once);
        }

        private static RegistrarRecepcionDto DtoConTicket(int? ticket) => new()
        {
            Acidez = 17m,
            Temperatura = 5m,
            Litros = 1000m,
            FechaHora = DateTime.Now,
            Ticket = ticket
        };

        [Fact]
        public async Task RegistrarRecepcionAsync_TicketUsedByAnotherProveedor_ThrowsTicketDuplicadoAndNeverCallsUpdate()
        {
            // Arrange
            var proveedor = Proveedor.Crear("Tambo Nuevo");
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(proveedor.Id)).ReturnsAsync(proveedor);
            mockRepo.Setup(r => r.GetTicketRegistradoAsync(6311))
                .ReturnsAsync(new TicketRegistrado("Tambo Las Acacias", new DateTime(2026, 10, 11, 11, 6, 0)));
            var service = new ProveedorAppService(mockRepo.Object);

            // Act
            var ex = await Assert.ThrowsAsync<TicketDuplicadoException>(() =>
                service.RegistrarRecepcionAsync(proveedor.Id, DtoConTicket(6311)));

            // Assert
            Assert.Equal("El ticket 6311 ya está registrado (Tambo Las Acacias, 11/10/2026)", ex.Message);
            Assert.Empty(proveedor.Recepciones);
            mockRepo.Verify(r => r.UpdateAsync(It.IsAny<Proveedor>()), Times.Never);
        }

        [Fact]
        public async Task RegistrarRecepcionAsync_UnusedTicket_ChecksOnceAndRegisters()
        {
            // Arrange
            var proveedor = Proveedor.Crear("Tambo Nuevo");
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(proveedor.Id)).ReturnsAsync(proveedor);
            mockRepo.Setup(r => r.GetTicketRegistradoAsync(7000)).ReturnsAsync((TicketRegistrado?)null);
            var service = new ProveedorAppService(mockRepo.Object);

            // Act
            var result = await service.RegistrarRecepcionAsync(proveedor.Id, DtoConTicket(7000));

            // Assert
            Assert.NotNull(result);
            Assert.Equal(7000, Assert.Single(proveedor.Recepciones).Ticket);
            mockRepo.Verify(r => r.GetTicketRegistradoAsync(7000), Times.Once);
            mockRepo.Verify(r => r.UpdateAsync(proveedor), Times.Once);
        }

        [Fact]
        public async Task RegistrarRecepcionAsync_NoTicket_NeverChecksTicket()
        {
            // Arrange
            var proveedor = Proveedor.Crear("Tambo Nuevo");
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(proveedor.Id)).ReturnsAsync(proveedor);
            var service = new ProveedorAppService(mockRepo.Object);

            // Act
            await service.RegistrarRecepcionAsync(proveedor.Id, DtoConTicket(null));

            // Assert
            mockRepo.Verify(r => r.GetTicketRegistradoAsync(It.IsAny<int>()), Times.Never);
            mockRepo.Verify(r => r.UpdateAsync(proveedor), Times.Once);
        }

        [Fact]
        public async Task RegistrarRecepcionAsync_NonPositiveTicket_ThrowsArgumentExceptionWithoutChecking()
        {
            // Arrange
            var proveedor = Proveedor.Crear("Tambo Nuevo");
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(proveedor.Id)).ReturnsAsync(proveedor);
            var service = new ProveedorAppService(mockRepo.Object);

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() =>
                service.RegistrarRecepcionAsync(proveedor.Id, DtoConTicket(0)));
            mockRepo.Verify(r => r.GetTicketRegistradoAsync(It.IsAny<int>()), Times.Never);
            mockRepo.Verify(r => r.UpdateAsync(It.IsAny<Proveedor>()), Times.Never);
        }

        [Fact]
        public async Task RegistrarRecepcionAsync_UniqueViolationOnSave_ThrowsTicketDuplicadoWithDetails()
        {
            // Arrange: the pre-check passes, then another operator wins the race
            var proveedor = Proveedor.Crear("Tambo Nuevo");
            var mockRepo = new Mock<IProveedorRepository>();
            mockRepo.Setup(r => r.GetByIdAsync(proveedor.Id)).ReturnsAsync(proveedor);
            mockRepo.SetupSequence(r => r.GetTicketRegistradoAsync(6311))
                .ReturnsAsync((TicketRegistrado?)null)
                .ReturnsAsync(new TicketRegistrado("Tambo Las Acacias", new DateTime(2026, 10, 15, 11, 50, 0)));
            mockRepo.Setup(r => r.UpdateAsync(proveedor)).ThrowsAsync(new TicketDuplicadoException("El ticket ya está registrado."));
            var service = new ProveedorAppService(mockRepo.Object);

            // Act
            var ex = await Assert.ThrowsAsync<TicketDuplicadoException>(() =>
                service.RegistrarRecepcionAsync(proveedor.Id, DtoConTicket(6311)));

            // Assert
            Assert.Equal("El ticket 6311 ya está registrado (Tambo Las Acacias, 15/10/2026)", ex.Message);
            mockRepo.Verify(r => r.UpdateAsync(proveedor), Times.Once);
        }

        [Fact]
        public async Task GetByIdAsync_RecepcionWithAguaAndTicket_MapsThemAndLitrosAPagar()
        {
            // Arrange
            var mockRepo = new Mock<IProveedorRepository>();
            var service = new ProveedorAppService(mockRepo.Object);
            var proveedor = Proveedor.Crear("Tambo La Esperanza");
            var parametros = ParametrosCalidad.Create(null, 17m, 4m, 1000m, 10m);
            proveedor.RegistrarRecepcion(parametros, new DateTime(2026, 10, 1, 6, 0, 0), 1, null, 77);
            mockRepo.Setup(r => r.GetByIdAsync(proveedor.Id)).ReturnsAsync(proveedor);

            // Act
            var result = await service.GetByIdAsync(proveedor.Id);

            // Assert
            Assert.NotNull(result);
            var recepcion = Assert.Single(result.Recepciones);
            Assert.Equal(10m, recepcion.AguaPorcentaje);
            Assert.Equal(77, recepcion.Ticket);
            Assert.Equal(900m, recepcion.LitrosAPagar);
        }
    }
}