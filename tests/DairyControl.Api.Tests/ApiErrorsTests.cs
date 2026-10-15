using System.Text.Json;
using DairyControl.Api.Validation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Mvc.Controllers;

namespace DairyControl.Api.Tests
{
    public class ApiErrorsTests
    {
        private static (int? Status, string Error, string? Field) Invoke(Action<ModelStateDictionary> fill, string bodyParameter = "dto")
        {
            var descriptor = new ControllerActionDescriptor
            {
                Parameters = [new ParameterDescriptor { Name = bodyParameter, ParameterType = typeof(object), BindingInfo = new() { BindingSource = BindingSource.Body } }]
            };
            var context = new ActionContext(new DefaultHttpContext(), new RouteData(), descriptor);
            fill(context.ModelState);

            var result = Assert.IsType<BadRequestObjectResult>(ApiErrors.InvalidModelState(context));

            using var json = JsonDocument.Parse(JsonSerializer.Serialize(result.Value));
            var field = json.RootElement.TryGetProperty("field", out var f) ? f.GetString() : null;
            return (result.StatusCode, json.RootElement.GetProperty("error").GetString()!, field);
        }

        [Fact]
        public void InvalidModelState_MissingBody_ReturnsSpanishMessageWithoutField()
        {
            // Act
            var (status, error, field) = Invoke(m => m.AddModelError("dto", "The dto field is required."));

            // Assert
            Assert.Equal(StatusCodes.Status400BadRequest, status);
            Assert.Equal(ApiErrors.CuerpoObligatorio, error);
            Assert.Null(field);
        }

        [Fact]
        public void InvalidModelState_JsonConversionError_ReturnsSpanishMessageWithCamelCaseField()
        {
            // Act
            var (_, error, field) = Invoke(m => m.TryAddModelException("$.fechaHora", new JsonException("The JSON value could not be converted to System.DateTime. Path: $.fechaHora")));

            // Assert
            Assert.Equal("El valor de «fechaHora» no es válido.", error);
            Assert.Equal("fechaHora", field);
        }

        [Fact]
        public void InvalidModelState_BindingMessage_KeepsMessageAndNamesField()
        {
            // Act
            var (_, error, field) = Invoke(m => m.AddModelError("Desde", "Falta el valor de «desde»."), "dto");

            // Assert
            Assert.Equal("Falta el valor de «desde».", error);
            Assert.Equal("desde", field);
        }

        [Fact]
        public void Message_ArgumentExceptionWithParamName_RemovesParameterSuffix()
        {
            // Act
            var result = ApiErrors.Message(new ArgumentException("Los litros deben estar entre 0.001 y 30000.", "litros"));

            // Assert
            Assert.Equal("Los litros deben estar entre 0.001 y 30000.", result);
        }
    }
}
