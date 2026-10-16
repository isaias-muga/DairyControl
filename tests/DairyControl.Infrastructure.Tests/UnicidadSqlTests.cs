using DairyControl.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace DairyControl.Infrastructure.Tests
{
    public class UnicidadSqlTests
    {
        [Theory]
        [InlineData(2601, true)]
        [InlineData(2627, true)]
        [InlineData(547, false)]
        [InlineData(1205, false)]
        public void EsNumeroDeUnicidad_ErrorNumber_ClassifiesUniqueViolations(int numeroError, bool esperado)
        {
            // Act
            var result = UnicidadSql.EsNumeroDeUnicidad(numeroError);

            // Assert
            Assert.Equal(esperado, result);
        }

        [Fact]
        public void EsViolacion_NonSqlInnerException_ReturnsFalse()
        {
            // Arrange
            var ex = new DbUpdateException("fallo", new InvalidOperationException());

            // Act
            var result = UnicidadSql.EsViolacion(ex);

            // Assert
            Assert.False(result);
        }
    }
}
