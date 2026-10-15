using DairyControl.Application.DTOs;
using DairyControl.Application.Services;
using DairyControl.Domain.Entities;
using DairyControl.Domain.Interfaces;
using DairyControl.Domain.ValueObjects;
using Moq;

namespace DairyControl.Application.Tests
{
    public class ConfiguracionCalidadAppServiceTests
    {
        private static ConfiguracionCalidad Configuracion(DateTime? actualizadoEn = null) =>
            ConfiguracionCalidad.Crear(
                LimitesCalidad.Create(19m, 20m, 0m),
                actualizadoEn ?? new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc));

        [Fact]
        public async Task GetAsync_ConfiguracionExists_ReturnsLimitsAndLastUpdate()
        {
            // Arrange
            var actualizadoEn = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
            var mockRepo = new Mock<IConfiguracionCalidadRepository>();
            mockRepo.Setup(r => r.GetAsync()).ReturnsAsync(Configuracion(actualizadoEn));
            var service = new ConfiguracionCalidadAppService(mockRepo.Object);

            // Act
            var result = await service.GetAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(19m, result.AcidezMaxima);
            Assert.Equal(20m, result.TemperaturaMaxima);
            Assert.Equal(0m, result.AguaMaxima);
            Assert.Equal(actualizadoEn, result.ActualizadoEn);
            mockRepo.Verify(r => r.UpdateAsync(It.IsAny<ConfiguracionCalidad>()), Times.Never);
        }

        [Fact]
        public async Task GetAsync_ConfiguracionMissing_ReturnsNull()
        {
            // Arrange
            var mockRepo = new Mock<IConfiguracionCalidadRepository>();
            mockRepo.Setup(r => r.GetAsync()).ReturnsAsync((ConfiguracionCalidad?)null);
            var service = new ConfiguracionCalidadAppService(mockRepo.Object);

            // Act
            var result = await service.GetAsync();

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task ActualizarAsync_ValidLimits_UpdatesAndReturnsNewValues()
        {
            // Arrange
            var configuracion = Configuracion();
            var mockRepo = new Mock<IConfiguracionCalidadRepository>();
            mockRepo.Setup(r => r.GetAsync()).ReturnsAsync(configuracion);
            var service = new ConfiguracionCalidadAppService(mockRepo.Object);
            var dto = new ActualizarLimitesCalidadDto { AcidezMaxima = 18m, TemperaturaMaxima = 8m, AguaMaxima = 1.5m };

            // Act
            var result = await service.ActualizarAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(18m, result.AcidezMaxima);
            Assert.Equal(8m, result.TemperaturaMaxima);
            Assert.Equal(1.5m, result.AguaMaxima);
            Assert.True(result.ActualizadoEn > new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc));
            Assert.Equal(18m, configuracion.Limites.AcidezMaxima);
            mockRepo.Verify(r => r.UpdateAsync(configuracion), Times.Once);
        }

        [Fact]
        public async Task ActualizarAsync_InvalidLimits_ThrowsAndNeverCallsUpdate()
        {
            // Arrange
            var mockRepo = new Mock<IConfiguracionCalidadRepository>();
            mockRepo.Setup(r => r.GetAsync()).ReturnsAsync(Configuracion());
            var service = new ConfiguracionCalidadAppService(mockRepo.Object);
            var dto = new ActualizarLimitesCalidadDto { AcidezMaxima = 5m, TemperaturaMaxima = 20m, AguaMaxima = 0m };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.ActualizarAsync(dto));
            Assert.Equal("acidezMaxima", ex.ParamName);
            mockRepo.Verify(r => r.UpdateAsync(It.IsAny<ConfiguracionCalidad>()), Times.Never);
        }

        [Fact]
        public async Task ActualizarAsync_ConfiguracionMissing_ReturnsNullAndNeverCallsUpdate()
        {
            // Arrange
            var mockRepo = new Mock<IConfiguracionCalidadRepository>();
            mockRepo.Setup(r => r.GetAsync()).ReturnsAsync((ConfiguracionCalidad?)null);
            var service = new ConfiguracionCalidadAppService(mockRepo.Object);
            var dto = new ActualizarLimitesCalidadDto { AcidezMaxima = 19m, TemperaturaMaxima = 20m, AguaMaxima = 0m };

            // Act
            var result = await service.ActualizarAsync(dto);

            // Assert
            Assert.Null(result);
            mockRepo.Verify(r => r.UpdateAsync(It.IsAny<ConfiguracionCalidad>()), Times.Never);
        }
    }
}
