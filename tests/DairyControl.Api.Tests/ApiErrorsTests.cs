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
        public void InvalidModelState_BodyRequiredAndJsonErrorTogether_ReportsTheJsonError()
        {
            // Act: the generic entry comes first, as the binder adds it
            var (_, error, field) = Invoke(m =>
            {
                m.AddModelError("dto", "The dto field is required.");
                m.TryAddModelException("$.fechaHora", new JsonException("The JSON value could not be converted"));
            });

            // Assert
            Assert.Equal("El valor de «fechaHora» no es válido.", error);
            Assert.Equal("fechaHora", field);
        }

        [Fact]
        public void InvalidModelState_JsonPathKeyWithEnglishMessage_ReturnsSpanishMessage()
        {
            // Act: the deserializer stores only the English message, no exception
            var (_, error, field) = Invoke(m => m.AddModelError("$.ticket", "The JSON value could not be converted to System.Nullable`1[System.Int32]. Path: $.ticket"));

            // Assert
            Assert.Equal("El valor de «ticket» no es válido.", error);
            Assert.Equal("ticket", field);
        }

        [Fact]
        public void InvalidModelState_EnglishRequiredMessageOnProperty_ReturnsSpanishMessage()
        {
            // Act
            var (_, error, field) = Invoke(m => m.AddModelError("Nombre", "The Nombre field is required."));

            // Assert
            Assert.Equal("El campo «nombre» es obligatorio.", error);
            Assert.Equal("nombre", field);
        }

        [Fact]
        public void InvalidModelState_UnparseableJson_ReturnsBodyMessageWithoutField()
        {
            // Act
            var (_, error, field) = Invoke(m => m.AddModelError("$", "'{' is invalid"));

            // Assert
            Assert.Equal(ApiErrors.CuerpoInvalido, error);
            Assert.Null(field);
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
    }
}
