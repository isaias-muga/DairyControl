using System.Text.Json;
using DairyControl.Api.Middleware;
using DairyControl.Domain.Exceptions;
using Microsoft.AspNetCore.Http;

namespace DairyControl.Api.Tests
{
    public class ExceptionHandlingMiddlewareTests
    {
        private static async Task<(int Status, string? Error, string? Field)> Invoke(Exception exception)
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();
            var middleware = new ExceptionHandlingMiddleware(_ => throw exception);

            await middleware.InvokeAsync(context);

            context.Response.Body.Position = 0;
            using var json = await JsonDocument.ParseAsync(context.Response.Body);
            var field = json.RootElement.TryGetProperty("field", out var f) ? f.GetString() : null;
            return (context.Response.StatusCode, json.RootElement.GetProperty("error").GetString(), field);
        }

        [Fact]
        public async Task InvokeAsync_TicketDuplicadoException_Returns409WithMessage()
        {
            // Arrange
            var exception = new TicketDuplicadoException("El ticket 6311 ya está registrado (Tambo X, 11/10/2026)");

            // Act
            var (status, error, _) = await Invoke(exception);

            // Assert
            Assert.Equal(StatusCodes.Status409Conflict, status);
            Assert.Equal("El ticket 6311 ya está registrado (Tambo X, 11/10/2026)", error);
        }

        [Fact]
        public async Task InvokeAsync_ArgumentException_Returns400WithMessage()
        {
            // Act
            var (status, error, _) = await Invoke(new ArgumentException("Dato inválido"));

            // Assert
            Assert.Equal(StatusCodes.Status400BadRequest, status);
            Assert.Equal("Dato inválido", error);
        }

        [Fact]
        public async Task InvokeAsync_ArgumentExceptionWithParamName_Returns400WithoutParameterSuffixAndWithField()
        {
            // Act
            var (status, error, field) = await Invoke(new ArgumentException("La fecha y hora es obligatoria.", "fechaHora"));

            // Assert
            Assert.Equal(StatusCodes.Status400BadRequest, status);
            Assert.Equal("La fecha y hora es obligatoria.", error);
            Assert.Equal("fechaHora", field);
        }

        [Fact]
        public async Task InvokeAsync_UnexpectedException_Returns500WithGenericMessage()
        {
            // Act
            var (status, error, _) = await Invoke(new InvalidOperationException("detalle interno"));

            // Assert
            Assert.Equal(StatusCodes.Status500InternalServerError, status);
            Assert.DoesNotContain("detalle interno", error);
            Assert.Equal("Ocurrió un error inesperado.", error);
        }
    }
}
