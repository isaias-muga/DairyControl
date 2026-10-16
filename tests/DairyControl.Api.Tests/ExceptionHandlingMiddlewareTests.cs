using System.Text.Json;
using DairyControl.Api.Middleware;
using DairyControl.Domain.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace DairyControl.Api.Tests
{
    public class ExceptionHandlingMiddlewareTests
    {
        private sealed record Entrada(LogLevel Nivel, string Mensaje, Exception? Excepcion);

        private sealed class LoggerEnMemoria : ILogger<ExceptionHandlingMiddleware>
        {
            public List<Entrada> Entradas { get; } = [];

            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

            public bool IsEnabled(LogLevel logLevel) => true;

            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) =>
                Entradas.Add(new Entrada(logLevel, formatter(state, exception), exception));
        }

        private sealed record Respuesta(int Status, JsonElement Cuerpo, LoggerEnMemoria Logger)
        {
            public string? Error => Cuerpo.GetProperty("error").GetString();

            public string? Texto(string propiedad) =>
                Cuerpo.TryGetProperty(propiedad, out var valor) ? valor.GetString() : null;
        }

        private static async Task<Respuesta> Invoke(Exception exception, Action<DefaultHttpContext>? preparar = null)
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();
            preparar?.Invoke(context);
            var logger = new LoggerEnMemoria();
            var middleware = new ExceptionHandlingMiddleware(_ => throw exception, logger);

            await middleware.InvokeAsync(context);

            context.Response.Body.Position = 0;
            using var json = await JsonDocument.ParseAsync(context.Response.Body, cancellationToken: TestContext.Current.CancellationToken);
            return new Respuesta(context.Response.StatusCode, json.RootElement.Clone(), logger);
        }

        [Fact]
        public async Task InvokeAsync_TicketDuplicadoException_Returns409WithMessage()
        {
            // Arrange
            var exception = new TicketDuplicadoException("El ticket 6311 ya está registrado (Tambo X, 11/10/2026)");

            // Act
            var respuesta = await Invoke(exception);

            // Assert
            Assert.Equal(StatusCodes.Status409Conflict, respuesta.Status);
            Assert.Equal("El ticket 6311 ya está registrado (Tambo X, 11/10/2026)", respuesta.Error);
            Assert.Empty(respuesta.Logger.Entradas);
        }

        [Fact]
        public async Task InvokeAsync_ConflictoDeConcurrenciaException_Returns409WithMessage()
        {
            // Act
            var respuesta = await Invoke(new ConflictoDeConcurrenciaException());

            // Assert
            Assert.Equal(StatusCodes.Status409Conflict, respuesta.Status);
            Assert.Equal("Los límites fueron modificados por otro usuario. Recargá la página.", respuesta.Error);
            Assert.Null(respuesta.Texto("field"));
            Assert.Empty(respuesta.Logger.Entradas);
        }

        [Fact]
        public async Task InvokeAsync_ReglaDeNegocioExceptionWithoutCampo_Returns400WithoutField()
        {
            // Act
            var respuesta = await Invoke(new ReglaDeNegocioException("Dato inválido"));

            // Assert
            Assert.Equal(StatusCodes.Status400BadRequest, respuesta.Status);
            Assert.Equal("Dato inválido", respuesta.Error);
            Assert.False(respuesta.Cuerpo.TryGetProperty("field", out _));
        }

        [Fact]
        public async Task InvokeAsync_ReglaDeNegocioExceptionWithCampo_Returns400WithField()
        {
            // Act
            var respuesta = await Invoke(new ReglaDeNegocioException("La fecha y hora es obligatoria.", "fechaHora"));

            // Assert
            Assert.Equal(StatusCodes.Status400BadRequest, respuesta.Status);
            Assert.Equal("La fecha y hora es obligatoria.", respuesta.Error);
            Assert.Equal("fechaHora", respuesta.Texto("field"));
            Assert.Empty(respuesta.Logger.Entradas);
        }

        [Fact]
        public async Task InvokeAsync_ArgumentException_Returns500AndIsLoggedBecauseItIsABug()
        {
            // Act
            var respuesta = await Invoke(new ArgumentException("Dato inválido", "litros"));

            // Assert
            Assert.Equal(StatusCodes.Status500InternalServerError, respuesta.Status);
            Assert.Equal("Ocurrió un error inesperado.", respuesta.Error);
            Assert.Single(respuesta.Logger.Entradas, e => e.Nivel == LogLevel.Error);
        }

        [Fact]
        public async Task InvokeAsync_UnexpectedException_Returns500WithGenericMessageAndTraceId()
        {
            // Act
            var respuesta = await Invoke(
                new InvalidOperationException("detalle interno"),
                context => context.TraceIdentifier = "traza-123");

            // Assert
            Assert.Equal(StatusCodes.Status500InternalServerError, respuesta.Status);
            Assert.Equal("Ocurrió un error inesperado.", respuesta.Error);
            Assert.DoesNotContain("detalle interno", respuesta.Cuerpo.GetRawText());
            Assert.False(string.IsNullOrEmpty(respuesta.Texto("traceId")));
        }

        [Fact]
        public async Task InvokeAsync_UnexpectedException_LogsAnErrorWithTheExceptionMethodPathAndTraceId()
        {
            // Arrange
            var exception = new InvalidOperationException("detalle interno");

            // Act
            var respuesta = await Invoke(exception, context =>
            {
                context.TraceIdentifier = "traza-123";
                context.Request.Method = "PUT";
                context.Request.Path = "/api/Configuracion/calidad";
            });

            // Assert
            var entrada = Assert.Single(respuesta.Logger.Entradas);
            Assert.Equal(LogLevel.Error, entrada.Nivel);
            Assert.Same(exception, entrada.Excepcion);
            Assert.Contains("PUT", entrada.Mensaje);
            Assert.Contains("/api/Configuracion/calidad", entrada.Mensaje);
            Assert.Contains(respuesta.Texto("traceId")!, entrada.Mensaje);
        }

        [Fact]
        public async Task InvokeAsync_UnexpectedException_NeverLogsTheRequestBodyQueryOrAuthorization()
        {
            // Arrange
            var exception = new InvalidOperationException("fallo");

            // Act
            var respuesta = await Invoke(exception, context =>
            {
                context.Request.Method = "POST";
                context.Request.Path = "/api/Auth/login";
                context.Request.QueryString = new QueryString("?token=secreto-en-query");
                context.Request.Headers.Authorization = "Bearer secreto-en-cabecera";
                context.Request.Body = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("{\"password\":\"secreto-en-cuerpo\"}"));
            });

            // Assert
            var entrada = Assert.Single(respuesta.Logger.Entradas);
            Assert.DoesNotContain("secreto", entrada.Mensaje);
        }

        [Fact]
        public async Task InvokeAsync_ClientAborted_DoesNotLogAnErrorNorWriteAnError()
        {
            // Arrange
            using var cancelacion = new CancellationTokenSource();
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();
            context.RequestAborted = cancelacion.Token;
            var logger = new LoggerEnMemoria();
            var middleware = new ExceptionHandlingMiddleware(_ =>
            {
                cancelacion.Cancel();
                throw new OperationCanceledException(cancelacion.Token);
            }, logger);

            // Act
            await middleware.InvokeAsync(context);

            // Assert
            Assert.Empty(logger.Entradas);
            Assert.Equal(0, context.Response.Body.Length);
        }
    }
}
