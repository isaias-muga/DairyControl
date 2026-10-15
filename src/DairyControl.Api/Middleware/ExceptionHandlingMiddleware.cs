using DairyControl.Api.Validation;
using DairyControl.Domain.Exceptions;
using System.Text.Json;
namespace DairyControl.Api.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionHandlingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (ArgumentException ex)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                context.Response.ContentType = "application/json";
                var json = JsonSerializer.Serialize(ApiErrors.Body(ApiErrors.Message(ex), ex.ParamName));
                await context.Response.WriteAsync(json);
            }
            catch (TicketDuplicadoException ex)
            {
                context.Response.StatusCode = StatusCodes.Status409Conflict;
                context.Response.ContentType = "application/json";
                var json = JsonSerializer.Serialize(ApiErrors.Body(ex.Message));
                await context.Response.WriteAsync(json);
            }
            catch (Exception ex)
            {
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";
                var json = JsonSerializer.Serialize(ApiErrors.Body("Ocurrió un error inesperado.")); //loggin gap here
                await context.Response.WriteAsync(json);
            }
        }
    }
}
